// ==================== SETTLEMENT SERVICE ====================
// Handles commission calculation and vendor settlement logic

const pool = require('../config/database');

// ==================== COMMISSION CONFIGURATION ====================

// Get applicable commission rate for a vendor/product
const commissionPolicy = require('./commissionPolicy');

exports.getApplicableCommission = async (_vendorId, _categoryId) => commissionPolicy.applicableCommission();

// Set vendor-specific commission
exports.setVendorCommission = async (vendorId, commissionRate, commissionType = 'percentage') => {
  const policy = commissionPolicy.setCommission(vendorId, commissionRate, 'vendor');
  if (!policy.success) return policy;
  return { success: true, config: { ...policy.config, vendor_id: vendorId, commission_type: commissionType } };
};

exports.setCategoryCommission = async (categoryId, commissionRate, commissionType = 'percentage') => {
  const policy = commissionPolicy.setCommission(categoryId, commissionRate, 'category');
  if (!policy.success) return policy;
  return { success: true, config: { ...policy.config, category_id: categoryId, commission_type: commissionType } };
};

exports.setGlobalCommission = async (commissionRate, commissionType = 'percentage') => {
  const policy = commissionPolicy.setCommission(null, commissionRate, 'global');
  if (!policy.success) return policy;
  return { success: true, config: { ...policy.config, commission_type: commissionType } };
};

// Get all commission configs
exports.getCommissionConfigs = async () => {
  try {
    const result = await pool.query(`
      SELECT cc.*, 
             u.first_name || ' ' || u.last_name as vendor_name,
             u.email as vendor_email,
             c.name as category_name
      FROM commission_config cc
      LEFT JOIN users u ON cc.vendor_id = u.id
      LEFT JOIN categories c ON cc.category_id = c.id
      ORDER BY 
        CASE cc.config_type 
          WHEN 'vendor' THEN 1 
          WHEN 'category' THEN 2 
          WHEN 'global' THEN 3 
        END,
        cc.created_at DESC
    `);
    
    return { success: true, configs: result.rows };
  } catch (error) {
    console.error('Get commission configs error:', error);
    return { success: false, error: error.message };
  }
};

// ==================== COMMISSION CALCULATION ====================

// Calculate commission for an order
exports.calculateCommission = async (orderId) => {
  try {
    // Get order items with product and vendor info
    const orderItems = await pool.query(`
      SELECT oi.*, p.vendor_id, p.category_id, p.name as product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [orderId]);
    
    const results = [];
    let totalCommission = 0;
    let totalNetAmount = 0;
    
    for (const item of orderItems.rows) {
      // Get applicable commission rate
      const commission = await this.getApplicableCommission(item.vendor_id, item.category_id);
      
      const grossAmount = parseFloat(item.price) * parseInt(item.quantity);
      let commissionAmount = 0;
      let netAmount = grossAmount;
      
      if (commission.commissionType === 'percentage') {
        commissionAmount = grossAmount * (commission.commissionRate / 100);
        netAmount = grossAmount - commissionAmount;
      } else {
        commissionAmount = commission.fixedAmount * parseInt(item.quantity);
        netAmount = grossAmount - commissionAmount;
      }
      
      totalCommission += commissionAmount;
      totalNetAmount += netAmount;
      
      // Record commission transaction
      await pool.query(`
        INSERT INTO commission_transactions 
        (order_id, vendor_id, order_item_id, gross_amount, commission_rate, 
         commission_amount, net_amount, commission_type, config_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        orderId, item.vendor_id, item.id, grossAmount,
        commission.commissionRate, commissionAmount, netAmount,
        commission.commissionType, commission.configType
      ]);
      
      results.push({
        orderItemId: item.id,
        vendorId: item.vendor_id,
        productName: item.product_name,
        grossAmount,
        commissionRate: commission.commissionRate,
        commissionAmount,
        netAmount
      });
    }
    
    return {
      success: true,
      orderId,
      items: results,
      totalGross: results.reduce((sum, r) => sum + r.grossAmount, 0),
      totalCommission,
      totalNet: totalNetAmount
    };
    
  } catch (error) {
    console.error('Calculate commission error:', error);
    return { success: false, error: error.message };
  }
};

// ==================== VENDOR WALLET ====================

