const express = require('express');
const router = express.Router();


router.get('/emi-calculator', (req, res) => {
    console.log("EMI Route Hit!"); // Add this to see if it works in terminal
    const { principal, annualRate, months } = req.query;
    
    const P = parseFloat(principal);
    const r = (parseFloat(annualRate) / 100) / 12;
    const n = parseInt(months);

    if (!P || !r || !n) return res.status(400).json({ error: "Invalid parameters" });

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    res.json({
        emi: Math.round(emi),
        totalPayable: Math.round(emi * n),
        totalInterest: Math.round((emi * n) - P)
    });
});

module.exports = router;