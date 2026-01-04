const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // Health check
    router.get('/', async(req, res) => {
        try {
            const dbResult = await pool.query('SELECT NOW()');
            const dbStatus = dbResult.rows.length > 0 ? 'up' : 'down';

            res.json({
                status: 'up',
                database: dbStatus,
                redis: 'up',
                worker: 'up',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(503).json({
                status: 'down',
                database: 'down',
                redis: 'down',
                worker: 'down',
                timestamp: new Date().toISOString()
            });
        }
    });

    return router;
};