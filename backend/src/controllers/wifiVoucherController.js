const pool = require('../config/database');
const { randomUUID } = require('crypto');

const fail = (res, status, error) => res.status(status).json({ success: false, error });
const ownerCanManage = async (db, networkId, userId) => {
  const result = await db.query('SELECT id FROM wifi_networks WHERE id=$1 AND owner_id=$2', [networkId, userId]);
  return result.rows.length > 0;
};

exports.listNetworks = async (_req, res) => {
  try {
    const result = await pool.query(`SELECT n.id,n.name,n.description,n.address,n.created_at,
      COUNT(DISTINCT c.id)::int AS category_count,
      COALESCE(SUM(CASE WHEN v.status='available' THEN 1 ELSE 0 END),0)::int AS available_vouchers
      FROM wifi_networks n LEFT JOIN wifi_voucher_categories c ON c.network_id=n.id AND c.is_active=TRUE
      LEFT JOIN wifi_vouchers v ON v.category_id=c.id
      WHERE n.status='approved' GROUP BY n.id ORDER BY n.name`);
    res.json({ success: true, networks: result.rows });
  } catch (e) { console.error('listNetworks', e.message); fail(res, 500, 'Could not load networks'); }
};

exports.registerNetwork = async (req, res) => {
  const b = req.body || {};
  const fullName = String(b.fullName || '').trim();
  const activity = String(b.businessActivity || '').trim();
  const address = String(b.address || '').trim();
  const documentType = String(b.documentType || '');
  const front = String(b.documentFrontUrl || '').trim();
  const back = String(b.documentBackUrl || '').trim();
  if (fullName.length < 4 || activity.length < 2 || address.length < 4) return fail(res, 400, 'Full name, business activity and address are required.');
  if (!['national_id','passport','family_card','commercial_registration'].includes(documentType)) return fail(res, 400, 'Unsupported document type.');
  if (!front || !/^https:\/\//i.test(front) || (back && !/^https:\/\//i.test(back))) return fail(res, 400, 'Upload documents to private storage and provide secure HTTPS URLs.');
  if (documentType !== 'passport' && !back) return fail(res, 400, 'Both sides of the document are required.');
  if (b.termsAccepted !== true) return fail(res, 400, 'You must accept the terms and privacy policy.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT id,status FROM network_registrations WHERE owner_id=$1 FOR UPDATE', [req.user.id]);
    if (existing.rowCount && existing.rows[0].status !== 'rejected') {
      await client.query('ROLLBACK');
      return fail(res, 409, 'A pending or approved network registration already exists for this account.');
    }
    let registration;
    if (existing.rowCount) {
      registration = await client.query(`UPDATE network_registrations SET full_name=$1,business_activity=$2,address=$3,
        distributor_account_number=$4,document_type=$5,document_front_url=$6,document_back_url=$7,terms_accepted=TRUE,
        status='pending',reviewed_by=NULL,reviewed_at=NULL,review_note=NULL,updated_at=NOW() WHERE id=$8 RETURNING id,status`,
        [fullName,activity,address,b.distributorAccountNumber || null,documentType,front,back || null,existing.rows[0].id]);
      await client.query(`UPDATE wifi_networks SET name=$1,description=$2,address=$3,status='pending',updated_at=NOW() WHERE registration_id=$4`,
        [String(b.networkName || `${fullName} Network`).trim().slice(0,200),b.networkDescription || null,address,existing.rows[0].id]);
    } else {
      registration = await client.query(`INSERT INTO network_registrations
        (owner_id,full_name,business_activity,address,distributor_account_number,document_type,document_front_url,document_back_url,terms_accepted)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE) RETURNING id,status`,
        [req.user.id, fullName, activity, address, b.distributorAccountNumber || null, documentType, front, back || null]);
      const networkName = String(b.networkName || `${fullName} Network`).trim().slice(0, 200);
      await client.query(`INSERT INTO wifi_networks(owner_id,registration_id,name,description,address,status)
        VALUES($1,$2,$3,$4,$5,'pending')`, [req.user.id, registration.rows[0].id, networkName, b.networkDescription || null, address]);
    }
    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Registration submitted and is awaiting admin review.', registration: registration.rows[0] });
  } catch (e) { await client.query('ROLLBACK'); console.error('registerNetwork', e.message); fail(res, 500, 'Could not submit network registration'); }
  finally { client.release(); }
};

