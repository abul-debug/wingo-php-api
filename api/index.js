module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { period } = req.query;

    if (!period || isNaN(period)) {
        return res.status(400).json({
            status: "error",
            message: "Valid period parameter is required. Example: /api/index?period=1001"
        });
    }

    try {
        const periodNum = BigInt(period);

        // BIG / SMALL Calculation
        const step1 = periodNum * 23n + 17n;
        const step2 = step1 * step1;
        const value = Number((step2 % 100n) % 10n);

        const bigSmall = value >= 5 ? "BIG" : "SMALL";

        // Number Calculation
        const bigNumbers = [8.6, 9.5, 7.8, 6.5, 5.7];
        const smallNumbers = [1.3, 2.4, 3.4, 4.1, 0.2];
        const randomIndex = Math.floor(Math.random() * 5);

        const predictedNumber = bigSmall === "BIG" ? bigNumbers[randomIndex] : smallNumbers[randomIndex];

        return res.status(200).json({
            status: "success",
            period: period.toString(),
            prediction: bigSmall,
            number: predictedNumber
        });
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "Internal calculation error"
        });
    }
};
