const test = require('node:test');
const assert = require('node:assert/strict');
const validator = require('../src/middleware/validator');

test('registration can use phone instead of email', () => {
  const result = validator.validateRegistration({ phone: '+967777123456', firstName: 'Test', password: 'safePass123' });
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test('registration requires phone or email', () => {
  const result = validator.validateRegistration({ firstName: 'Test', password: 'safePass123' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => /phone number or email/i.test(e)));
});