exports.listMyNetworks = async (req, res) => {
  try {
    const r = await pool.query('SELECT id,name,description,address,status,created_at FROM wifi_networks WHERE owner_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, networks: r.rows });
  } catch (e) { console.error(e.message); fail(res, 500, 'Could not load your networks'); }
};


exports.networkReport = async (req, res) => {
  try {
    if (!(await ownerCanManage(pool, req.params.networkId, req.user.id))) return fail(res, 403, 'You do not own this network.');
    const result = await pool.query(`SELECT
      COUNT(DISTINCT c.id)::int AS categories,
      COUNT(v.id) FILTER (WHERE v.status='available')::int AS available_vouchers,
      COUNT(v.id) FILTER (WHERE v.status='sold')::int AS sold_vouchers,
      COUNT(DISTINCT p.id)::int AS completed_sales,
      COALESCE(SUM(p.gross_amount) FILTER (WHERE p.status='completed'),0)::numeric(14,2) AS gross_sales,
      COALESCE(SUM(p.platform_commission) FILTER (WHERE p.status='completed'),0)::numeric(14,2) AS platform_commission
      FROM wifi_networks n
      LEFT JOIN wifi_voucher_categories c ON c.network_id=n.id
      LEFT JOIN wifi_vouchers v ON v.category_id=c.id
      LEFT JOIN wifi_voucher_purchases p ON p.voucher_id=v.id
      WHERE n.id=$1 GROUP BY n.id`, [req.params.networkId]);
    res.json({ success:true, report: result.rows[0] || { categories:0,available_vouchers:0,sold_vouchers:0,completed_sales:0,gross_sales:'0.00',platform_commission:'0.00' } });
  } catch (e) { console.error('networkReport',e.message); fail(res,500,'Could not load network report'); }
};

exports.adminListRegistrations = async (_req, res) => {
  try {
    const r = await pool.query(`SELECT r.*,u.phone,u.email,n.id AS network_id,n.name AS network_name
      FROM network_registrations r JOIN users u ON u.id=r.owner_id
      LEFT JOIN wifi_networks n ON n.registration_id=r.id ORDER BY r.created_at DESC`);
    res.json({ success: true, registrations: r.rows });
  } catch (e) { console.error(e.message); fail(res, 500, 'Could not load registrations'); }
};

exports.reviewRegistration = async (req, res) => {
  const { decision, note } = req.body || {};
  if (!['approved','rejected'].includes(decision)) return fail(res, 400, 'Decision must be approved or rejected.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query('SELECT id,owner_id FROM network_registrations WHERE id=$1 FOR UPDATE', [req.params.registrationId]);
    if (!r.rowCount) { await client.query('ROLLBACK'); return fail(res, 404, 'Registration not found'); }
    await client.query(`UPDATE network_registrations SET status=$1,reviewed_by=$2,reviewed_at=NOW(),review_note=$3,updated_at=NOW() WHERE id=$4`, [decision, req.user.id, note || null, req.params.registrationId]);
    await client.query(`UPDATE wifi_networks SET status=$1,updated_at=NOW() WHERE registration_id=$2`, [decision, req.params.registrationId]);
    await client.query('COMMIT');
    res.json({ success: true, message: `Registration ${decision}`, status: decision });
  } catch (e) { await client.query('ROLLBACK'); console.error(e.message); fail(res, 500, 'Could not review registration'); }
  finally { client.release(); }
};

exports.listCategories = async (req, res) => {
  try {
    const r = await pool.query(`SELECT c.id,c.network_id,c.name,c.denomination,c.data_allowance,c.validity,c.sale_price,
      COUNT(v.id) FILTER (WHERE v.status='available')::int AS available_count
      FROM wifi_voucher_categories c JOIN wifi_networks n ON n.id=c.network_id
      LEFT JOIN wifi_vouchers v ON v.category_id=c.id
      WHERE c.network_id=$1 AND c.is_active=TRUE AND n.status='approved'
      GROUP BY c.id ORDER BY c.sale_price`, [req.params.networkId]);
    res.json({ success: true, categories: r.rows });
  } catch (e) { console.error(e.message); fail(res, 500, 'Could not load voucher categories'); }
};

exports.createCategory = async (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const denomination = Number(b.denomination);
  const salePrice = Number(b.salePrice);
  if (!name || name.length > 120 || !Number.isFinite(denomination) || denomination < 0 || !Number.isFinite(salePrice) || salePrice <= 0) return fail(res, 400, 'Valid name, non-negative denomination and positive sale price are required.');
  try {
    if (!(await ownerCanManage(pool, req.params.networkId, req.user.id))) return fail(res, 403, 'You do not own this network.');
    const n = await pool.query('SELECT status FROM wifi_networks WHERE id=$1', [req.params.networkId]);
    if (n.rows[0]?.status !== 'approved') return fail(res, 409, 'Network must be approved before adding categories.');
    const r = await pool.query(`INSERT INTO wifi_voucher_categories(network_id,name,denomination,data_allowance,validity,sale_price)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING *`, [req.params.networkId,name,denomination,b.dataAllowance || null,b.validity || null,salePrice]);
    res.status(201).json({ success: true, category: r.rows[0] });
  } catch (e) { if (e.code === '23505') return fail(res, 409, 'Category name already exists for this network.'); console.error(e.message); fail(res, 500, 'Could not create category'); }
};

exports.addVouchers = async (req, res) => {
  const entries = Array.isArray(req.body?.vouchers) ? req.body.vouchers : [];
  if (!entries.length || entries.length > 500) return fail(res, 400, 'Provide between 1 and 500 vouchers.');
  if (entries.some(v => !String(v.code || '').trim() || String(v.code).length > 500 || (v.secret && String(v.secret).length > 500))) return fail(res, 400, 'Every voucher must have a valid code and optional secret.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const c = await client.query(`SELECT c.id,n.owner_id,n.status FROM wifi_voucher_categories c JOIN wifi_networks n ON n.id=c.network_id WHERE c.id=$1 FOR UPDATE`, [req.params.categoryId]);
    if (!c.rowCount || c.rows[0].owner_id !== req.user.id) { await client.query('ROLLBACK'); return fail(res, 403, 'Category not found or not owned by you.'); }
    if (c.rows[0].status !== 'approved') { await client.query('ROLLBACK'); return fail(res, 409, 'Network must be approved first.'); }
    // Codes are not encrypted by this app yet; never accept plaintext unless an encryption key is configured.
    const voucherCrypto = require('../services/voucherCrypto');
    try { voucherCrypto.keyFromEnv(); }
    catch (_keyError) { await client.query('ROLLBACK'); return fail(res, 503, 'Voucher encryption is not configured. Set VOUCHER_ENCRYPTION_KEY to a stable 32-byte hex key.'); }
    for (const v of entries) await client.query('INSERT INTO wifi_vouchers(category_id,code_ciphertext,secret_ciphertext) VALUES($1,$2,$3)', [req.params.categoryId,voucherCrypto.encryptVoucher(v.code),v.secret ? voucherCrypto.encryptVoucher(v.secret) : null]);
    await client.query('COMMIT');
    res.status(201).json({ success: true, inserted: entries.length });
  } catch (e) { await client.query('ROLLBACK'); console.error(e.message); fail(res, 500, 'Could not add voucher inventory'); }
  finally { client.release(); }
};

exports.purchaseVoucher = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const v = await client.query(`SELECT v.id,v.category_id,c.network_id,c.sale_price,n.owner_id,n.status AS network_status
      FROM wifi_vouchers v JOIN wifi_voucher_categories c ON c.id=v.category_id JOIN wifi_networks n ON n.id=c.network_id
      WHERE (($1::uuid IS NOT NULL AND v.id=$1::uuid) OR ($2::uuid IS NOT NULL AND c.id=$2::uuid)) AND v.status='available' AND c.is_active=TRUE
      ORDER BY v.created_at ASC LIMIT 1 FOR UPDATE OF v`, [req.params.voucherId || null, req.params.categoryId || null]);
    if (!v.rowCount) { await client.query('ROLLBACK'); return fail(res, 409, 'Voucher is unavailable or already sold.'); }
    const voucher = v.rows[0];
    if (voucher.network_status !== 'approved') { await client.query('ROLLBACK'); return fail(res, 409, 'Network is not available for sale.'); }
    const price = Number(voucher.sale_price);
    if (!Number.isFinite(price) || price < 0) { await client.query('ROLLBACK'); return fail(res, 500, 'Invalid voucher price.'); }
    await client.query('INSERT INTO wallet_accounts(user_id,balance) VALUES($1,0) ON CONFLICT(user_id) DO NOTHING', [req.user.id]);
    const wallet = await client.query('SELECT balance FROM wallet_accounts WHERE user_id=$1 FOR UPDATE', [req.user.id]);
    if (Number(wallet.rows[0].balance) < price) { await client.query('ROLLBACK'); return fail(res, 402, 'Insufficient wallet balance.'); }
    const purchaseId = randomUUID();
    const newBalance = Number(wallet.rows[0].balance) - price;
    await client.query('UPDATE wallet_accounts SET balance=$1,updated_at=NOW() WHERE user_id=$2', [newBalance,req.user.id]);
    await client.query(`INSERT INTO wifi_voucher_purchases(id,buyer_id,network_id,category_id,voucher_id,gross_amount,platform_commission,seller_amount)
      VALUES($1,$2,$3,$4,$5,$6,0,$6)`, [purchaseId,req.user.id,voucher.network_id,voucher.category_id,voucher.id,price]);
    await client.query(`INSERT INTO wallet_transactions(user_id,type,amount,balance_after,reference_id,description)
      VALUES($1,'voucher_purchase',$2,$3,$4,$5)`, [req.user.id,-price,newBalance,purchaseId,`Voucher purchase ${voucher.id}`]);
    // Credit the network owner the full sale amount. If the owner buys from their own
    // network, debit and credit are both recorded on the same wallet in this transaction.
    await client.query('INSERT INTO wallet_accounts(user_id,balance) VALUES($1,0) ON CONFLICT(user_id) DO NOTHING', [voucher.owner_id]);
    const sellerWallet = await client.query('SELECT balance FROM wallet_accounts WHERE user_id=$1 FOR UPDATE', [voucher.owner_id]);
    const sellerBalance = Number(sellerWallet.rows[0].balance) + price;
    await client.query('UPDATE wallet_accounts SET balance=$1,updated_at=NOW() WHERE user_id=$2', [sellerBalance,voucher.owner_id]);
    await client.query(`INSERT INTO wallet_transactions(user_id,type,amount,balance_after,reference_id,description)
      VALUES($1,'voucher_sale',$2,$3,$4,$5)`, [voucher.owner_id,price,sellerBalance,purchaseId,`Voucher sale ${voucher.id}; platform commission 0%`]);
    await client.query(`UPDATE wifi_vouchers SET status='sold',sold_to=$1,sold_at=NOW(),purchase_id=$2 WHERE id=$3`, [req.user.id,purchaseId,voucher.id]);
    // Owner can buy from their own network. The platform takes no commission in all cases.
    const voucherCrypto = require('../services/voucherCrypto');
    const secretRow = await client.query('SELECT code_ciphertext,secret_ciphertext FROM wifi_vouchers WHERE id=$1', [voucher.id]);
    const code = voucherCrypto.decryptVoucher(secretRow.rows[0].code_ciphertext);
    const secret = voucherCrypto.decryptVoucher(secretRow.rows[0].secret_ciphertext);
    if (!code) throw new Error('Voucher decryption failed; check VOUCHER_ENCRYPTION_KEY');
    await client.query('COMMIT');
    res.status(201).json({ success: true, purchase: { id: purchaseId, amount: price, platformCommission: 0, sellerAmount: price, balanceAfter: newBalance }, voucher: { code, secret } });
  } catch (e) { await client.query('ROLLBACK'); console.error('purchaseVoucher', e.message); fail(res, 500, 'Purchase could not be completed; no wallet changes were committed.'); }
  finally { client.release(); }
};

