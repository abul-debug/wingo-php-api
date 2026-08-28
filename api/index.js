// ============================================================
// 🚀 WINGO BIG/SMALL PREDICTOR ENGINE v4.0 + API HANDLER
// ============================================================

class Predictor {
    
    /**
     * @param {Object} options
     * @param {number} options.betThreshold - Sirf itne % confidence par bet (default: 75)
     */
    constructor(options = {}) {
        this.betThreshold = options.betThreshold || 75; // 75%+
    }

    /**
     * 🎯 Main prediction function
     * @param {Array} data - [{ number: "0"-"9" }] ya [0,1,2,...9]
     * @returns {Object}
     */
    predict(data) {
        // 1. Data normalize
        const results = this._normalize(data);
        if (results.length < 5) {
            return this._error(`Insufficient data: ${results.length}/5`);
        }

        // 2. 12 analysis methods run karo
        const signals = [
            this._markovChain(results),
            this._streakBreak(results),
            this._threeGram(results),
            this._fourGram(results),
            this._meanReversion(results),
            this._weightedMA(results),
            this._frequencyDev(results),
            this._lastDigitPattern(results),
            this._fibonacciCycle(results),
            this._bayesian(results),
            this._rngTest(results),
            this._chiSquare(results)
        ];

        // 3. Weighted voting
        let bigScore = 50, smallScore = 50;
        let totalWeight = 0;

        signals.forEach(s => {
            const w = s.weight || 10;
            totalWeight += w;
            const str = s.strength || 0.5;
            if (s.vote === 'Big' || s.vote === 'Big_Strong') {
                bigScore += w * str * (s.vote === 'Big_Strong' ? 1.8 : 1);
            } else if (s.vote === 'Small' || s.vote === 'Small_Strong') {
                smallScore += w * str * (s.vote === 'Small_Strong' ? 1.8 : 1);
            }
        });

        // 4. Calculate confidence
        const bigProb = Math.round((bigScore / (bigScore + smallScore)) * 100);
        const smallProb = 100 - bigProb;
        const prediction = bigProb >= smallProb ? 'Big' : 'Small';
        let confidence = Math.min(98, Math.max(45, Math.abs(bigProb - smallProb) + 50));

        // 5. Loss streak protection
        const lossProtection = this._lossStreakProtection(results, prediction);
        if (lossProtection.adjust) {
            confidence = Math.min(95, confidence + lossProtection.boost);
        }

        // 6. Level & bet decision
        const level = this._getLevel(confidence);
        const shouldBet = level === 'VERY_HIGH' || level === 'HIGH';

        // 7. Final output
        return {
            success: true,
            prediction,
            confidence,
            level,
            shouldBet,
            message: shouldBet
                ? `✅ BET: ${prediction} (${confidence}%)`
                : `⏸ SKIP: ${confidence}% — ${this.betThreshold}% chahiye`,
            analysis: {
                bigProbability: bigProb,
                smallProbability: smallProb,
                signals: signals.map(s => ({
                    method: s.method,
                    vote: s.vote.replace('_Strong', ''),
                    strength: Math.round((s.strength || 0) * 100),
                    details: s.details || ''
                })),
                streaks: this._getStreaks(results),
                distribution: this._getDistribution(results),
                recentTrend: results.slice(-5).map(r => r.size === 'Big' ? 'B' : 'S').join(''),
                lossProtection,
            }
        };
    }

    // ============================================================
    // 12 ANALYSIS METHODS
    // ============================================================

    _markovChain(r) {
        let bb = 0, bs = 0, sb = 0, ss = 0;
        for (let i = 1; i < r.length; i++) {
            if (r[i - 1].size === 'Big' && r[i].size === 'Big') bb++;
            else if (r[i - 1].size === 'Big' && r[i].size === 'Small') bs++;
            else if (r[i - 1].size === 'Small' && r[i].size === 'Big') sb++;
            else if (r[i - 1].size === 'Small' && r[i].size === 'Small') ss++;
        }
        const last = r[r.length - 1].size;
        const total = last === 'Big' ? bb + bs : sb + ss;
        const probBig = total > 0 ? (last === 'Big' ? (bb / total) * 100 : (sb / total) * 100) : 50;
        const vote = probBig >= 50 ? 'Big' : 'Small';
        return { method: 'Markov Chain', vote, strength: Math.min(1, Math.abs(probBig - 50) / 50 * 1.5), weight: 15, details: `P=${Math.round(probBig)}%` };
    }

