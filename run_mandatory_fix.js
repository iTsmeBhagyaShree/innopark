const path = require('path');
// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = require('./backend/config/db');
const fs = require('fs');

async function runFix() {
    console.log('🚀 Starting Mandatory Database Fix...');
    console.log(`🔌 Connecting to: ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '3306'}`);
    
    const sqlPath = path.join(__dirname, 'database', 'MANDATORY_FIX_APRIL_28.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (let statement of statements) {
        try {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            await pool.query(statement);
        } catch (error) {
            if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY' || error.code === 'ER_DUP_FIELDNAME') {
                console.log(`ℹ️ Skip: ${error.message}`);
            } else {
                console.error(`❌ Error executing statement:`, error.message);
            }
        }
    }

    console.log('✅ Mandatory Database Fix Completed!');
    process.exit(0);
}

runFix().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
