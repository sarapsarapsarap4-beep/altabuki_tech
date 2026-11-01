const test = require('node:test');
const assert = require('node:assert/strict');
const policy = require('../src/services/commissionPolicy');

test('commission policy always reports 0 percent', () => {
  const result = policy.applicableCommission('vendor-id', 'category-id');
  assert.equal(result.success, true);
  assert.equal(result.commissionRate, 0);
  assert.equal(result.fixedAmount, 0);
});

test('non-zero global commission cannot be enabled', () => {
  const result = policy.setCommission(null, 10, 'global');
  assert.equal(result.success, false);
  assert.match(result.error, /fixed at 0%/);
});

test('zero commission is accepted as a no-op', () => {
  const result = policy.setCommission(null, 0, 'global');
  assert.equal(result.success, true);
  assert.equal(result.config.commission_rate, 0);
});

test('fixed commission amounts cannot be introduced via legacy config', () => {
  assert.equal(policy.setCommission('vendor-id', 5, 'vendor').success, false);
});