    _streakBreak(r) {
        let streak = 1;
        const last = r[r.length - 1].size;
        for (let i = r.length - 2; i >= 0; i--) { if (r[i].size === last) streak++; else break; }
        if (streak >= 7) return { method: 'Streak Break', vote: last === 'Big' ? 'Small_Strong' : 'Big_Strong', strength: 0.95, weight: 20, details: `${last}×${streak} 🔥` };
        if (streak >= 5) return { method: 'Streak Break', vote: last === 'Big' ? 'Small' : 'Big', strength: 0.85, weight: 20, details: `${last}×${streak}` };
        if (streak >= 4) return { method: 'Streak Break', vote: last === 'Big' ? 'Small' : 'Big', strength: 0.70, weight: 20, details: `${last}×${streak}` };
        if (streak === 3) return { method: 'Streak Break', vote: last === 'Big' ? 'Small' : 'Big', strength: 0.55, weight: 18, details: `${last}×${streak}` };
        return { method: 'Streak Break', vote: last, strength: 0.3, weight: 10, details: `No streak` };
    }

    _threeGram(r) {
        if (r.length < 4) return { method: '3-Gram', vote: 'Big', strength: 0.3, weight: 8 };
        const pats = {};
        for (let i = 0; i < r.length - 3; i++) {
            const p = r.slice(i, i + 3).map(x => x.size === 'Big' ? 'B' : 'S').join('');
            const n = r[i + 3].size;
            if (!pats[p]) pats[p] = { b: 0, s: 0 };
            pats[p][n === 'Big' ? 'b' : 's']++;
        }
        const last3 = r.slice(-3).map(x => x.size === 'Big' ? 'B' : 'S').join('');
        if (pats[last3]) {
            const p = pats[last3];
            const t = p.b + p.s;
            const pb = (p.b / t) * 100;
            return { method: '3-Gram', vote: pb >= 50 ? 'Big' : 'Small', strength: Math.min(1, Math.abs(pb - 50) / 50), weight: 12, details: `"${last3}"→${p.b}B/${p.s}S` };
        }
        return { method: '3-Gram', vote: r[r.length - 1].size === 'Big' ? 'Small' : 'Big', strength: 0.4, weight: 8, details: `"${last3}" new` };
    }

    _fourGram(r) {
        if (r.length < 5) return { method: '4-Gram', vote: 'Big', strength: 0.2, weight: 6 };
        const pats = {};
        for (let i = 0; i < r.length - 4; i++) {
            const p = r.slice(i, i + 4).map(x => x.size === 'Big' ? 'B' : 'S').join('');
            const n = r[i + 4].size;
            if (!pats[p]) pats[p] = { b: 0, s: 0 };
            pats[p][n === 'Big' ? 'b' : 's']++;
        }
        const last4 = r.slice(-4).map(x => x.size === 'Big' ? 'B' : 'S').join('');
        if (pats[last4]) {
            const p = pats[last4];
            const t = p.b + p.s;
            const pb = (p.b / t) * 100;
            const vote = pb >= 50 ? 'Big' : 'Small';
            return { method: '4-Gram', vote, strength: Math.min(1, Math.abs(pb - 50) / 50), weight: 10, details: `"${last4}"→${vote}` };
        }
        return { method: '4-Gram', vote: r[r.length - 1].size === 'Big' ? 'Small' : 'Big', strength: 0.35, weight: 6, details: `"${last4}" new` };
    }

    _meanReversion(r) {
        const b = r.filter(x => x.size === 'Big').length;
        const s = r.length - b;
        const bd = (b - r.length * 0.5) / (r.length * 0.5);
        if (bd > 0.3) return { method: 'Mean Reversion', vote: 'Small', strength: Math.min(1, bd), weight: 14, details: `B:${b} S:${s}` };
        if (bd < -0.3) return { method: 'Mean Reversion', vote: 'Big', strength: Math.min(1, -bd), weight: 14, details: `B:${b} S:${s}` };
        return { method: 'Mean Reversion', vote: r[r.length - 1].size === 'Big' ? 'Small' : 'Big', strength: 0.35, weight: 8, details: `B:${b} S:${s}` };
    }