// Initialize vendor wallet
exports.initializeVendorWallet = async (vendorId) => {
  try {
    const result = await pool.query(`
      INSERT INTO vendor_wallets (vendor_id)
      VALUES ($1)
      ON CONFLICT (vendor_id) DO NOTHING
      RETURNING *
    `, [vendorId]);
    
    return { success: true, wallet: result.rows[0] };
  } catch (error) {
    console.error('Initialize vendor wallet error:', error);
    return { success: false, error: error.message };
  }
};

// Get vendor wallet
exports.getVendorWallet = async (vendorId) => {
  try {
    let result = await pool.query(
      'SELECT * FROM vendor_wallets WHERE vendor_id = $1',
      [vendorId]
    );
    
    if (result.rows.length === 0) {
      // Initialize wallet if doesn't exist
      await this.initializeVendorWallet(vendorId);
      result = await pool.query(
        'SELECT * FROM vendor_wallets WHERE vendor_id = $1',
        [vendorId]
      );
    }
    
    return { success: true, wallet: result.rows[0] };
  } catch (error) {
    console.error('Get vendor wallet error:', error);
    return { success: false, error: error.message };
  }
};

// Get vendor earnings summary
exports.getVendorEarningsSummary = async (vendorId) => {
  try {
    const wallet = await this.getVendorWallet(vendorId);
    
    // Get store ID for this vendor
    const store = await pool.query('SELECT id FROM stores WHERE owner_id = $1', [vendorId]);
    const storeId = store.rows.length > 0 ? store.rows[0].id : null;
    
    // Get pending settlements count
    const pendingSettlements = await pool.query(`
      SELECT COUNT(*), COALESCE(SUM(net_payable), 0) as amount
      FROM settlements
      WHERE vendor_id = $1 AND status IN ('pending', 'approved', 'processing')
    `, [vendorId]);
    
    // Get recent transactions
    const recentTransactions = await pool.query(`
      SELECT ct.*, o.order_number
      FROM commission_transactions ct
      LEFT JOIN orders o ON ct.order_id = o.id
      WHERE ct.vendor_id = $1
      ORDER BY ct.created_at DESC
      LIMIT 10
    `, [vendorId]);
    
    // Get monthly earnings from commission_transactions
    const monthlyEarnings = await pool.query(`
      SELECT DATE_TRUNC('month', created_at) as month,
             SUM(net_amount) as total,
             COUNT(*) as transactions
      FROM commission_transactions
      WHERE vendor_id = $1
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `, [vendorId]);
    
    // Get raw order-based earnings (for vendors without settlements yet)
    let orderEarnings = { total: 0, orderCount: 0 };
    let monthlyOrderEarnings = [];
    if (storeId) {
      const orderEarningsResult = await pool.query(`
        SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total,
               COUNT(DISTINCT o.id) as order_count
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE p.store_id = $1
      `, [storeId]);
      orderEarnings = {
        total: parseFloat(orderEarningsResult.rows[0].total),
        orderCount: parseInt(orderEarningsResult.rows[0].order_count)
      };
      
      const monthlyOrderResult = await pool.query(`
        SELECT DATE_TRUNC('month', o.created_at) as month,
               SUM(oi.quantity * oi.unit_price) as total,
               COUNT(DISTINCT o.id) as order_count
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE p.store_id = $1
          AND o.created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', o.created_at)
        ORDER BY month DESC
      `, [storeId]);
      monthlyOrderEarnings = monthlyOrderResult.rows;
    }
    
    return {
      success: true,
      wallet: wallet.wallet,
      pendingSettlements: parseInt(pendingSettlements.rows[0].count),
      pendingAmount: parseFloat(pendingSettlements.rows[0].amount),
      recentTransactions: recentTransactions.rows,
      monthlyEarnings: monthlyEarnings.rows,
      orderEarnings: orderEarnings,
      monthlyOrderEarnings: monthlyOrderEarnings
    };
    
  } catch (error) {
    console.error('Get vendor earnings summary error:', error);
    return { success: false, error: error.message };
  }
};

// ==================== SETTLEMENT PROCESSING ====================

