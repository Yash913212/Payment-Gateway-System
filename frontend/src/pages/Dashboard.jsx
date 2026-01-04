import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard({ merchant }) {
    const [stats, setStats] = useState({
        totalTransactions: 0,
        totalAmount: 0,
        successRate: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch all orders for this merchant
                const ordersResponse = await axios.get('http://localhost:8000/api/v1/orders', {
                    headers: {
                        'X-Api-Key': merchant.apiKey,
                        'X-Api-Secret': merchant.apiSecret
                    }
                });

                const orders = ordersResponse.data || [];
                
                // Calculate stats from orders
                let totalAmount = 0;
                let completedCount = 0;
                
                orders.forEach(order => {
                    totalAmount += order.amount || 0;
                    if (order.status === 'completed') {
                        completedCount += 1;
                    }
                });

                const successRate = orders.length > 0 ? Math.round((completedCount / orders.length) * 100) : 0;

                setStats({
                    totalTransactions: orders.length,
                    totalAmount: totalAmount,
                    successRate: successRate
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        if (merchant) {
            fetchStats();
        }
    }, [merchant]);

    return (
        <div className="container" data-test-id="dashboard">
            <h2>Dashboard</h2>

            <div data-test-id="api-credentials">
                <div>
                    <div>
                        <label>API Key</label>
                        <span data-test-id="api-key">{merchant.apiKey}</span>
                    </div>
                    <div>
                        <label>API Secret</label>
                        <span data-test-id="api-secret">{merchant.apiSecret}</span>
                    </div>
                </div>
            </div>

            <div data-test-id="stats-container">
                <div>
                    <h3>Total Transactions</h3>
                    <div data-test-id="total-transactions">{stats.totalTransactions}</div>
                </div>
                <div>
                    <h3>Total Amount</h3>
                    <div data-test-id="total-amount">₹{(stats.totalAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                    <h3>Success Rate</h3>
                    <div data-test-id="success-rate">{stats.successRate}%</div>
                </div>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginTop: '1.5rem' }}>
                <h3>Integration Instructions</h3>
                <p style={{ marginTop: '1rem', lineHeight: '1.6' }}>
                    Use your API credentials above to create orders and process payments via the API.
                </p>
                <p style={{ marginTop: '1rem', lineHeight: '1.6' }}>
                    <strong>Create an Order:</strong><br />
                    POST /api/v1/orders<br />
                    Body: <code>{"{"} "amount": 50000, "currency": "INR" {"}"}  </code>
                </p>
                <p style={{ marginTop: '1rem', lineHeight: '1.6' }}>
                    <strong>Checkout URL:</strong><br />
                    <code>http://localhost:3001/checkout?order_id={'<order_id>'}</code>
                </p>
            </div>
        </div>
    );
}
