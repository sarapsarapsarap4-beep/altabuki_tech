const crypto = require('crypto');

function keyFromEnv(value = process.env.VOUCHER_ENCRYPTION_KEY) {
  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error('VOUCHER_ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes).');
  }
  return Buffer.from(value, 'hex');
}

function encryptVoucher(value, keyValue = process.env.VOUCHER_ENCRYPTION_KEY) {
  const key = keyFromEnv(keyValue);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptVoucher(payload, keyValue = process.env.VOUCHER_ENCRYPTION_KEY) {
  if (!payload) return null;
  const key = keyFromEnv(keyValue);
  const parts = String(payload).split(':');
  if (parts.length !== 3 || parts.some(part => !/^[0-9a-f]*$/i.test(part))) {
    throw new Error('Invalid encrypted voucher format.');
  }
  const [ivHex, tagHex, encryptedHex] = parts;
  if (ivHex.length !== 24 || tagHex.length !== 32) throw new Error('Invalid encrypted voucher format.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
}

module.exports = { encryptVoucher, decryptVoucher, keyFromEnv };
