const { v4: uuidv4 } = require('uuid');

class PaymentService {
    constructor(pool) {
        this.pool = pool;
    }

    // Generate unique payment ID
    async generatePaymentId() {
        const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            let id = 'pay_';
            for (let i = 0; i < 16; i++) {
                id += ALPHANUMERIC.charAt(Math.floor(Math.random() * ALPHANUMERIC.length));
            }

            const existingPayment = await this.pool.query(
                'SELECT id FROM payments WHERE id = $1', [id]
            );

            if (existingPayment.rows.length === 0) {
                return id;
            }

            attempts++;
        }

        throw new Error('Failed to generate unique payment ID');
    }

    // Create payment and start async processing
    async createAndProcessPayment(orderId, merchantId, method, cardData = null, vpaData = null) {
        const paymentId = await this.generatePaymentId();

        // Get order
        const orderResult = await this.pool.query(
            'SELECT * FROM orders WHERE id = $1 AND merchant_id = $2', [orderId, merchantId]
        );

        if (orderResult.rows.length === 0) {
            throw new Error('Order not found');
        }

        const order = orderResult.rows[0];

        // Prepare payment data
        let cardNetwork = null;
        let cardLast4 = null;
        let vpa = null;

        if (method === 'card' && cardData) {
            cardNetwork = cardData.network;
            cardLast4 = cardData.last4;
        } else if (method === 'upi' && vpaData) {
            vpa = vpaData.vpa;
        }

        // Create payment with "processing" status
        const insertQuery = `
      INSERT INTO payments (id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

        const result = await this.pool.query(insertQuery, [
            paymentId,
            orderId,
            merchantId,
            order.amount,
            order.currency,
            method,
            'processing',
            vpa,
            cardNetwork,
            cardLast4
        ]);

        // Start async processing in background
        this.processPaymentAsync(paymentId, method);

        return this.formatPayment(result.rows[0]);
    }

    // Async payment processing
    processPaymentAsync(paymentId, method) {
        const testMode = process.env.TEST_MODE === 'true';
        const testSuccess = process.env.TEST_PAYMENT_SUCCESS === 'true';
        const testDelay = parseInt(process.env.TEST_PROCESSING_DELAY || '5000', 10);

        // Determine delay
        const delay = testMode ? testDelay : Math.random() * 5000 + 5000; // 5-10 seconds

        // Determine success rate
        const successRate = method === 'upi' ? 0.9 : 0.95; // 90% UPI, 95% Card
        const success = testMode ? testSuccess : Math.random() < successRate;

        setTimeout(async() => {
            try {
                const newStatus = success ? 'success' : 'failed';
                const errorCode = success ? null : 'PAYMENT_FAILED';
                const errorDescription = success ? null : 'Payment processing failed';

                await this.pool.query(
                    `UPDATE payments SET status = $1, error_code = $2, error_description = $3, updated_at = NOW()
           WHERE id = $4`, [newStatus, errorCode, errorDescription, paymentId]
                );
            } catch (error) {
                console.error('Error updating payment status:', error);
            }
        }, delay);
    }

    // Get payment by ID
    async getPaymentById(paymentId) {
        const result = await this.pool.query(
            'SELECT * FROM payments WHERE id = $1', [paymentId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.formatPayment(result.rows[0]);
    }

    // Format payment response
    formatPayment(dbPayment) {
        return {
            id: dbPayment.id,
            order_id: dbPayment.order_id,
            merchant_id: dbPayment.merchant_id,
            amount: dbPayment.amount,
            currency: dbPayment.currency,
            method: dbPayment.method,
            status: dbPayment.status,
            vpa: dbPayment.vpa,
            card_network: dbPayment.card_network,
            card_last4: dbPayment.card_last4,
            error_code: dbPayment.error_code,
            error_description: dbPayment.error_description,
            created_at: dbPayment.created_at,
            updated_at: dbPayment.updated_at
        };
    }
}

module.exports = PaymentService;