// Generate settlement for a vendor
exports.generateSettlement = async (vendorId, adminId) => {
  try {
    // Get all unsettled commission transactions for the vendor
    const pendingTransactions = await pool.query(`
      SELECT * FROM commission_transactions
      WHERE vendor_id = $1 AND status = 'pending'
      ORDER BY created_at ASC
    `, [vendorId]);
    
    if (pendingTransactions.rows.length === 0) {
      return { success: false, error: 'No pending transactions to settle' };
    }
    
    const transactions = pendingTransactions.rows;
    const grossAmount = transactions.reduce((sum, t) => sum + parseFloat(t.gross_amount), 0);
    const totalCommission = transactions.reduce((sum, t) => sum + parseFloat(t.commission_amount), 0);
    const netPayable = transactions.reduce((sum, t) => sum + parseFloat(t.net_amount), 0);
    
    // Create settlement record
    const settlement = await pool.query(`
      INSERT INTO settlements 
      (vendor_id, total_orders, gross_amount, total_commission, net_payable, processed_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [vendorId, transactions.length, grossAmount, totalCommission, netPayable, adminId]);
    
    // Update commission transactions to settled
    await pool.query(`
      UPDATE commission_transactions
      SET status = 'settled', settled_at = CURRENT_TIMESTAMP, settlement_id = $1
      WHERE vendor_id = $2 AND status = 'pending'
    `, [settlement.rows[0].id, vendorId]);
    
    // Update vendor wallet
    await pool.query(`
      UPDATE vendor_wallets
      SET pending_balance = 0,
          available_balance = available_balance + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE vendor_id = $2
    `, [netPayable, vendorId]);
    
    return {
      success: true,
      settlement: settlement.rows[0],
      transactionsCount: transactions.length,
      netPayable
    };
    
  } catch (error) {
    console.error('Generate settlement error:', error);
    return { success: false, error: error.message };
  }
};

// Get all settlements
exports.getSettlements = async (filters = {}) => {
  try {
    let query = `
      SELECT s.*, u.first_name, u.last_name, u.email as vendor_email
      FROM settlements s
      JOIN users u ON s.vendor_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (filters.vendorId) {
      paramCount++;
      query += ` AND s.vendor_id = $${paramCount}`;
      params.push(filters.vendorId);
    }
    
    if (filters.status) {
      paramCount++;
      query += ` AND s.status = $${paramCount}`;
      params.push(filters.status);
    }
    
    if (filters.dateFrom) {
      paramCount++;
      query += ` AND s.created_at >= $${paramCount}`;
      params.push(filters.dateFrom);
    }
    
    if (filters.dateTo) {
      paramCount++;
      query += ` AND s.created_at <= $${paramCount}`;
      params.push(filters.dateTo);
    }
    
    query += ' ORDER BY s.created_at DESC';
    
    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }
    
    const result = await pool.query(query, params);
    return { success: true, settlements: result.rows };
    
  } catch (error) {
    console.error('Get settlements error:', error);
    return { success: false, error: error.message };
  }
};

// Update settlement status
exports.updateSettlementStatus = async (settlementId, status, adminId, notes = null) => {
  try {
    const updates = { status };
    
    if (status === 'approved' || status === 'processing') {
      updates.processed_by = adminId;
      updates.processed_at = 'CURRENT_TIMESTAMP';
    } else if (status === 'completed') {
      updates.completed_at = 'CURRENT_TIMESTAMP';
    }
    
    if (notes) {
      updates.admin_notes = notes;
    }
    
    const setClauses = Object.keys(updates)
      .map((key, i) => `${key} = ${i === 0 ? '' : ','} $${i + 1}`)
      .join(' ');
    
    const values = Object.values(updates);
    values.push(settlementId);
    
    const result = await pool.query(`
      UPDATE settlements 
      SET ${setClauses}
      WHERE id = $${values.length}
      RETURNING *
    `, values);
    
    // If rejected, return funds to pending
    if (status === 'rejected') {
      const settlement = result.rows[0];
      await pool.query(`
        UPDATE vendor_wallets
        SET pending_balance = pending_balance + $1,
            available_balance = available_balance - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE vendor_id = $2
      `, [settlement.net_payable, settlement.vendor_id]);
    }
    
    return { success: true, settlement: result.rows[0] };
    
  } catch (error) {
    console.error('Update settlement status error:', error);
    return { success: false, error: error.message };
  }
};

// ==================== PAYOUT REQUESTS ====================

