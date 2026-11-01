const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { strictAdmin } = require('../middleware/admin');
const controller = require('../controllers/wifiVoucherController');

router.get('/networks', controller.listNetworks);
router.post('/networks/register', auth, controller.registerNetwork);
router.get('/networks/mine', auth, controller.listMyNetworks);
router.get('/networks/:networkId/categories', controller.listCategories);
router.post('/networks/:networkId/categories', auth, controller.createCategory);
router.get('/networks/:networkId/report', auth, controller.networkReport);
router.post('/categories/:categoryId/vouchers', auth, controller.addVouchers);
router.post('/vouchers/:voucherId/purchase', auth, controller.purchaseVoucher);
router.post('/categories/:categoryId/purchase', auth, controller.purchaseVoucher);
router.get('/purchases/mine', auth, controller.myPurchases);
router.get('/wallet', auth, controller.getWallet);
router.get('/admin/registrations', auth, strictAdmin, controller.adminListRegistrations);
router.post('/admin/registrations/:registrationId/review', auth, strictAdmin, controller.reviewRegistration);
router.post('/admin/test-wallet-credit', auth, strictAdmin, controller.adminTestCredit);

module.exports = router;
