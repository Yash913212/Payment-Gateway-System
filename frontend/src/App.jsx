import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';

function App() {
    const [merchant, setMerchant] = useState(null);
    const [currentPage, setCurrentPage] = useState('dashboard');

    const handleLogin = (merchantData) => {
        setMerchant(merchantData);
        localStorage.setItem('merchant', JSON.stringify(merchantData));
    };

    const handleLogout = () => {
        setMerchant(null);
        localStorage.removeItem('merchant');
        setCurrentPage('dashboard');
    };

    // Load merchant from localStorage
    React.useEffect(() => {
        const saved = localStorage.getItem('merchant');
        if (saved) {
            try {
                setMerchant(JSON.parse(saved));
            } catch (error) {
                console.error('Failed to parse merchant data:', error);
                localStorage.removeItem('merchant');
            }
        }
    }, []);

    if (!merchant) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div>
            <nav className="navbar">
                <h1>Payment Gateway</h1>
                <ul className="nav-links">
                    <li>
                        <a 
                            onClick={() => setCurrentPage('dashboard')}
                            className={currentPage === 'dashboard' ? 'active' : ''}
                            style={{ cursor: 'pointer' }}
                        >
                            Dashboard
                        </a>
                    </li>
                    <li>
                        <a
                            onClick={() => setCurrentPage('transactions')}
                            className={currentPage === 'transactions' ? 'active' : ''}
                            style={{ cursor: 'pointer' }}
                        >
                            Transactions
                        </a>
                    </li>
                    <li>
                        <a onClick={handleLogout} style={{ cursor: 'pointer' }}>
                            Logout
                        </a>
                    </li>
                </ul>
            </nav>

            {currentPage === 'dashboard' && <Dashboard merchant={merchant} />}
            {currentPage === 'transactions' && <Transactions merchant={merchant} />}
        </div>
    );
}

export default App;