// Create payout request
exports.createPayoutRequest = async (vendorId, amount, paymentMethod, bankDetails = {}) => {
  try {
    // Check vendor wallet balance
    const wallet = await this.getVendorWallet(vendorId);
    
    if (parseFloat(wallet.wallet.available_balance) < amount) {
      return { 
        success: false, 
        error: 'Insufficient balance',
        available: wallet.wallet.available_balance 
      };
    }
    
    // Check minimum payout
    const schedule = await pool.query(
      'SELECT min_payout_amount FROM settlement_schedule WHERE is_active = true LIMIT 1'
    );
    
    const minPayout = schedule.rows[0]?.min_payout_amount || 50;
    
    if (amount < minPayout) {
      return { 
        success: false, 
        error: `Minimum payout amount is ${minPayout}`,
        minimum: minPayout 
      };
    }
    
    // Create payout request
    const result = await pool.query(`
      INSERT INTO payout_requests 
      (vendor_id, amount, payment_method, bank_name, account_number, account_holder, routing_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      vendorId, amount, paymentMethod,
      bankDetails.bankName, bankDetails.accountNumber,
      bankDetails.accountHolder, bankDetails.routingNumber
    ]);
    
    // Reserve amount in wallet
    await pool.query(`
      UPDATE vendor_wallets
      SET available_balance = available_balance - $1,
          pending_balance = pending_balance + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE vendor_id = $2
    `, [amount, vendorId]);
    
    return { success: true, payoutRequest: result.rows[0] };
    
  } catch (error) {
    console.error('Create payout request error:', error);
    return { success: false, error: error.message };
  }
};

// Get payout requests for a vendor
exports.getVendorPayoutRequests = async (vendorId, status = null) => {
  try {
    let query = 'SELECT * FROM payout_requests WHERE vendor_id = $1';
    const params = [vendorId];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    return { success: true, requests: result.rows };
    
  } catch (error) {
    console.error('Get vendor payout requests error:', error);
    return { success: false, error: error.message };
  }
};

// Process payout request (admin)
exports.processPayoutRequest = async (requestId, status, adminId, notes = null) => {
  try {
    const payout = await pool.query(
      'SELECT * FROM payout_requests WHERE id = $1',
      [requestId]
    );
    
    if (payout.rows.length === 0) {
      return { success: false, error: 'Payout request not found' };
    }
    
    const request = payout.rows[0];
    
    const updates = { status, processed_by: adminId, processed_at: 'CURRENT_TIMESTAMP' };
    
    if (status === 'completed') {
      updates.completed_at = 'CURRENT_TIMESTAMP';
    } else if (status === 'rejected') {
      updates.rejection_reason = notes;
      // Return funds to available balance
      await pool.query(`
        UPDATE vendor_wallets
        SET available_balance = available_balance + $1,
            pending_balance = pending_balance - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE vendor_id = $2
      `, [request.amount, request.vendor_id]);
    } else if (status === 'failed') {
      updates.rejection_reason = notes;
      // Return funds to available balance
      await pool.query(`
        UPDATE vendor_wallets
        SET available_balance = available_balance + $1,
            pending_balance = pending_balance - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE vendor_id = $2
      `, [request.amount, request.vendor_id]);
    }
    
    if (notes) {
      updates.admin_notes = notes;
    }
    
    const result = await pool.query(`
      UPDATE payout_requests
      SET status = $1, processed_by = $2, processed_at = $3, 
          completed_at = $4, rejection_reason = $5, admin_notes = $6
      WHERE id = $7
      RETURNING *
    `, [status, adminId, updates.processed_at, updates.completed_at, 
        updates.rejection_reason, notes, requestId]);
    
    return { success: true, request: result.rows[0] };
    
  } catch (error) {
    console.error('Process payout request error:', error);
    return { success: false, error: error.message };
  }
};

// Get all payout requests (admin)
exports.getAllPayoutRequests = async (filters = {}) => {
  try {
    let query = `
      SELECT pr.*, u.first_name, u.last_name, u.email as vendor_email
      FROM payout_requests pr
      JOIN users u ON pr.vendor_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (filters.vendorId) {
      paramCount++;
      query += ` AND pr.vendor_id = $${paramCount}`;
      params.push(filters.vendorId);
    }
    
    if (filters.status) {
      paramCount++;
      query += ` AND pr.status = $${paramCount}`;
      params.push(filters.status);
    }
    
    if (filters.dateFrom) {
      paramCount++;
      query += ` AND pr.created_at >= $${paramCount}`;
      params.push(filters.dateFrom);
    }
    
    query += ' ORDER BY pr.created_at DESC';
    
    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }
    
    const result = await pool.query(query, params);
    return { success: true, requests: result.rows };
    
  } catch (error) {
    console.error('Get all payout requests error:', error);
    return { success: false, error: error.message };
  }
};

