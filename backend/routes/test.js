const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // Get test merchant
    router.get('/merchant', async(req, res) => {
        try {
            const result = await pool.query(
                'SELECT id, email, api_key, api_secret FROM merchants WHERE email = $1', ['test@example.com']
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: {
                        code: 'NOT_FOUND_ERROR',
                        description: 'Test merchant not found'
                    }
                });
            }

            const merchant = result.rows[0];

            res.json({
                id: merchant.id,
                email: merchant.email,
                api_key: merchant.api_key,
                api_secret: merchant.api_secret,
                seeded: true
            });
        } catch (error) {
            console.error('Error fetching test merchant:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_ERROR',
                    description: error.message
                }
            });
        }
    });

    return router;
};