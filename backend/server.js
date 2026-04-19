const express = require('express');
const cors = require('cors');

// Import your route files
// Ensure these files exist in your /routes folder
const walletRoutes = require('./routes/wallet');
const loanRoutes = require('./routes/loans');

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());

// Enhanced CORS to allow both local development and your Vercel frontend
app.use(cors({
    origin: [
        "http://localhost:3000", 
        "https://fintechflow-fmuy.vercel.app"
    ],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
}));

// --- GLOBAL IN-MEMORY STORE ---
// Note: On Vercel (Serverless), this will reset frequently.
global.store = {
    wallet: { balance: 25000, currency: 'PKR', owner: 'Fintech User' },
    transactions: [
        { 
            id: 1, 
            type: 'credit', 
            amount: 25000, 
            timestamp: new Date(), 
            description: 'Opening Balance' 
        }
    ],
    loans: []
};

// --- ROUTES ---

// 1. Wallet Routes (Deposit/Withdraw)
app.use('/api/wallet', walletRoutes);

// 2. Loan Routes (Apply/Status/EMI)
app.use('/api/loans', loanRoutes);

// 3. Transaction History Route (Defined here for simplicity)
app.get('/api/transactions', (req, res) => {
    try {
        const { type } = req.query;
        let tx = global.store.transactions;
        
        if (type && type !== 'all') {
            tx = tx.filter(t => t.type === type);
        }
        
        res.status(200).json(tx);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

// 4. Health Check / Root Route
app.get('/', (req, res) => {
    res.send({
        status: "Online",
        message: "FintechFlow API is running!",
        timestamp: new Date()
    });
});

// --- ERROR HANDLING ---
// Catch-all for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// --- SERVER INITIALIZATION ---
// Vercel handles the listening in production. 
// We only call app.listen() for local development.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`
🚀 Backend running on http://localhost:${PORT}
👉 Wallet: http://localhost:${PORT}/api/wallet
👉 Txns:   http://localhost:${PORT}/api/transactions
        `);
    });
}

// CRITICAL: Required for Vercel Serverless Functions
module.exports = app;
