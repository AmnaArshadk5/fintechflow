const express = require('express');
const cors = require('cors');
const walletRoutes = require('./routes/wallet');
const loanRoutes = require('./routes/loans');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory Store
global.store = {
    wallet: { balance: 25000, currency: 'PKR', owner: 'Fintech User' },
    transactions: [{ id: 1, type: 'credit', amount: 25000, timestamp: new Date(), description: 'Opening Balance' }],
    loans: []
};

app.use('/api/wallet', walletRoutes);
const express = require('express');
const cors = require('cors');
const loanRoutes = require('./routes/loans'); 

// This line prefixes EVERYTHING inside loanRoutes with /api/loans
app.use('/api/loans', loanRoutes); 

app.listen(5000, () => console.log("Backend running on port 5000"));
app.get('/api/transactions', (req, res) => {
    const { type } = req.query;
    let tx = global.store.transactions;
    if (type && type !== 'all') tx = tx.filter(t => t.type === type);
    res.json(tx);
});

app.listen(5000, () => console.log('Backend running on port 5000'));