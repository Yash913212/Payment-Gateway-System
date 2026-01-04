const express = require('express');
const PaymentService = require('../services/PaymentService');
const ValidationService = require('../services/ValidationService');
const router = express.Router();

module.exports = (pool) => {
    const paymentService = new PaymentService(pool);

    // Create payment (authenticated)
    router.post('/', async(req, res) => {
        try {
            const { order_id, method, vpa, card } = req.body;
            const merchantId = req.merchant.id;

            // Validation
            if (!order_id || !method) {
                return res.status(400).json({
                    error: {
                        code: 'BAD_REQUEST_ERROR',
                        description: 'Missing required fields: order_id, method'
                    }
                });
            }

            if (method === 'upi') {
                if (!vpa || !ValidationService.isValidVPA(vpa)) {
                    return res.status(400).json({
                        error: {
                            code: 'INVALID_VPA',
                            description: 'Invalid VPA format'
                        }
                    });
                }

                const payment = await paymentService.createAndProcessPayment(
                    order_id,
                    merchantId,
                    'upi',
                    null, { vpa }
                );

                return res.status(201).json(payment);
            } else if (method === 'card') {
                if (!card || !card.number || !card.expiry_month || !card.expiry_year || !card.cvv) {
                    return res.status(400).json({
                        error: {
                            code: 'BAD_REQUEST_ERROR',
                            description: 'Missing card fields: number, expiry_month, expiry_year, cvv'
                        }
                    });
                }

                if (!ValidationService.isValidCardNumber(card.number)) {
                    return res.status(400).json({
                        error: {
                            code: 'INVALID_CARD',
                            description: 'Invalid card number'
                        }
                    });
                }

                if (!ValidationService.isValidCardExpiry(card.expiry_month, card.expiry_year)) {
                    return res.status(400).json({
                        error: {
                            code: 'EXPIRED_CARD',
                            description: 'Card has expired'
                        }
                    });
                }

                const cardNetwork = ValidationService.detectCardNetwork(card.number);
                const cardLast4 = ValidationService.getCardLast4(card.number);

                const payment = await paymentService.createAndProcessPayment(
                    order_id,
                    merchantId,
                    'card', { network: cardNetwork, last4: cardLast4 },
                    null
                );

                return res.status(201).json(payment);
            } else {
                return res.status(400).json({
                    error: {
                        code: 'BAD_REQUEST_ERROR',
                        description: 'Invalid payment method. Supported: upi, card'
                    }
                });
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_ERROR',
                    description: error.message
                }
            });
        }
    });

    // Get payment (authenticated)
    router.get('/:id', async(req, res) => {
        try {
            const { id } = req.params;
            const merchantId = req.merchant.id;

            const payment = await paymentService.getPaymentById(id);

            if (!payment) {
                return res.status(404).json({
                    error: {
                        code: 'NOT_FOUND_ERROR',
                        description: 'Payment not found'
                    }
                });
            }

            if (payment.merchant_id !== merchantId) {
                return res.status(403).json({
                    error: {
                        code: 'UNAUTHORIZED_ERROR',
                        description: 'Unauthorized to access this payment'
                    }
                });
            }

            res.json(payment);
        } catch (error) {
            console.error('Error fetching payment:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_ERROR',
                    description: error.message
                }
            });
        }
    });

    // Create payment (public - no auth)
    router.post('/public', async(req, res) => {
        try {
            const { order_id, method, vpa, card } = req.body;

            // Validation
            if (!order_id || !method) {
                return res.status(400).json({
                    error: {
                        code: 'BAD_REQUEST_ERROR',
                        description: 'Missing required fields: order_id, method'
                    }
                });
            }

            // Get merchant from order
            const orderResult = await pool.query(
                'SELECT merchant_id FROM orders WHERE id = $1', [order_id]
            );

            if (orderResult.rows.length === 0) {
                return res.status(404).json({
                    error: {
                        code: 'NOT_FOUND_ERROR',
                        description: 'Order not found'
                    }
                });
            }

            const merchantId = orderResult.rows[0].merchant_id;

            if (method === 'upi') {
                if (!vpa || !ValidationService.isValidVPA(vpa)) {
                    return res.status(400).json({
                        error: {
                            code: 'INVALID_VPA',
                            description: 'Invalid VPA format'
                        }
                    });
                }

                const payment = await paymentService.createAndProcessPayment(
                    order_id,
                    merchantId,
                    'upi',
                    null, { vpa }
                );

                return res.status(201).json(payment);
            } else if (method === 'card') {
                if (!card || !card.number || !card.expiry_month || !card.expiry_year || !card.cvv) {
                    return res.status(400).json({
                        error: {
                            code: 'BAD_REQUEST_ERROR',
                            description: 'Missing card fields: number, expiry_month, expiry_year, cvv'
                        }
                    });
                }

                if (!ValidationService.isValidCardNumber(card.number)) {
                    return res.status(400).json({
                        error: {
                            code: 'INVALID_CARD',
                            description: 'Invalid card number'
                        }
                    });
                }

                if (!ValidationService.isValidCardExpiry(card.expiry_month, card.expiry_year)) {
                    return res.status(400).json({
                        error: {
                            code: 'EXPIRED_CARD',
                            description: 'Card has expired'
                        }
                    });
                }

                const cardNetwork = ValidationService.detectCardNetwork(card.number);
                const cardLast4 = ValidationService.getCardLast4(card.number);

                const payment = await paymentService.createAndProcessPayment(
                    order_id,
                    merchantId,
                    'card', { network: cardNetwork, last4: cardLast4 },
                    null
                );

                return res.status(201).json(payment);
            } else {
                return res.status(400).json({
                    error: {
                        code: 'BAD_REQUEST_ERROR',
                        description: 'Invalid payment method. Supported: upi, card'
                    }
                });
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_ERROR',
                    description: error.message
                }
            });
        }
    });

    // Get payment (public - no auth)
    router.get('/:id/public', async(req, res) => {
        try {
            const { id } = req.params;

            const payment = await paymentService.getPaymentById(id);

            if (!payment) {
                return res.status(404).json({
                    error: {
                        code: 'NOT_FOUND_ERROR',
                        description: 'Payment not found'
                    }
                });
            }

            res.json(payment);
        } catch (error) {
            console.error('Error fetching payment:', error);
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