    _weightedMA(r) {
        const recent = r.slice(-10);
        let wb = 0, ws = 0, tw = 0;
        recent.forEach((x, i) => { const w = i + 1; tw += w; if (x.size === 'Big') wb += w; else ws += w; });
        const bp = (wb / tw) * 100;
        if (bp > 65) return { method: 'WMA', vote: 'Small', strength: Math.min(1, (bp - 50) / 50), weight: 12, details: `B:${Math.round(bp)}%` };
        if (bp < 35) return { method: 'WMA', vote: 'Big', strength: Math.min(1, (50 - bp) / 50), weight: 12, details: `S:${Math.round(100 - bp)}%` };
        return { method: 'WMA', vote: bp >= 50 ? 'Big' : 'Small', strength: 0.4, weight: 8, details: `B:${Math.round(bp)}%` };
    }

    _frequencyDev(r) {
        const b = r.filter(x => x.size === 'Big').length;
        const br = b / r.length;
        if (br > 0.58) return { method: 'Freq Deviation', vote: 'Small', strength: Math.min(1, (br - 0.5) * 4), weight: 10, details: `B${Math.round(br * 100)}%` };
        if (br < 0.42) return { method: 'Freq Deviation', vote: 'Big', strength: Math.min(1, (0.5 - br) * 4), weight: 10, details: `B${Math.round(br * 100)}%` };
        return { method: 'Freq Deviation', vote: r[r.length - 1].size === 'Big' ? 'Small' : 'Big', strength: 0.3, weight: 6, details: `Bal ${Math.round(br * 100)}%` };
    }

    _lastDigitPattern(r) {
        const ld = r.map(x => x.lastDigit);
        if (ld.length < 3) return { method: 'Last Digit', vote: 'Big', strength: 0.3, weight: 5 };
        let ec = 0;
        for (let i = Math.max(0, ld.length - 5); i < ld.length; i++) { if (ld[i] % 2 === 0) ec++; }
        const n5 = Math.min(5, ld.length);
        if (ec / n5 >= 0.8) return { method: 'Last Digit', vote: 'Small', strength: 0.7, weight: 8, details: `${ec}/${n5} even` };
        if (ec / n5 <= 0.2) return { method: 'Last Digit', vote: 'Big', strength: 0.7, weight: 8, details: `${ec}/${n5} even` };
        return { method: 'Last Digit', vote: ld[ld.length - 1] % 2 === 0 ? 'Small' : 'Big', strength: 0.4, weight: 5, details: `${ec}/${n5} even` };
    }

    _fibonacciCycle(r) {
        if (r.length < 6) return { method: 'Fibonacci', vote: 'Big', strength: 0.3, weight: 5 };
        let alt = 0;
        for (let i = 1; i < r.length; i++) { if (r[i].size !== r[i - 1].size) alt++; }
        const ar = alt / (r.length - 1);
        const last = r[r.length - 1].size;
        if (ar > 0.65) return { method: 'Fibonacci', vote: last === 'Big' ? 'Small' : 'Big', strength: 0.75, weight: 10, details: `Alt ${Math.round(ar * 100)}%` };
        if (ar < 0.35) return { method: 'Fibonacci', vote: last, strength: 0.6, weight: 8, details: `Str ${Math.round(ar * 100)}%` };
        return { method: 'Fibonacci', vote: last === 'Big' ? 'Small' : 'Big', strength: 0.5, weight: 6, details: `Alt ${Math.round(ar * 100)}%` };
    }

    _bayesian(r) {
        const r10 = r.slice(-10);
        const b = r10.filter(x => x.size === 'Big').length;
        const post = (1 + b) / (2 + r10.length);
        return { method: 'Bayesian', vote: post >= 0.5 ? 'Big' : 'Small', strength: Math.min(1, Math.abs(post - 0.5) * 3), weight: 12, details: `P=${Math.round(post * 100)}%` };
    }

    _rngTest(r) {
        let runs = 1;
        for (let i = 1; i < r.length; i++) { if (r[i].size !== r[i - 1].size) runs++; }
        const exp = 1 + (2 * (r.length - 1) * 0.25);
        const rr = runs / exp;
        const last = r[r.length - 1].size;
        if (rr < 0.7) return { method: 'RNG Test', vote: last === 'Big' ? 'Small' : 'Big', strength: 0.8, weight: 10, details: `Runs:${runs}/${Math.round(exp)}` };
        if (rr > 1.3) return { method: 'RNG Test', vote: last === 'Big' ? 'Small' : 'Big', strength: 0.75, weight: 10, details: `Runs:${runs}/${Math.round(exp)}` };
        return { method: 'RNG Test', vote: last === 'Big' ? 'Small' : 'Big', strength: 0.4, weight: 6, details: `Runs:${runs}/${Math.round(exp)}` };
    }

