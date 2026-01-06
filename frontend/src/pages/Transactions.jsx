import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Transactions({ merchant }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                // Fetch all orders for this merchant
                const ordersResponse = await axios.get('http://localhost:8000/api/v1/orders', {
                    headers: {
                        'X-Api-Key': merchant.apiKey,
                        'X-Api-Secret': merchant.apiSecret
                    }
                });

                const orders = ordersResponse.data || [];
                const transactionsList = [];

                // For each order, fetch its payments
                for (const order of orders) {
                    try {
                        const paymentsResponse = await axios.get(`http://localhost:8000/api/v1/orders/${order.id}/payments`, {
                            headers: {
                                'X-Api-Key': merchant.apiKey,
                                'X-Api-Secret': merchant.apiSecret
                            }
                        });
                        const payments = paymentsResponse.data || [];
                        transactionsList.push(...payments);
                    } catch (error) {
                        // Order may not have payments yet
                    }
                }

                setTransactions(transactionsList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        if (merchant) {
            fetchTransactions();
        }
    }, [merchant]);

    return (
        <div className="container">
            <h2>Transactions</h2>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table data-test-id="transactions-table">
                        <thead>
                            <tr>
                                <th>Payment ID</th>
                                <th>Order ID</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="no-data">
                                        No transactions yet. Create an order and complete a payment to see transactions here.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} data-test-id="transaction-row" data-payment-id={tx.id}>
                                        <td data-test-id="payment-id">{tx.id}</td>
                                        <td data-test-id="order-id">{tx.order_id}</td>
                                        <td data-test-id="amount">{(tx.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td data-test-id="method">{tx.method}</td>
                                        <td>
                                            <span data-test-id="status" data-status={tx.status}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td data-test-id="created-at">{new Date(tx.created_at).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
