const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate JWT keys for billing service
function generateKeys() {
  console.log('🔑 Generating JWT keys for Billing Service...');

  // Generate private key
  const privateKey = crypto.randomBytes(64).toString('hex');
  
  // Generate public key (for symmetric encryption, we use the same key)
  const publicKey = privateKey;

  // Create .env.local file if it doesn't exist
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Add or update JWT keys
  const jwtSecretLine = `JWT_SECRET=${privateKey}`;
  const jwtPrivateKeyLine = `JWT_PRIVATE_KEY=${privateKey}`;
  const jwtPublicKeyLine = `JWT_PUBLIC_KEY=${publicKey}`;

  // Remove existing JWT lines if they exist
  const lines = envContent.split('\n').filter(line => 
    !line.startsWith('JWT_SECRET=') && 
    !line.startsWith('JWT_PRIVATE_KEY=') && 
    !line.startsWith('JWT_PUBLIC_KEY=')
  );

  // Add new JWT lines
  lines.push(jwtSecretLine);
  lines.push(jwtPrivateKeyLine);
  lines.push(jwtPublicKeyLine);

  // Write back to file
  fs.writeFileSync(envPath, lines.join('\n') + '\n');

  console.log('✅ JWT keys generated and saved to .env.local');
  console.log('🔐 Private Key:', privateKey.substring(0, 16) + '...');
  console.log('🔓 Public Key:', publicKey.substring(0, 16) + '...');
  console.log('📝 Keys saved to .env.local file');
}

generateKeys();
