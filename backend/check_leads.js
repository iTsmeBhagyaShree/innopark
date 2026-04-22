const mysql = require('mysql2/promise');

async function checkCols() {
  const config = { host: '127.0.0.1', user: 'root', password: '', database: 'innopark_db', port: 3307 };
  try {
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.execute('DESC leads');
    console.table(rows);
    await connection.end();
  } catch (e) {
    console.log(`Failed: ${e.message}`);
  }
}

checkCols();
