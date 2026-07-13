require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'nuoyuan_web',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nuoyuan_website',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'nuoyuan_default_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};
