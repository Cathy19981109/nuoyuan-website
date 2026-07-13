const app = require('./app');
const config = require('./config');
const pool = require('./config/db');

async function start() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('[DB] MySQL 连接成功');

    app.listen(config.port, () => {
      console.log(`[Server] 诺元智合后端服务已启动: http://localhost:${config.port}`);
      console.log(`[Server] 公开 API: http://localhost:${config.port}/api`);
      console.log(`[Server] 管理 API: http://localhost:${config.port}/api/admin`);
    });
  } catch (err) {
    console.error('[DB] MySQL 连接失败:', err.message);
    process.exit(1);
  }
}

start();
