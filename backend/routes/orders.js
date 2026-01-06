const express = require('express');
const OrderService = require('../services/OrderService');
const router = express.Router();

module.exports = (pool) => {
    const orderService = new OrderService(pool);

    // Create order (authenticated)
    router.post('/', async(req, res) => {
        try {
            const { amount, currency = 'INR', receipt = '', notes = {} } = req.body;
            const merchantId = req.merchant.id;

            // Validation
            if (!amount) {
                return res.status(400).json({
                    error: {
                        code: 'BAD_REQUEST_ERROR',
                        description: 'Missing required field: amount'
                    }
                });
            }

            if (amount < 100) {
                return res.status(400).json({
                    error: {
                        code: 'BAD_REQUEST_ERROR',
                        description: 'Amount must be at least 100 paise'
                    }
                });
            }

            const order = await orderService.createOrder(merchantId, amount, currency, receipt, notes);
            res.status(201).json(order);
        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_ERROR',
                    description: error.message
                }
            });
        }
    });

    // List all orders (authenticated)
    router.get('/', async(req, res) => {
        try {
            const merchantId = req.merchant.id;

            const orders = await pool.query(
                'SELECT id, merchant_id, amount, currency, status, receipt, notes, created_at, updated_at FROM orders WHERE merchant_id = $1 ORDER BY created_at DESC', [merchantId]
            );

            res.json(orders.rows);
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_ERROR',
                    description: error.message
                }
            });
        }
    });

    // Get order (authenticated)
    router.get('/:id', async(req, res) => {
        try {
            const { id } = req.params;
            const merchantId = req.merchant.id;

            const order = await orderService.getOrderById(id);

            if (!order) {
                return res.status(404).json({
                    error: {
                        code: 'NOT_FOUND_ERROR',
                        description: 'Order not found'
                    }
                });
            }

            if (order.merchant_id !== merchantId) {
                return res.status(403).json({
                    error: {
                        code: 'UNAUTHORIZED_ERROR',
                        description: 'Unauthorized to access this order'
                    }
                });
            }

            res.json(order);
        } catch (error) {
            console.error('Error fetching order:', error);
            res.status(500).json({
                code: 'INTERNAL_ERROR',
                description: error.message
            });
        }
    });

    // Get order (public - no auth)
    router.get('/:id/public', async(req, res) => {
        try {
            const { id } = req.params;

            const order = await orderService.getOrderById(id);

            if (!order) {
                return res.status(404).json({
                    error: {
                        code: 'NOT_FOUND_ERROR',
                        description: 'Order not found'
                    }
                });
            }

            res.json(order);
        } catch (error) {
            console.error('Error fetching order:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_ERROR',
                    description: error.message
                }
            });
        }
    });

    // Get payments for order (authenticated)
    router.get('/:id/payments', async(req, res) => {
        try {
            const { id } = req.params;
            const merchantId = req.merchant.id;

            // Verify order belongs to merchant
            const order = await orderService.getOrderById(id);

            if (!order) {
                return res.status(404).json({
                    error: {
                        code: 'NOT_FOUND_ERROR',
                        description: 'Order not found'
                    }
                });
            }

            if (order.merchant_id !== merchantId) {
                return res.status(403).json({
                    error: {
                        code: 'UNAUTHORIZED_ERROR',
                        description: 'Unauthorized to access this order'
                    }
                });
            }

            // Get payments for this order
            const payments = await pool.query(
                'SELECT id, order_id, amount, currency, method, status, vpa, card_network, card_last4, created_at, updated_at FROM payments WHERE order_id = $1 ORDER BY created_at DESC', [id]
            );

            res.json(payments.rows);
        } catch (error) {
            console.error('Error fetching payments:', error);
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