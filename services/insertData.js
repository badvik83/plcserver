const pool = require('../config/database');

async function insertProduction(machine, produced, state = null, timestamp = null) {
    try {
        // Retrieve Last Reported Count
        const lastReportQuery = `
            SELECT last_reported_count FROM production_logs 
            WHERE machine_id = $1 ORDER BY event_timestamp DESC LIMIT 1;
        `;
        const result = await pool.query(lastReportQuery, [machine]);
        const lastReported = result.rows.length > 0 ? result.rows[0].last_reported_count : 0;

        // Calculate Actual Production Count
        const actualProduction = produced - lastReported;

        // Insert into Database
        const insertQuery = `
            INSERT INTO production_logs (machine_id, last_reported_count, actual_production_count, machine_state, event_timestamp)
            VALUES ($1, $2, $3, $4, COALESCE($5, DEFAULT));
        `;
        await pool.query(insertQuery, [machine, produced, actualProduction, state, timestamp]);

        console.log(`Inserted: ${machine} | Produced: ${actualProduction} | State: ${state !== null ? state : 'N/A'} | Time: ${timestamp || 'Auto-Generated'}`);
    } catch (err) {
        console.error("Database Insert Error:", err);
    }
}

module.exports = insertProduction;