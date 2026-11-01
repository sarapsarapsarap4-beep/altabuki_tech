const test = require('node:test');
const assert = require('node:assert/strict');
const { encryptVoucher, decryptVoucher, keyFromEnv } = require('../src/services/voucherCrypto');
const key = 'a'.repeat(64);

test('voucher secrets are encrypted and round-trip with AES-256-GCM', () => {
  const encrypted = encryptVoucher('CARD-12345', key);
  assert.notEqual(encrypted, 'CARD-12345');
  assert.equal(decryptVoucher(encrypted, key), 'CARD-12345');
});

test('voucher encryption uses a fresh IV', () => {
  assert.notEqual(encryptVoucher('same-code', key), encryptVoucher('same-code', key));
});

test('voucher ciphertext cannot be decrypted with a different key', () => {
  const encrypted = encryptVoucher('CARD-12345', key);
  assert.throws(() => decryptVoucher(encrypted, 'b'.repeat(64)));
});

test('invalid encryption key fails closed', () => {
  assert.throws(() => keyFromEnv('not-a-key'), /64 hexadecimal/);
});
