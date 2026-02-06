// Script to hash password for creating admin user
import bcrypt from 'bcrypt';

const password = 'admin123'; // Change this to your desired password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  
  console.log('\n✅ Password hashed successfully!\n');
  console.log('Password:', password);
  console.log('Hashed:', hash);
  console.log('\n📋 SQL Command to create admin user:\n');
  console.log(`INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone, Role, Status) 
VALUES (
  'admin',
  '${hash}',
  'Platform Administrator',
  'admin@rms.com',
  '0901234567',
  'Admin',
  'Active'
);\n`);
  
  process.exit(0);
});
