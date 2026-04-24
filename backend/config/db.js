// =====================================================
// MySQL Database Configuration
// Production-ready: Uses environment variables
// Supports Railway, local dev, and any cloud MySQL
// =====================================================

const mysql = require('mysql2/promise');

let pool;
let originalExecute;
let originalQuery;

const createDbConfig = () => {
  // Railway sets MYSQL_URL or individual vars: MYSQLHOST, MYSQLUSER, etc.
  // Also supports standard DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT
  
  // Check for Railway-style MySQL URL first
  if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    return { connectionString: dbUrl, waitForConnections: true, connectionLimit: 10 };
  }

  // Railway MySQL plugin environment variable names
  const host = process.env.MYSQLHOST || process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
  const user = process.env.MYSQLUSER || process.env.DB_USER || process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQLPASSWORD || process.env.DB_PASS || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME || process.env.MYSQL_DATABASE || 'innopark_db';
  const port = parseInt(process.env.MYSQLPORT || process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10);

  console.log(`🔌 DB Config: host=${host} port=${port} db=${database} user=${user}`);

  return {
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };
};

const initPool = async () => {
  try {
    const config = createDbConfig();
    const testPool = mysql.createPool(config);
    const conn = await testPool.getConnection();
    console.log(`✅ Database connected successfully!`);
    conn.release();

    pool.poolObject = testPool;
    originalExecute = testPool.execute.bind(testPool);
    originalQuery = testPool.query.bind(testPool);
    return true;
  } catch (e) {
    console.error('❌ Database connection failed:', e.message);
    
    // Fallback for local development only
    if (process.env.NODE_ENV !== 'production') {
      const fallbackConfigs = [
        { host: '127.0.0.1', user: 'root', password: 'root', database: 'innopark_db', port: 3306 },
        { host: '127.0.0.1', user: 'root', password: '', database: 'innopark_db', port: 3306 },
        { host: '127.0.0.1', user: 'root', password: '', database: 'innopark_db', port: 3307 },
      ];

      for (const cfg of fallbackConfigs) {
        try {
          const fallbackPool = mysql.createPool({ ...cfg, waitForConnections: true, connectionLimit: 10 });
          const conn = await fallbackPool.getConnection();
          console.log(`✅ Fallback connected: ${cfg.host}:${cfg.port}`);
          conn.release();

          pool.poolObject = fallbackPool;
          originalExecute = fallbackPool.execute.bind(fallbackPool);
          originalQuery = fallbackPool.query.bind(fallbackPool);
          return true;
        } catch (err) {
          console.log(`❌ Fallback failed: ${cfg.host}:${cfg.port}`);
        }
      }
    }
    return false;
  }
};

// Initial setup
const runStart = async () => {
  const success = await initPool();
  if (!success) {
    console.error('🚨 CRITICAL: Could not connect to any database!');
    console.error('💡 Make sure DB environment variables are set:');
    console.error('   MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT');
    console.error('   OR: DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT');
  }
};

runStart();

pool = {
  execute: async (sql, params = []) => {
    if (!originalExecute) await initPool();

    const modifiedParams = Array.isArray(params) ? [...params] : [params];

    try {
      return await originalExecute(sql, modifiedParams);
    } catch (err) {
      console.error('⚠️ DB Execute Error:', err.message);
      console.error('SQL:', sql.substring(0, 200));
      // Throw the error so the controller can catch it and handle it (e.g. serve mock data or return 500)
      throw err;
    }
  },
  query: async (sql, params = []) => {
    if (!originalQuery) await initPool();

    const modifiedParams = Array.isArray(params) ? [...params] : [params];

    try {
      return await originalQuery(sql, modifiedParams);
    } catch (err) {
      console.error('⚠️ DB Query Error:', err.message);
      throw err;
    }
  },
  getConnection: async () => {
    if (!pool.poolObject) await initPool();
    return pool.poolObject.getConnection();
  }
};

module.exports = pool;
