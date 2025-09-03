const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Create keys directory if it doesn't exist
const keysDir = path.join(__dirname, '..', 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Generate RSA key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Write keys to files
fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);
fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);

console.log('✅ RSA key pair generated successfully:');
console.log(`📁 Private key: ${path.join(keysDir, 'private.pem')}`);
console.log(`📁 Public key: ${path.join(keysDir, 'public.pem')}`);
console.log('⚠️  Keep the private key secure and never commit it to version control!'); 