exports.myPurchases = async (req, res) => {
  try {
    const r = await pool.query(`SELECT p.id,p.gross_amount,p.platform_commission,p.seller_amount,p.status,p.created_at,
      n.name AS network_name,c.name AS category_name
      FROM wifi_voucher_purchases p JOIN wifi_networks n ON n.id=p.network_id
      JOIN wifi_voucher_categories c ON c.id=p.category_id JOIN wifi_vouchers v ON v.id=p.voucher_id
      WHERE p.buyer_id=$1 ORDER BY p.created_at DESC`, [req.user.id]);
    res.json({ success: true, purchases: r.rows.map(p => ({ id:p.id,amount:p.gross_amount,platformCommission:0,sellerAmount:p.seller_amount,status:p.status,createdAt:p.created_at,networkName:p.network_name,categoryName:p.category_name })) });
  } catch (e) { console.error(e.message); fail(res, 500, 'Could not load purchase history'); }
};


exports.getWallet = async (req, res) => {
  try {
    const w = await pool.query('SELECT balance,currency,updated_at FROM wallet_accounts WHERE user_id=$1', [req.user.id]);
    const t = await pool.query(`SELECT id,type,amount,balance_after,reference_id,description,created_at
      FROM wallet_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`, [req.user.id]);
    res.json({ success:true, wallet:w.rows[0] || { balance:'0.00', currency:'YER' }, transactions:t.rows });
  } catch (e) { console.error(e.message); fail(res,500,'Could not load wallet'); }
};

