const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

// Import routes
const healthRoutes = require('./routes/health');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const testRoutes = require('./routes/test');

// Initialize app
const app = express();
const PORT = process.env.PORT || 8000;

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'payment_gateway',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    connectionTimeoutMillis: 5000, // Fail fast
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

pool.on('connect', () => {
    console.log('Connected to database');
});

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://dashboard:80', 'http://checkout:80', 'http://api:8000'],
    credentials: true
}));

// API Authentication Middleware
const authenticateApiKey = async(req, res, next) => {
    const path = req.path;

    // Skip auth for public and test endpoints
    if (path.includes('/public') || path.includes('/test')) {
        return next();
    }

    const apiKey = req.headers['x-api-key'];
    const apiSecret = req.headers['x-api-secret'];

    if (!apiKey || !apiSecret) {
        return res.status(401).json({
            error: {
                code: 'AUTHENTICATION_ERROR',
                description: 'Missing API Key or API Secret'
            }
        });
    }

    // Query database to validate API credentials
    try {
        const result = await pool.query(
            'SELECT id, email FROM merchants WHERE api_key = $1 AND api_secret = $2', [apiKey, apiSecret]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: {
                    code: 'AUTHENTICATION_ERROR',
                    description: 'Invalid API Key or API Secret'
                }
            });
        }

        // Store merchant info in request
        req.merchant = result.rows[0];
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                description: 'Authentication check failed'
            }
        });
    }
};

// Apply auth middleware to /api/v1 routes
app.use('/api/v1/', authenticateApiKey);

// Routes
app.use('/health', healthRoutes(pool));
app.use('/api/v1/orders', orderRoutes(pool));
app.use('/api/v1/payments', paymentRoutes(pool));
app.use('/api/v1/test', testRoutes(pool));

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Payment Gateway API running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND_ERROR',
            description: 'Endpoint not found'
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            description: 'Internal server error'
        }
    });
});

// Initialize database and seed test merchant and demo transaction
async function initializeDatabase() {
    try {
        const testMerchantId = '550e8400-e29b-41d4-a716-446655440000';

        // Check if merchant already exists
        const merchantCheck = await pool.query(
            'SELECT id FROM merchants WHERE email = $1', ['test@example.com']
        );

        if (merchantCheck.rows.length === 0) {
            await pool.query(
                `INSERT INTO merchants (id, name, email, api_key, api_secret, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`, [
                    testMerchantId,
                    'Test Merchant',
                    'test@example.com',
                    'key_test_abc123',
                    'secret_test_xyz789',
                    true
                ]
            );
            console.log('Test merchant seeded');
        } else {
            console.log('Test merchant already exists');
        }
    } catch (error) {
        console.error('Database initialization error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Start server
app.listen(PORT, async() => {
    console.log(`Payment Gateway API running on port ${PORT}`);
    await initializeDatabase();
});

module.exports = { app, pool };