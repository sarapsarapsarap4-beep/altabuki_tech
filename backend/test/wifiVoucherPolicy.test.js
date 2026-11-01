const test = require('node:test');
const assert = require('node:assert/strict');
const policy = require('../src/services/commissionPolicy');

test('every voucher transaction uses exactly zero platform commission', () => {
  const commission = policy.applicableCommission('network-owner', 'voucher-category');
  assert.equal(commission.commissionRate, 0);
  assert.equal(commission.fixedAmount, 0);
});

test('platform policy rejects percentage and fixed commission attempts', () => {
  assert.equal(policy.setCommission(null, 1, 'global').success, false);
  assert.equal(policy.setCommission('owner', 0.01, 'vendor').success, false);
  assert.equal(policy.setCommission('category', -1, 'category').success, false);
});

test('zero commission is the only accepted commission configuration', () => {
  for (const scope of ['global', 'vendor', 'category']) {
    const result = policy.setCommission(null, 0, scope);
    assert.equal(result.success, true);
    assert.equal(result.config.commission_rate, 0);
    assert.equal(result.config.fixed_amount, 0);
  }
});