    _chiSquare(r) {
        const b = r.filter(x => x.size === 'Big').length;
        const s = r.length - b;
        const e = r.length / 2;
        const cs = Math.pow(b - e, 2) / e + Math.pow(s - e, 2) / e;
        if (cs > 3.84) return { method: 'Chi-Square', vote: b > s ? 'Small' : 'Big', strength: Math.min(1, cs / 10), weight: 10, details: `χ²=${Math.round(cs * 10) / 10}` };
        return { method: 'Chi-Square', vote: r[r.length - 1].size === 'Big' ? 'Small' : 'Big', strength: 0.35, weight: 5, details: `χ²=${Math.round(cs * 10) / 10}` };
    }

    // ============================================================
    // HELPERS
    // ============================================================

    _normalize(data) {
        return data.map(d => {
            const num = typeof d === 'object' ? parseInt(d.number) : parseInt(d);
            const issue = typeof d === 'object' ? (d.issueNumber || '') : '';
            return {
                number: isNaN(num) ? 0 : num,
                size: num >= 5 ? 'Big' : 'Small',
                lastDigit: issue ? parseInt(issue.slice(-1)) || 0 : num % 10
            };
        }).filter(x => !isNaN(x.number));
    }

    _getLevel(c) {
        if (c >= 90) return 'VERY_HIGH';
        if (c >= 75) return 'HIGH';
        if (c >= 65) return 'MODERATE';
        return 'LOW';
    }

    _getStreaks(r) {
        if (r.length === 0) return { size: 0, type: 'None' };
        let st = 1;
        const ls = r[r.length - 1].size;
        for (let i = r.length - 2; i >= 0; i--) { if (r[i].size === ls) st++; else break; }
        return { size: st, type: ls };
    }

    _getDistribution(r) {
        const b = r.filter(x => x.size === 'Big').length;
        return { big: b, small: r.length - b, total: r.length, bigPercent: Math.round((b / r.length) * 100) };
    }

    _lossStreakProtection(r, pred) {
        let ls = 0, lp = pred;
        for (let i = r.length - 1; i >= 0; i--) {
            if (r[i].size !== lp) { ls++; lp = r[i].size === 'Big' ? 'Small' : 'Big'; } else break;
        }
        if (ls >= 2) return { adjust: true, boost: 15, message: `${ls} loss streak detected` };
        return { adjust: false, boost: 0 };
    }

    _error(msg) {
        return { success: false, error: msg, prediction: null, confidence: 0, level: 'ERROR', shouldBet: false, message: msg, analysis: null };
    }
}

// Predictor Class Ka Instance Create Karein
const predictorEngine = new Predictor({ betThreshold: 75 });

// ============================================================
// 🚀 MAIN API ROUTE HANDLER
// ============================================================

module.exports = (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');

    // Preflight request handle karne ke liye
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { period } = req.query;

    // Period Validation
    if (!period || isNaN(period)) {
        return res.status(400).json({
            status: "error",
            message: "Valid period parameter is required. Example: /?period=1001"
        });
    }

    try {
        // Engine ko kam se kam 5 historical values chahiye hoti hain run karne ke liye.
        // Niche sample history banayi gayi hai jo period ke basis par normalize hoti hai:
        const sampleHistory = [
            { number: 3, issueNumber: "1001" },
            { number: 8, issueNumber: "1002" },
            { number: 2, issueNumber: "1003" },
            { number: 9, issueNumber: "1004" },
            { number: 7, issueNumber: "1005" },
            { number: Number(period.toString().slice(-1)), issueNumber: period.toString() }
        ];

        // Prediction Run Karein
        const result = predictorEngine.predict(sampleHistory);

        if (!result.success) {
            return res.status(400).json({
                status: "error",
                message: result.error
            });
        }

        // Final Output Response
        return res.status(200).json({
            status: "success",
            period: period.toString(),
            prediction: result.prediction,
            confidence: result.confidence,
            level: result.level,
            shouldBet: result.shouldBet,
            message: result.message,
            analysis: result.analysis
        });

    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "Internal calculation error"
        });
    }
};