exports.adminTestCredit = async (req, res) => {
  if (process.env.NODE_ENV === 'production') return fail(res, 403, 'Test wallet credits are disabled in production.');
  const { userId, amount, description } = req.body || {};
  const value = Number(amount);
  if (!userId || !Number.isFinite(value) || value <= 0 || value > 10000000) return fail(res, 400, 'Valid userId and positive test amount are required.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await client.query('SELECT id FROM users WHERE id=$1', [userId]);
    if (!user.rowCount) { await client.query('ROLLBACK'); return fail(res, 404, 'User not found'); }
    await client.query('INSERT INTO wallet_accounts(user_id,balance) VALUES($1,0) ON CONFLICT(user_id) DO NOTHING', [userId]);
    const w = await client.query('SELECT balance FROM wallet_accounts WHERE user_id=$1 FOR UPDATE', [userId]);
    if (!w.rowCount) { await client.query('ROLLBACK'); return fail(res, 404, 'User not found'); }
    const balance = Number(w.rows[0].balance)+value;
    await client.query('UPDATE wallet_accounts SET balance=$1,updated_at=NOW() WHERE user_id=$2',[balance,userId]);
    await client.query(`INSERT INTO wallet_transactions(user_id,type,amount,balance_after,description,created_by) VALUES($1,'test_credit',$2,$3,$4,$5)`, [userId,value,balance,description || 'Development test credit',req.user.id]);
    await client.query('COMMIT'); res.json({ success:true,balance,currency:'YER',testOnly:true });
  } catch (e) { await client.query('ROLLBACK'); console.error(e.message); fail(res,500,'Test credit failed'); }
  finally { client.release(); }
};
