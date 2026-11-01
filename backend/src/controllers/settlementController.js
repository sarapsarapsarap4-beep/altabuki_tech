// ==================== SETTLEMENT CONTROLLER ====================
// Handles commission and settlement API endpoints

const pool = require('../config/database');
const settlementService = require('../services/settlementService');

// ==================== COMMISSION CONFIG (ADMIN) ====================

// Get all commission configs
exports.getCommissionConfigs = async (req, res) => {
  try {
    const result = await settlementService.getCommissionConfigs();
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, configs: result.configs });
    
  } catch (error) {
    console.error('Get commission configs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Set global commission
exports.setGlobalCommission = async (req, res) => {
  try {
    const { commissionRate, commissionType } = req.body;
    
    if (commissionRate === undefined || commissionRate === null || !Number.isFinite(Number(commissionRate)) || Number(commissionRate) < 0 || Number(commissionRate) > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Commission rate must be between 0 and 100' 
      });
    }
    
    const result = await settlementService.setGlobalCommission(
      commissionRate, 
      commissionType || 'percentage'
    );
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, message: 'Global commission updated', config: result.config });
    
  } catch (error) {
    console.error('Set global commission error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Set vendor-specific commission
exports.setVendorCommission = async (req, res) => {
  try {
    const { vendorId, commissionRate, commissionType } = req.body;
    
    if (!vendorId) {
      return res.status(400).json({ success: false, error: 'Vendor ID required' });
    }
    
    if (commissionRate === undefined || commissionRate === null || !Number.isFinite(Number(commissionRate)) || Number(commissionRate) < 0 || Number(commissionRate) > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Commission rate must be between 0 and 100' 
      });
    }
    
    const result = await settlementService.setVendorCommission(
      vendorId, 
      commissionRate, 
      commissionType || 'percentage'
    );
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, message: 'Vendor commission updated', config: result.config });
    
  } catch (error) {
    console.error('Set vendor commission error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Set category-specific commission
exports.setCategoryCommission = async (req, res) => {
  try {
    const { categoryId, commissionRate, commissionType } = req.body;
    
    if (!categoryId) {
      return res.status(400).json({ success: false, error: 'Category ID required' });
    }
    
    if (commissionRate === undefined || commissionRate === null || !Number.isFinite(Number(commissionRate)) || Number(commissionRate) < 0 || Number(commissionRate) > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Commission rate must be between 0 and 100' 
      });
    }
    
    const result = await settlementService.setCategoryCommission(
      categoryId, 
      commissionRate, 
      commissionType || 'percentage'
    );
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, message: 'Category commission updated', config: result.config });
    
  } catch (error) {
    console.error('Set category commission error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ==================== VENDOR WALLET (VENDOR) ====================

// Get my wallet
exports.getMyWallet = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const result = await settlementService.getVendorWallet(vendorId);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, wallet: result.wallet });
    
  } catch (error) {
    console.error('Get my wallet error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get my earnings summary
exports.getMyEarningsSummary = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const result = await settlementService.getVendorEarningsSummary(vendorId);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, ...result });
    
  } catch (error) {
    console.error('Get my earnings error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get my commission transactions
exports.getMyTransactions = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = `
      SELECT ct.*, o.order_number
      FROM commission_transactions ct
      LEFT JOIN orders o ON ct.order_id = o.id
      WHERE ct.vendor_id = $1
    `;
    const params = [vendorId];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      query += ` AND ct.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY ct.created_at DESC';
    
    const offset = (page - 1) * limit;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM commission_transactions WHERE vendor_id = $1';
    const countParams = [vendorId];
    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      success: true,
      transactions: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
    
  } catch (error) {
    console.error('Get my transactions error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ==================== PAYOUT METHODS (VENDOR) ====================

// Add payout method
exports.addPayoutMethod = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const result = await settlementService.addPayoutMethod(vendorId, req.body);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, message: 'Payout method added', method: result.method });
    
  } catch (error) {
    console.error('Add payout method error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get my payout methods
exports.getMyPayoutMethods = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const result = await settlementService.getPayoutMethods(vendorId);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, methods: result.methods });
    
  } catch (error) {
    console.error('Get my payout methods error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ==================== PAYOUT REQUESTS (VENDOR) ====================

// Create payout request
exports.createPayoutRequest = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { amount, paymentMethodId, bankDetails } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }
    
    if (!paymentMethodId && !bankDetails) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment method or bank details required' 
      });
    }
    
    // Get payout method if provided
    let payoutMethod = paymentMethodId;
    if (!payoutMethod && bankDetails) {
      payoutMethod = bankDetails.methodType || 'bank_transfer';
    }
    
    const result = await settlementService.createPayoutRequest(
      vendorId, 
      amount, 
      payoutMethod,
      bankDetails || {}
    );
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: result.error,
        ...(result.available && { available: result.available }),
        ...(result.minimum && { minimum: result.minimum })
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Payout request submitted',
      request: result.payoutRequest 
    });
    
  } catch (error) {
    console.error('Create payout request error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get my payout requests
exports.getMyPayoutRequests = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status } = req.query;
    
    const result = await settlementService.getVendorPayoutRequests(vendorId, status);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, requests: result.requests });
    
  } catch (error) {
    console.error('Get my payout requests error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ==================== ADMIN SETTLEMENTS ====================

// Generate settlement for a vendor
exports.generateSettlement = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { vendorId } = req.body;
    
    if (!vendorId) {
      return res.status(400).json({ success: false, error: 'Vendor ID required' });
    }
    
    const result = await settlementService.generateSettlement(vendorId, adminId);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ 
      success: true, 
      message: 'Settlement generated successfully',
      settlement: result.settlement,
      transactionsCount: result.transactionsCount,
      netPayable: result.netPayable
    });
    
  } catch (error) {
    console.error('Generate settlement error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get all settlements
exports.getAllSettlements = async (req, res) => {
  try {
    const { vendorId, status, dateFrom, dateTo, limit } = req.query;
    
    const filters = {};
    if (vendorId) filters.vendorId = vendorId;
    if (status) filters.status = status;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (limit) filters.limit = parseInt(limit);
    
    const result = await settlementService.getSettlements(filters);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, settlements: result.settlements });
    
  } catch (error) {
    console.error('Get all settlements error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Update settlement status
exports.updateSettlementStatus = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { settlementId, status, notes } = req.body;
    
    if (!settlementId || !status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Settlement ID and status required' 
      });
    }
    
    const validStatuses = ['pending', 'approved', 'processing', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status' 
      });
    }
    
    const result = await settlementService.updateSettlementStatus(
      settlementId, 
      status, 
      adminId, 
      notes
    );
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ 
      success: true, 
      message: `Settlement ${status}`,
      settlement: result.settlement 
    });
    
  } catch (error) {
    console.error('Update settlement status error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ==================== ADMIN PAYOUT REQUESTS ====================

// Get all payout requests
exports.getAllPayoutRequests = async (req, res) => {
  try {
    const { vendorId, status, dateFrom, limit } = req.query;
    
    const filters = {};
    if (vendorId) filters.vendorId = vendorId;
    if (status) filters.status = status;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (limit) filters.limit = parseInt(limit);
    
    const result = await settlementService.getAllPayoutRequests(filters);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, requests: result.requests });
    
  } catch (error) {
    console.error('Get all payout requests error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Process payout request
exports.processPayoutRequest = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { requestId, status, notes } = req.body;
    
    if (!requestId || !status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Request ID and status required' 
      });
    }
    
    const validStatuses = ['approved', 'processing', 'completed', 'rejected', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status' 
      });
    }
    
    const result = await settlementService.processPayoutRequest(
      requestId, 
      status, 
      adminId, 
      notes
    );
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ 
      success: true, 
      message: `Payout request ${status}`,
      request: result.request 
    });
    
  } catch (error) {
    console.error('Process payout request error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ==================== ADMIN DASHBOARD ====================

// Get admin stats
exports.getAdminStats = async (req, res) => {
  try {
    const result = await settlementService.getAdminStats();
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, stats: result.stats });
    
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Calculate commission for an order (internal use)
exports.calculateCommission = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID required' });
    }
    
    const result = await settlementService.calculateCommission(orderId);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, ...result });
    
  } catch (error) {
    console.error('Calculate commission error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

console.log('✅ Settlement Controller Loaded');
