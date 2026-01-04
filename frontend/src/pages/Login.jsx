import React, { useState } from 'react';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate auth delay
        setTimeout(() => {
            const trimmedEmail = email.trim().toLowerCase();
            if (trimmedEmail === 'test@example.com') {
                onLogin({
                    email: 'test@example.com',
                    apiKey: 'key_test_abc123',
                    apiSecret: 'secret_test_xyz789'
                });
            } else {
                setError('Invalid email. Use: test@example.com');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <div style={{ 
                background: 'white', 
                padding: '3rem', 
                borderRadius: '16px', 
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                maxWidth: '420px',
                width: '100%',
                animation: 'slideUp 0.6s ease-out'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        margin: '0 auto 1.5rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.8rem',
                        fontWeight: '700'
                    }}>
                        💳
                    </div>
                    <h1 style={{ 
                        fontSize: '1.8rem', 
                        color: '#333', 
                        marginBottom: '0.5rem',
                        fontWeight: '700'
                    }}>Payment Gateway</h1>
                    <p style={{ color: '#999', fontSize: '0.95rem' }}>Merchant Dashboard</p>
                </div>
                
                <form onSubmit={handleSubmit} data-test-id="login-form">
                    <div className="form-group">
                        <label htmlFor="email" style={{ color: '#333', fontWeight: '600', marginBottom: '0.7rem', display: 'block' }}>
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="test@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            data-test-id="email-input"
                            required
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '0.9rem 1rem',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                                background: 'white'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" style={{ color: '#333', fontWeight: '600', marginBottom: '0.7rem', display: 'block' }}>
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter any password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            data-test-id="password-input"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '0.9rem 1rem',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                                background: 'white'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                    </div>

                    {error && (
                        <div style={{ 
                            color: '#e74c3c', 
                            marginBottom: '1.5rem',
                            padding: '0.75rem 1rem',
                            background: '#fadbd8',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            border: '1px solid #f5b7b1'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        data-test-id="login-button"
                        disabled={isLoading}
                        style={{ 
                            width: '100%',
                            padding: '1rem',
                            background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: isLoading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
                            transform: isLoading ? 'scale(0.98)' : 'scale(1)'
                        }}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div style={{ 
                    marginTop: '2rem', 
                    padding: '1.5rem', 
                    background: '#f8f9ff',
                    borderRadius: '8px',
                    border: '1px solid #e8e8f5',
                    fontSize: '0.9rem'
                }}>
                    <p style={{ 
                        color: '#667eea', 
                        fontWeight: '700', 
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        ℹ️ Demo Credentials
                    </p>
                    <p style={{ color: '#666', margin: '0.5rem 0' }}>
                        <strong>Email:</strong> <code style={{ background: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace' }}>test@example.com</code>
                    </p>
                    <p style={{ color: '#666', margin: '0.5rem 0' }}>
                        <strong>Password:</strong> <code style={{ background: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace' }}>any value</code>
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                input:disabled {
                    background-color: #f5f5f5 !important;
                    cursor: not-allowed;
                }
                
                button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6) !important;
                }
            `}</style>
        </div>
    );
}
