const express = require('express');
const router = express.Router();

// This handles GET /api/loans/emi-calculator
router.get('/emi-calculator', (req, res) => {
    console.log("EMI Route Hit with:", req.query); 
    
    const { principal, annualRate, months } = req.query;
    
    const P = parseFloat(principal);
    const annualR = parseFloat(annualRate);
    const n = parseInt(months);

    // 1. Validation check
    if (isNaN(P) || isNaN(annualR) || isNaN(n) || n <= 0) {
        return res.status(400).json({ error: "Please provide valid numeric values." });
    }

    // 2. Handle 0% Interest Case separately to avoid division by zero
    if (annualR === 0) {
        const emi = P / n;
        return res.json({
            emi: Math.round(emi),
            totalPayable: Math.round(P),
            totalInterest: 0
        });
    }

    // 3. Standard EMI Calculation
    const r = (annualR / 100) / 12;
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    res.json({
        emi: Math.round(emi),
        totalPayable: Math.round(emi * n),
        totalInterest: Math.round((emi * n) - P)
    });
});

module.exports = router;
