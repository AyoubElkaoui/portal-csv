const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Test de hash
  const isValid = await bcrypt.compare(password, hash);
  console.log('Test verification:', isValid ? '✓ VALID' : '✗ INVALID');
}

generateHash();
