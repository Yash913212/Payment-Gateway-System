const { v4: uuidv4 } = require('uuid');

class OrderService {
    constructor(pool) {
        this.pool = pool;
    }

    // Generate unique order ID
    async generateOrderId() {
        const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            let id = 'order_';
            for (let i = 0; i < 16; i++) {
                id += ALPHANUMERIC.charAt(Math.floor(Math.random() * ALPHANUMERIC.length));
            }

            const existingOrder = await this.pool.query(
                'SELECT id FROM orders WHERE id = $1', [id]
            );

            if (existingOrder.rows.length === 0) {
                return id;
            }

            attempts++;
        }

        throw new Error('Failed to generate unique order ID');
    }

    // Create order
    async createOrder(merchantId, amount, currency = 'INR', receipt = '', notes = {}) {
        const orderId = await this.generateOrderId();

        const query = `
      INSERT INTO orders (id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

        const result = await this.pool.query(query, [
            orderId,
            merchantId,
            amount,
            currency,
            receipt,
            JSON.stringify(notes),
            'created'
        ]);

        return this.formatOrder(result.rows[0]);
    }

    // Get order by ID
    async getOrderById(orderId) {
        const result = await this.pool.query(
            'SELECT * FROM orders WHERE id = $1', [orderId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.formatOrder(result.rows[0]);
    }

    // Format order response
    formatOrder(dbOrder) {
        return {
            id: dbOrder.id,
            merchant_id: dbOrder.merchant_id,
            amount: dbOrder.amount,
            currency: dbOrder.currency,
            receipt: dbOrder.receipt,
            notes: typeof dbOrder.notes === 'string' ? JSON.parse(dbOrder.notes) : dbOrder.notes,
            status: dbOrder.status,
            created_at: dbOrder.created_at,
            updated_at: dbOrder.updated_at
        };
    }
}

module.exports = OrderService;