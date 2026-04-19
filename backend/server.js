const express = require('express');
const cors = require('cors');
const walletRoutes = require('./routes/wallet');
const loanRoutes = require('./routes/loans');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory Store (Note: This resets every time Vercel puts the function to sleep)
global.store = {
    wallet: { balance: 25000, currency: 'PKR', owner: 'Fintech User' },
    transactions: [{ id: 1, type: 'credit', amount: 25000, timestamp: new Date(), description: 'Opening Balance' }],
    loans: []
};

// Routes
app.use('/api/wallet', walletRoutes);
app.use('/api/loans', loanRoutes);

app.get('/api/transactions', (req, res) => {
    const { type } = req.query;
    let tx = global.store.transactions;
    if (type && type !== 'all') tx = tx.filter(t => t.type === type);
    res.json(tx);
});

// Root route so the "Live URL" doesn't show a 404 immediately
app.get('/', (req, res) => {
    res.send("FintechFlow API is running!");
});

// Vercel handles the listening part. We only listen locally for development.
if (process.env.NODE_ENV !== 'production') {
    const PORT = 5000;
    app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

// CRITICAL: This is required for Vercel to work
module.exports = app;
