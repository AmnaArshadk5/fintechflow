const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json(global.store.wallet));

router.post('/deposit', (req, res) => {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ error: "Amount must be positive" });
    global.store.wallet.balance += Number(amount);
    global.store.transactions.unshift({ id: Date.now(), type: 'credit', amount, timestamp: new Date(), description: 'Deposit' });
    res.json(global.store.wallet);
});

router.post('/withdraw', (req, res) => {
    const { amount } = req.body;
    if (amount > global.store.wallet.balance) return res.status(400).json({ error: "Insufficient funds" });
    global.store.wallet.balance -= Number(amount);
    global.store.transactions.unshift({ id: Date.now(), type: 'debit', amount, timestamp: new Date(), description: 'Withdrawal' });
    res.json(global.store.wallet);
});

module.exports = router;