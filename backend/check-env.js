require('dotenv').config();

console.log('=== Environment Variables Check ===');
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('=====================================');
