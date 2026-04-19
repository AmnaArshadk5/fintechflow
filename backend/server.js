const express = require('express');
const cors = require('cors');
const app = express();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors({
  origin: ["https://fintechflow-fmuy.vercel.app", "http://localhost:3000"],
  credentials: true
}));

// --- IN-MEMORY DATABASE ---
global.store = {
  wallet: { balance: 25000 },
  transactions: [{ id: 1, type: 'credit', amount: 25000, timestamp: new Date(), description: 'Opening Balance' }],
  loans: []
};

// --- WALLET ROUTES ---
app.get('/api/wallet', (req, res) => res.json(global.store.wallet));

app.post('/api/wallet/:action', (req, res) => {
  const { amount } = req.body;
  const { action } = req.params;
  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

  if (action === 'deposit') {
    global.store.wallet.balance += amount;
  } else if (action === 'withdraw') {
    if (global.store.wallet.balance < amount) return res.status(400).json({ error: "Insufficient balance" });
    global.store.wallet.balance -= amount;
  }

  global.store.transactions.unshift({
    id: Date.now(),
    type: action === 'deposit' ? 'credit' : 'debit',
    amount,
    timestamp: new Date(),
    description: `Wallet ${action}`
  });
  res.json(global.store.wallet);
});

// --- TRANSACTION ROUTES ---
app.get('/api/transactions', (req, res) => res.json(global.store.transactions));

// --- LOAN ROUTES ---
app.get('/api/loans', (req, res) => res.json(global.store.loans));

app.post('/api/loans/apply', (req, res) => {
  const loan = { ...req.body, id: 'LN' + Math.floor(1000 + Math.random() * 9000), status: 'pending', date: new Date() };
  global.store.loans.unshift(loan);
  res.json(loan);
});

app.patch('/api/loans/:id/status', (req, res) => {
  const loan = global.store.loans.find(l => l.id === req.params.id);
  if (loan) loan.status = req.body.status;
  res.json({ success: true });
});

// --- EMI CALCULATOR ROUTE (Fixed 404 issue) ---
app.get('/api/loans/emi-calculator', (req, res) => {
  const { principal, annualRate, months } = req.query;
  const P = parseFloat(principal);
  const r = (parseFloat(annualRate) / 100) / 12;
  const n = parseInt(months);

  if (isNaN(P) || isNaN(n) || n <= 0) return res.status(400).json({ error: "Invalid parameters" });

  let emi, totalPayable;
  if (r === 0) {
    emi = P / n;
    totalPayable = P;
  } else {
    emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    totalPayable = emi * n;
  }

  res.json({
    emi: Math.round(emi),
    totalPayable: Math.round(totalPayable),
    totalInterest: Math.round(totalPayable - P)
  });
});

app.get('/', (req, res) => res.send("FintechFlow API Active"));

const PORT = 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server on port ${PORT}`));
}
module.exports = app;