// ==================== VENDOR PAYOUT METHODS ====================

// Add payout method
exports.addPayoutMethod = async (vendorId, methodData) => {
  try {
    // If setting as default, unset other defaults
    if (methodData.isDefault) {
      await pool.query(
        'UPDATE vendor_payout_methods SET is_default = false WHERE vendor_id = $1',
        [vendorId]
      );
    }
    
    const result = await pool.query(`
      INSERT INTO vendor_payout_methods 
      (vendor_id, method_type, is_default, bank_name, account_number, account_holder, 
       routing_number, swift_code, iban, email)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      vendorId, methodData.methodType, methodData.isDefault || false,
      methodData.bankName, methodData.accountNumber, methodData.accountHolder,
      methodData.routingNumber, methodData.swiftCode, methodData.iban, methodData.email
    ]);
    
    return { success: true, method: result.rows[0] };
    
  } catch (error) {
    console.error('Add payout method error:', error);
    return { success: false, error: error.message };
  }
};

// Get vendor payout methods
exports.getPayoutMethods = async (vendorId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vendor_payout_methods WHERE vendor_id = $1 AND is_active = true ORDER BY is_default DESC, created_at DESC',
      [vendorId]
    );
    return { success: true, methods: result.rows };
  } catch (error) {
    console.error('Get payout methods error:', error);
    return { success: false, error: error.message };
  }
};

// ==================== REPORTS & ANALYTICS ====================

// Get admin dashboard stats
exports.getAdminStats = async () => {
  try {
    // Total pending commission
    const pendingCommission = await pool.query(`
      SELECT SUM(net_amount) as total, COUNT(*) as count
      FROM commission_transactions
      WHERE status = 'pending'
    `);
    
    // Pending settlements
    const pendingSettlements = await pool.query(`
      SELECT SUM(net_payable) as total, COUNT(*) as count
      FROM settlements
      WHERE status IN ('pending', 'approved', 'processing')
    `);
    
    // Pending payouts
    const pendingPayouts = await pool.query(`
      SELECT SUM(amount) as total, COUNT(*) as count
      FROM payout_requests
      WHERE status IN ('pending', 'approved', 'processing')
    `);
    
    // Recent settlements
    const recentSettlements = await pool.query(`
      SELECT s.*, u.first_name, u.last_name
      FROM settlements s
      JOIN users u ON s.vendor_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `);
    
    // Commission by vendor (top 10)
    const topVendors = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.email,
             SUM(ct.net_amount) as total_earned,
             SUM(ct.commission_amount) as total_commission,
             COUNT(*) as transaction_count
      FROM commission_transactions ct
      JOIN users u ON ct.vendor_id = u.id
      WHERE ct.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY total_earned DESC
      LIMIT 10
    `);
    
    // Total earnings by month
    const monthlyStats = await pool.query(`
      SELECT DATE_TRUNC('month', created_at) as month,
             SUM(gross_amount) as gross,
             SUM(commission_amount) as commission,
             SUM(net_amount) as net
      FROM commission_transactions
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);
    
    return {
      success: true,
      stats: {
        pendingCommission: parseFloat(pendingCommission.rows[0].total || 0),
        pendingCommissionCount: parseInt(pendingCommission.rows[0].count || 0),
        pendingSettlements: parseFloat(pendingSettlements.rows[0].total || 0),
        pendingSettlementsCount: parseInt(pendingSettlements.rows[0].count || 0),
        pendingPayouts: parseFloat(pendingPayouts.rows[0].total || 0),
        pendingPayoutsCount: parseInt(pendingPayouts.rows[0].count || 0),
        recentSettlements: recentSettlements.rows,
        topVendors: topVendors.rows,
        monthlyStats: monthlyStats.rows
      }
    };
    
  } catch (error) {
    console.error('Get admin stats error:', error);
    return { success: false, error: error.message };
  }
};

console.log('✅ Settlement Service Loaded');
