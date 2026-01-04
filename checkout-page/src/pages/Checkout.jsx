import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Checkout() {
    const [orderId, setOrderId] = useState('');
    const [order, setOrder] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [state, setState] = useState('initial'); // initial, processing, success, failed
    const [paymentId, setPaymentId] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    // UPI form
    const [vpa, setVpa] = useState('');

    // Card form
    const [cardNumber, setCardNumber] = useState('');
    const [expiryMonth, setExpiryMonth] = useState('');
    const [expiryYear, setExpiryYear] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardholderName, setCardholderName] = useState('');

    // Extract order_id from URL on load
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('order_id');
        if (id) {
            setOrderId(id);
            fetchOrder(id);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchOrder = async (id) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/v1/orders/${id}/public`);
            setOrder(response.data);
            setState('initial');
        } catch (error) {
            console.error('Error fetching order:', error);
            setErrorMessage('Failed to load order details');
            setState('failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        if (!selectedMethod) {
            setErrorMessage('Please select a payment method');
            return;
        }

        setState('processing');
        setErrorMessage('');

        try {
            const payload = {
                order_id: orderId,
                method: selectedMethod
            };

            if (selectedMethod === 'upi') {
                payload.vpa = vpa;
            } else if (selectedMethod === 'card') {
                payload.card = {
                    number: cardNumber,
                    expiry_month: expiryMonth,
                    expiry_year: expiryYear,
                    cvv: cvv,
                    holder_name: cardholderName
                };
            }

            const response = await axios.post(
                'http://localhost:8000/api/v1/payments/public',
                payload
            );

            setPaymentId(response.data.id);

            // Poll for payment status
            const pollInterval = setInterval(async () => {
                try {
                    const statusResponse = await axios.get(
                        `http://localhost:8000/api/v1/payments/${response.data.id}/public`
                    );

                    if (statusResponse.data.status === 'success') {
                        setState('success');
                        clearInterval(pollInterval);
                    } else if (statusResponse.data.status === 'failed') {
                        setState('failed');
                        setErrorMessage(statusResponse.data.errorDescription || 'Payment failed');
                        clearInterval(pollInterval);
                    }
                } catch (error) {
                    console.error('Error polling payment status:', error);
                }
            }, 2000);

            // Clear interval after 60 seconds
            setTimeout(() => clearInterval(pollInterval), 60000);
        } catch (error) {
            setState('failed');
            setErrorMessage(error.response?.data?.error?.description || 'Payment failed');
        }
    };

    const handleRetry = () => {
        setVpa('');
        setCardNumber('');
        setExpiryMonth('');
        setExpiryYear('');
        setCvv('');
        setCardholderName('');
        setSelectedMethod(null);
        setState('initial');
        setErrorMessage('');
    };

    if (loading) {
        return (
            <div data-test-id="checkout-container">
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            </div>
        );
    }

    if (!order && !orderId) {
        return (
            <div data-test-id="checkout-container">
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2>No Order Found</h2>
                    <p>Please provide a valid order_id in the URL</p>
                </div>
            </div>
        );
    }

    const displayAmount = order ? `₹${(order.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00';

    return (
        <div data-test-id="checkout-container">
            {/* Order Summary */}
            <div data-test-id="order-summary">
                <h2>Complete Payment</h2>
                {order && (
                    <>
                        <div>
                            <span>Amount:</span>
                            <span data-test-id="order-amount">{displayAmount}</span>
                        </div>
                        <div>
                            <span>Order ID:</span>
                            <span data-test-id="order-id">{order.id}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Initial State */}
            {state === 'initial' && (
                <>
                    {/* Payment Methods */}
                    <div data-test-id="payment-methods">
                        <button
                            data-test-id="method-upi"
                            data-method="upi"
                            className={selectedMethod === 'upi' ? 'active' : ''}
                            onClick={() => setSelectedMethod('upi')}
                        >
                            UPI
                        </button>
                        <button
                            data-test-id="method-card"
                            data-method="card"
                            className={selectedMethod === 'card' ? 'active' : ''}
                            onClick={() => setSelectedMethod('card')}
                        >
                            Card
                        </button>
                    </div>

                    {/* UPI Form */}
                    {selectedMethod === 'upi' && (
                        <form onSubmit={handlePayment} data-test-id="upi-form" style={{ display: 'block' }}>
                            <div className="form-group">
                                <label htmlFor="vpa">UPI ID</label>
                                <input
                                    id="vpa"
                                    data-test-id="vpa-input"
                                    placeholder="username@bank"
                                    type="text"
                                    value={vpa}
                                    onChange={(e) => setVpa(e.target.value)}
                                    required
                                />
                            </div>
                            {errorMessage && <div style={{ color: '#d32f2f', marginBottom: '1rem' }}>{errorMessage}</div>}
                            <button
                                type="submit"
                                data-test-id="pay-button"
                            >
                                Pay {displayAmount}
                            </button>
                        </form>
                    )}

                    {/* Card Form */}
                    {selectedMethod === 'card' && (
                        <form onSubmit={handlePayment} data-test-id="card-form" style={{ display: 'block' }}>
                            <div className="form-group">
                                <label htmlFor="card-number">Card Number</label>
                                <input
                                    id="card-number"
                                    data-test-id="card-number-input"
                                    placeholder="Card Number"
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                                    maxLength="19"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="expiry">Expiry (MM/YY)</label>
                                    <input
                                        id="expiry"
                                        data-test-id="expiry-input"
                                        placeholder="MM/YY"
                                        type="text"
                                        value={expiryMonth || expiryYear ? `${expiryMonth}/${expiryYear}` : ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 2) {
                                                setExpiryMonth(val);
                                            } else if (val.length <= 4) {
                                                setExpiryMonth(val.slice(0, 2));
                                                setExpiryYear(val.slice(2, 4));
                                            }
                                        }}
                                        maxLength="5"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="cvv">CVV</label>
                                    <input
                                        id="cvv"
                                        data-test-id="cvv-input"
                                        placeholder="CVV"
                                        type="text"
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                        maxLength="4"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="cardholder">Name on Card</label>
                                <input
                                    id="cardholder"
                                    data-test-id="cardholder-name-input"
                                    placeholder="Name on Card"
                                    type="text"
                                    value={cardholderName}
                                    onChange={(e) => setCardholderName(e.target.value)}
                                    required
                                />
                            </div>

                            {errorMessage && <div style={{ color: '#d32f2f', marginBottom: '1rem' }}>{errorMessage}</div>}

                            <button
                                type="submit"
                                data-test-id="pay-button"
                            >
                                Pay {displayAmount}
                            </button>
                        </form>
                    )}

                    {!selectedMethod && errorMessage && (
                        <div style={{ color: '#d32f2f', textAlign: 'center', marginTop: '1rem' }}>
                            {errorMessage}
                        </div>
                    )}
                </>
            )}

            {/* Processing State */}
            {state === 'processing' && (
                <div data-test-id="processing-state" style={{ display: 'block' }}>
                    <div className="spinner"></div>
                    <span data-test-id="processing-message">Processing payment...</span>
                </div>
            )}

            {/* Success State */}
            {state === 'success' && (
                <div data-test-id="success-state" style={{ display: 'block' }}>
                    <h2>✓ Payment Successful!</h2>
                    <div style={{ margin: '1.5rem 0' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <span>Payment ID: </span>
                            <span data-test-id="payment-id">{paymentId}</span>
                        </div>
                    </div>
                    <span data-test-id="success-message">
                        Your payment has been processed successfully
                    </span>
                </div>
            )}

            {/* Error State */}
            {state === 'failed' && (
                <div data-test-id="error-state" style={{ display: 'block' }}>
                    <h2>✗ Payment Failed</h2>
                    <span data-test-id="error-message">
                        {errorMessage || 'Payment could not be processed'}
                    </span>
                    <button
                        data-test-id="retry-button"
                        onClick={handleRetry}
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
