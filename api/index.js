// ============================================================
// 🚀 WINGO BIG/SMALL PREDICTOR ENGINE v5.0
// REAL HISTORY + BET/SKIP API
// ============================================================

class Predictor {

    constructor(options = {}) {
        this.betThreshold = options.betThreshold || 75;
    }

    // ============================================================
    // MAIN PREDICTION
    // ============================================================

    predict(data) {

        const results = this._normalize(data);

        if (results.length < 5) {
            return this._error(
                `Insufficient history: ${results.length}/5`
            );
        }

        // 12 analysis methods
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

        // ========================================================
        // WEIGHTED VOTING
        // ========================================================

        let bigScore = 50;
        let smallScore = 50;

        signals.forEach(s => {

            const weight = s.weight || 10;
            const strength = Math.max(
                0,
                Math.min(1, s.strength || 0)
            );

            let multiplier = 1;

            if (s.vote === "Big_Strong" ||
                s.vote === "Small_Strong") {
                multiplier = 1.8;
            }

            if (
                s.vote === "Big" ||
                s.vote === "Big_Strong"
            ) {
                bigScore += weight * strength * multiplier;
            }

            if (
                s.vote === "Small" ||
                s.vote === "Small_Strong"
            ) {
                smallScore += weight * strength * multiplier;
            }
        });

        // ========================================================
        // PROBABILITY
        // ========================================================

        const totalScore = bigScore + smallScore;

        const bigProb = Math.round(
            (bigScore / totalScore) * 100
        );

        const smallProb = 100 - bigProb;

        const prediction =
            bigProb >= smallProb ? "Big" : "Small";

        // ========================================================
        // CONFIDENCE
        // ========================================================

        const probability =
            Math.max(bigProb, smallProb);

        let confidence = Math.round(
            50 + Math.abs(probability - 50)
        );

        confidence = Math.max(
            45,
            Math.min(98, confidence)
        );

        // ========================================================
        // LEVEL
        // ========================================================

        const level = this._getLevel(confidence);

        // BET only when confidence >= threshold
        const shouldBet =
            confidence >= this.betThreshold;

        // ========================================================
        // MESSAGE
        // ========================================================

        const message = shouldBet
            ? `✅ BET: ${prediction} (${confidence}%)`
            : `⏸ SKIP: ${prediction} (${confidence}%) — ${this.betThreshold}% chahiye`;

        // ========================================================
        // FINAL RESPONSE
        // ========================================================

        return {

            success: true,

            prediction,

            confidence,

            level,

            shouldBet,

            action: shouldBet ? "BET" : "SKIP",

            message,

            analysis: {

                bigProbability: bigProb,

                smallProbability: smallProb,

                signals: signals.map(s => ({

                    method: s.method,

                    vote: String(s.vote)
                        .replace("_Strong", ""),

                    strength: Math.round(
                        (s.strength || 0) * 100
                    ),

                    details: s.details || ""

                })),

                streaks:
                    this._getStreaks(results),

                distribution:
                    this._getDistribution(results),

                recentTrend:
                    results
                        .slice(-10)
                        .map(x =>
                            x.size === "Big"
                                ? "B"
                                : "S"
                        )
                        .join(""),

                historyUsed:
                    results.length
            }
        };
    }

    // ============================================================
    // 1. MARKOV CHAIN
    // ============================================================

    _markovChain(r) {

        let bb = 0;
        let bs = 0;
        let sb = 0;
        let ss = 0;

        for (let i = 1; i < r.length; i++) {

            const prev = r[i - 1].size;
            const curr = r[i].size;

            if (prev === "Big" && curr === "Big") bb++;
            if (prev === "Big" && curr === "Small") bs++;
            if (prev === "Small" && curr === "Big") sb++;
            if (prev === "Small" && curr === "Small") ss++;
        }

        const last =
            r[r.length - 1].size;

        let probBig = 50;

        if (last === "Big") {

            const total = bb + bs;

            if (total > 0) {
                probBig = (bb / total) * 100;
            }

        } else {

            const total = sb + ss;

            if (total > 0) {
                probBig = (sb / total) * 100;
            }
        }

        return {

            method: "Markov Chain",

            vote:
                probBig >= 50
                    ? "Big"
                    : "Small",

            strength:
                Math.min(
                    1,
                    Math.abs(probBig - 50) / 50
                ),

            weight: 15,

            details:
                `P(Big)=${Math.round(probBig)}%`
        };
    }

    // ============================================================
    // 2. STREAK BREAK
    // ============================================================

    _streakBreak(r) {

        let streak = 1;

        const last =
            r[r.length - 1].size;

        for (
            let i = r.length - 2;
            i >= 0;
            i--
        ) {

            if (r[i].size === last) {
                streak++;
            } else {
                break;
            }
        }

        if (streak >= 7) {

            return {

                method: "Streak Break",

                vote:
                    last === "Big"
                        ? "Small_Strong"
                        : "Big_Strong",

                strength: 0.95,

                weight: 20,

                details:
                    `${last} × ${streak}`
            };
        }

        if (streak >= 5) {

            return {

                method: "Streak Break",

                vote:
                    last === "Big"
                        ? "Small"
                        : "Big",

                strength: 0.85,

                weight: 20,

                details:
                    `${last} × ${streak}`
            };
        }

        if (streak >= 4) {

            return {

                method: "Streak Break",

                vote:
                    last === "Big"
                        ? "Small"
                        : "Big",

                strength: 0.70,

                weight: 20,

                details:
                    `${last} × ${streak}`
            };
        }

        if (streak === 3) {

            return {

                method: "Streak Break",

                vote:
                    last === "Big"
                        ? "Small"
                        : "Big",

                strength: 0.55,

                weight: 18,

                details:
                    `${last} × ${streak}`
            };
        }

        return {

            method: "Streak Break",

            vote: last,

            strength: 0.30,

            weight: 10,

            details: "No strong streak"
        };
    }

    // ============================================================
    // 3. THREE GRAM
    // ============================================================

    _threeGram(r) {

        if (r.length < 4) {

            return {
                method: "3-Gram",
                vote: "Big",
                strength: 0.3,
                weight: 8
            };
        }

        const patterns = {};

        for (
            let i = 0;
            i < r.length - 3;
            i++
        ) {

            const pattern =
                r.slice(i, i + 3)
                    .map(x =>
                        x.size === "Big"
                            ? "B"
                            : "S"
                    )
                    .join("");

            const next =
                r[i + 3].size;

            if (!patterns[pattern]) {
                patterns[pattern] = {
                    b: 0,
                    s: 0
                };
            }

            if (next === "Big") {
                patterns[pattern].b++;
            } else {
                patterns[pattern].s++;
            }
        }

        const last3 =
            r.slice(-3)
                .map(x =>
                    x.size === "Big"
                        ? "B"
                        : "S"
                )
                .join("");

        if (patterns[last3]) {

            const p =
                patterns[last3];

            const total =
                p.b + p.s;

            const pb =
                (p.b / total) * 100;

            return {

                method: "3-Gram",

                vote:
                    pb >= 50
                        ? "Big"
                        : "Small",

                strength:
                    Math.min(
                        1,
                        Math.abs(pb - 50) / 50
                    ),

                weight: 12,

                details:
                    `"${last3}" → ${p.b}B/${p.s}S`
            };
        }

        return {

            method: "3-Gram",

            vote:
                r[r.length - 1].size === "Big"
                    ? "Small"
                    : "Big",

            strength: 0.4,

            weight: 8,

            details:
                `"${last3}" new`
        };
    }

    // ============================================================
    // 4. FOUR GRAM
    // ============================================================

    _fourGram(r) {

        if (r.length < 5) {

            return {
                method: "4-Gram",
                vote: "Big",
                strength: 0.2,
                weight: 6
            };
        }

        const patterns = {};

        for (
            let i = 0;
            i < r.length - 4;
            i++
        ) {

            const pattern =
                r.slice(i, i + 4)
                    .map(x =>
                        x.size === "Big"
                            ? "B"
                            : "S"
                    )
                    .join("");

            const next =
                r[i + 4].size;

            if (!patterns[pattern]) {
                patterns[pattern] = {
                    b: 0,
                    s: 0
                };
            }

            if (next === "Big") {
                patterns[pattern].b++;
            } else {
                patterns[pattern].s++;
            }
        }

        const last4 =
            r.slice(-4)
                .map(x =>
                    x.size === "Big"
                        ? "B"
                        : "S"
                )
                .join("");

        if (patterns[last4]) {

            const p =
                patterns[last4];

            const total =
                p.b + p.s;

            const pb =
                (p.b / total) * 100;

            return {

                method: "4-Gram",

                vote:
                    pb >= 50
                        ? "Big"
                        : "Small",

                strength:
                    Math.min(
                        1,
                        Math.abs(pb - 50) / 50
                    ),

                weight: 10,

                details:
                    `"${last4}" → ${p.b}B/${p.s}S`
            };
        }

        return {

            method: "4-Gram",

            vote:
                r[r.length - 1].size === "Big"
                    ? "Small"
                    : "Big",

            strength: 0.35,

            weight: 6,

            details:
                `"${last4}" new`
        };
    }

    // ============================================================
    // 5. MEAN REVERSION
    // ============================================================

    _meanReversion(r) {

        const b =
            r.filter(x =>
                x.size === "Big"
            ).length;

        const s =
            r.length - b;

        const deviation =
            (b - r.length * 0.5) /
            (r.length * 0.5);

        if (deviation > 0.30) {

            return {

                method: "Mean Reversion",

                vote: "Small",

                strength:
                    Math.min(1, deviation),

                weight: 14,

                details:
                    `B:${b} S:${s}`
            };
        }

        if (deviation < -0.30) {

            return {

                method: "Mean Reversion",

                vote: "Big",

                strength:
                    Math.min(
                        1,
                        -deviation
                    ),

                weight: 14,

                details:
                    `B:${b} S:${s}`
            };
        }

        return {

            method: "Mean Reversion",

            vote:
                r[r.length - 1].size === "Big"
                    ? "Small"
                    : "Big",

            strength: 0.35,

            weight: 8,

            details:
                `B:${b} S:${s}`
        };
    }

    // ============================================================
    // 6. WEIGHTED MOVING AVERAGE
    // ============================================================

    _weightedMA(r) {

        const recent =
            r.slice(-10);

        let wb = 0;
        let ws = 0;
        let totalWeight = 0;

        recent.forEach((x, i) => {

            const weight = i + 1;

            totalWeight += weight;

            if (x.size === "Big") {
                wb += weight;
            } else {
                ws += weight;
            }
        });

        const bp =
            (wb / totalWeight) * 100;

        if (bp > 65) {

            return {

                method: "WMA",

                vote: "Small",

                strength:
                    Math.min(
                        1,
                        (bp - 50) / 50
                    ),

                weight: 12,

                details:
                    `B:${Math.round(bp)}%`
            };
        }

        if (bp < 35) {

            return {

                method: "WMA",

                vote: "Big",

                strength:
                    Math.min(
                        1,
                        (50 - bp) / 50
                    ),

                weight: 12,

                details:
                    `S:${Math.round(100 - bp)}%`
            };
        }

        return {

            method: "WMA",

            vote:
                bp >= 50
                    ? "Big"
                    : "Small",

            strength: 0.40,

            weight: 8,

            details:
                `B:${Math.round(bp)}%`
        };
    }

    // ============================================================
    // 7. FREQUENCY DEVIATION
    // ============================================================

    _frequencyDev(r) {

        const b =
            r.filter(x =>
                x.size === "Big"
            ).length;

        const ratio =
            b / r.length;

        if (ratio > 0.58) {

            return {

                method: "Freq Deviation",

                vote: "Small",

                strength:
                    Math.min(
                        1,
                        (ratio - 0.5) * 4
                    ),

                weight: 10,

                details:
                    `B:${Math.round(ratio * 100)}%`
            };
        }

        if (ratio < 0.42) {

            return {

                method: "Freq Deviation",

                vote: "Big",

                strength:
                    Math.min(
                        1,
                        (0.5 - ratio) * 4
                    ),

                weight: 10,

                details:
                    `B:${Math.round(ratio * 100)}%`
            };
        }

        return {

            method: "Freq Deviation",

            vote:
                r[r.length - 1].size === "Big"
                    ? "Small"
                    : "Big",

            strength: 0.30,

            weight: 6,

            details:
                `Balanced ${Math.round(ratio * 100)}%`
        };
    }

    // ============================================================
    // 8. LAST DIGIT
    // ============================================================

    _lastDigitPattern(r) {

        const digits =
            r.map(x => x.number % 10);

        const recent =
            digits.slice(-5);

        if (recent.length < 3) {

            return {

                method: "Last Digit",

                vote: "Big",

                strength: 0.3,

                weight: 5
            };
        }

        let even = 0;

        recent.forEach(n => {

            if (n % 2 === 0) {
                even++;
            }
        });

        if (even / recent.length >= 0.8) {

            return {

                method: "Last Digit",

                vote: "Small",

                strength: 0.70,

                weight: 8,

                details:
                    `${even}/${recent.length} even`
            };
        }

        if (even / recent.length <= 0.2) {

            return {

                method: "Last Digit",

                vote: "Big",

                strength: 0.70,

                weight: 8,

                details:
                    `${even}/${recent.length} even`
            };
        }

        return {

            method: "Last Digit",

            vote:
                recent[recent.length - 1] % 2 === 0
                    ? "Small"
                    : "Big",

            strength: 0.40,

            weight: 5,

            details:
                `${even}/${recent.length} even`
        };
    }

    // ============================================================
    // 9. FIBONACCI / ALTERNATION
    // ============================================================

    _fibonacciCycle(r) {

        if (r.length < 6) {

            return {

                method: "Fibonacci",

                vote: "Big",

                strength: 0.3,

                weight: 5
            };
        }

        let alternations = 0;

        for (
            let i = 1;
            i < r.length;
            i++
        ) {

            if (
                r[i].size !==
                r[i - 1].size
            ) {
                alternations++;
            }
        }

        const ratio =
            alternations /
            (r.length - 1);

        const last =
            r[r.length - 1].size;

        if (ratio > 0.65) {

            return {

                method: "Fibonacci",

                vote:
                    last === "Big"
                        ? "Small"
                        : "Big",

                strength: 0.75,

                weight: 10,

                details:
                    `Alt:${Math.round(ratio * 100)}%`
            };
        }

        if (ratio < 0.35) {

            return {

                method: "Fibonacci",

                vote: last,

                strength: 0.60,

                weight: 8,

                details:
                    `Str:${Math.round(ratio * 100)}%`
            };
        }

        return {

            method: "Fibonacci",

            vote:
                last === "Big"
                    ? "Small"
                    : "Big",

            strength: 0.50,

            weight: 6,

            details:
                `Alt:${Math.round(ratio * 100)}%`
        };
    }

    // ============================================================
    // 10. BAYESIAN
    // ============================================================

    _bayesian(r) {

        const recent =
            r.slice(-10);

        const b =
            recent.filter(x =>
                x.size === "Big"
            ).length;

        const posterior =
            (1 + b) /
            (2 + recent.length);

        return {

            method: "Bayesian",

            vote:
                posterior >= 0.5
                    ? "Big"
                    : "Small",

            strength:
                Math.min(
                    1,
                    Math.abs(
                        posterior - 0.5
                    ) * 3
                ),

            weight: 12,

            details:
                `P=${Math.round(
                    posterior * 100
                )}%`
        };
    }

    // ============================================================
    // 11. RNG TEST
    // ============================================================

    _rngTest(r) {

        let runs = 1;

        for (
            let i = 1;
            i < r.length;
            i++
        ) {

            if (
                r[i].size !==
                r[i - 1].size
            ) {
                runs++;
            }
        }

        const expected =
            1 +
            (2 * (r.length - 1) * 0.25);

        const ratio =
            runs / expected;

        const last =
            r[r.length - 1].size;

        return {

            method: "RNG Test",

            vote:
                last === "Big"
                    ? "Small"
                    : "Big",

            strength:
                ratio < 0.7
                    ? 0.8
                    : ratio > 1.3
                        ? 0.75
                        : 0.4,

            weight:
                ratio < 0.7 ||
                ratio > 1.3
                    ? 10
                    : 6,

            details:
                `Runs:${runs}/${Math.round(expected)}`
        };
    }

    // ============================================================
    // 12. CHI SQUARE
    // ============================================================

    _chiSquare(r) {

        const b =
            r.filter(x =>
                x.size === "Big"
            ).length;

        const s =
            r.length - b;

        const expected =
            r.length / 2;

        const chi =
            Math.pow(
                b - expected,
                2
            ) / expected +
            Math.pow(
                s - expected,
                2
            ) / expected;

        if (chi > 3.84) {

            return {

                method: "Chi-Square",

                vote:
                    b > s
                        ? "Small"
                        : "Big",

                strength:
                    Math.min(
                        1,
                        chi / 10
                    ),

                weight: 10,

                details:
                    `χ²=${Math.round(
                        chi * 10
                    ) / 10}`
            };
        }

        return {

            method: "Chi-Square",

            vote:
                r[r.length - 1].size === "Big"
                    ? "Small"
                    : "Big",

            strength: 0.35,

            weight: 5,

            details:
                `χ²=${Math.round(
                    chi * 10
                ) / 10}`
        };
    }

    // ============================================================
    // NORMALIZE REAL HISTORY
    // ============================================================

    _normalize(data) {

        if (!Array.isArray(data)) {
            return [];
        }

        return data
            .map(d => {

                let num;

                let issue = "";

                if (
                    typeof d === "object" &&
                    d !== null
                ) {

                    num = Number(
                        d.number ??
                        d.result ??
                        d.openNumber ??
                        d.lotteryNumber
                    );

                    issue =
                        String(
                            d.issueNumber ??
                            d.issue ??
                            d.period ??
                            ""
                        );

                } else {

                    num = Number(d);
                }

                if (
                    !Number.isInteger(num) ||
                    num < 0 ||
                    num > 9
                ) {
                    return null;
                }

                return {

                    number: num,

                    size:
                        num >= 5
                            ? "Big"
                            : "Small",

                    issueNumber: issue,

                    lastDigit:
                        num % 10
                };
            })
            .filter(Boolean);
    }

    // ============================================================
    // LEVEL
    // ============================================================

    _getLevel(confidence) {

        if (confidence >= 90) {
            return "VERY_HIGH";
        }

        if (confidence >= 75) {
            return "HIGH";
        }

        if (confidence >= 65) {
            return "MODERATE";
        }

        return "LOW";
    }

    // ============================================================
    // STREAK
    // ============================================================

    _getStreaks(r) {

        if (!r.length) {
            return {
                size: 0,
                type: "None"
            };
        }

        let streak = 1;

        const last =
            r[r.length - 1].size;

        for (
            let i = r.length - 2;
            i >= 0;
            i--
        ) {

            if (r[i].size === last) {
                streak++;
            } else {
                break;
            }
        }

        return {

            size: streak,

            type: last
        };
    }

    // ============================================================
    // DISTRIBUTION
    // ============================================================

    _getDistribution(r) {

        const big =
            r.filter(x =>
                x.size === "Big"
            ).length;

        const small =
            r.length - big;

        return {

            big,

            small,

            total: r.length,

            bigPercent:
                Math.round(
                    (big / r.length) * 100
                ),

            smallPercent:
                Math.round(
                    (small / r.length) * 100
                )
        };
    }

    // ============================================================
    // ERROR
    // ============================================================

    _error(message) {

        return {

            success: false,

            error: message,

            prediction: null,

            confidence: 0,

            level: "ERROR",

            shouldBet: false,

            action: "SKIP",

            message,

            analysis: null
        };
    }
}


// ============================================================
// CREATE ENGINE
// ============================================================

const predictorEngine =
    new Predictor({
        betThreshold: 75
    });


// ============================================================
// WIN GO HISTORY URL
// ============================================================

const HISTORY_URL =
    "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";


// ============================================================
// FETCH REAL WINGO HISTORY
// ============================================================

async function getWinGoHistory() {

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            10000
        );

    try {

        const response =
            await fetch(
                HISTORY_URL,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json",
                        "User-Agent":
                            "Mozilla/5.0"
                    },

                    signal:
                        controller.signal
                }
            );

        if (!response.ok) {

            throw new Error(
                `History API HTTP ${response.status}`
            );
        }

        const json =
            await response.json();

        return extractHistory(json);

    } finally {

        clearTimeout(timeout);
    }
}


// ============================================================
// EXTRACT HISTORY FROM DIFFERENT JSON STRUCTURES
// ============================================================

function extractHistory(json) {

    let found = [];

    function walk(value) {

        if (found.length >= 500) {
            return;
        }

        if (Array.isArray(value)) {

            for (const item of value) {

                if (
                    item &&
                    typeof item === "object"
                ) {

                    const number =
                        item.number ??
                        item.result ??
                        item.openNumber ??
                        item.lotteryNumber;

                    const issue =
                        item.issueNumber ??
                        item.issue ??
                        item.period;

                    const n =
                        Number(number);

                    if (
                        Number.isInteger(n) &&
                        n >= 0 &&
                        n <= 9
                    ) {

                        found.push({

                            number: n,

                            issueNumber:
                                issue != null
                                    ? String(issue)
                                    : ""
                        });
                    }
                }

                walk(item);
            }

            return;
        }

        if (
            value &&
            typeof value === "object"
        ) {

            for (
                const key of Object.keys(value)
            ) {

                walk(value[key]);
            }
        }
    }

    walk(json);

    // Duplicate removal
    const seen = new Set();

    found =
        found.filter(item => {

            const key =
                `${item.issueNumber}_${item.number}`;

            if (seen.has(key)) {
                return false;
            }

            seen.add(key);

            return true;
        });

    return found;
}


// ============================================================
// API HANDLER
// ============================================================

module.exports = async (req, res) => {

    // ----------------------------------------------------------
    // CORS
    // ----------------------------------------------------------

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    res.setHeader(
        "Content-Type",
        "application/json; charset=UTF-8"
    );

    // ----------------------------------------------------------
    // OPTIONS
    // ----------------------------------------------------------

    if (req.method === "OPTIONS") {

        return res
            .status(200)
            .end();
    }

    // ----------------------------------------------------------
    // ONLY GET
    // ----------------------------------------------------------

    if (req.method !== "GET") {

        return res.status(405).json({

            status: "error",

            message:
                "Only GET method is allowed"
        });
    }

    // ----------------------------------------------------------
    // PERIOD
    // ----------------------------------------------------------

    const period =
        req.query?.period;

    if (
        period === undefined ||
        period === null ||
        String(period).trim() === ""
    ) {

        return res.status(400).json({

            status: "error",

            message:
                "Valid period parameter is required. Example: /?period=1001"
        });
    }

    const targetPeriod =
        String(period).trim();

    // ----------------------------------------------------------
    // FETCH REAL HISTORY
    // ----------------------------------------------------------

    try {

        const history =
            await getWinGoHistory();

        if (
            !Array.isArray(history) ||
            history.length < 5
        ) {

            return res.status(503).json({

                status: "error",

                message:
                    "Unable to get enough real WinGo history.",

                historyCount:
                    history?.length || 0,

                shouldBet: false,

                action: "SKIP"
            });
        }

        // ------------------------------------------------------
        // SORT HISTORY
        //
        // API usually returns newest first.
        // We reverse it so calculation works:
        // OLD -> NEW
        // ------------------------------------------------------

        const cleanHistory =
            history.slice(0, 500);

        // ------------------------------------------------------
        // IMPORTANT:
        // Target period/result ko prediction data mein
        // manually add nahi kar rahe.
        // ------------------------------------------------------

        const targetExists =
            cleanHistory.some(
                x =>
                    String(x.issueNumber) ===
                    targetPeriod
            );

        let predictionHistory =
            cleanHistory.filter(
                x =>
                    String(x.issueNumber) !==
                    targetPeriod
            );

        // If API order is newest -> oldest,
        // reverse for chronological calculation.
        predictionHistory =
            predictionHistory.reverse();

        // ------------------------------------------------------
        // LIMIT TO LAST 100 RESULTS
        // ------------------------------------------------------

        predictionHistory =
            predictionHistory.slice(-100);

        if (
            predictionHistory.length < 5
        ) {

            return res.status(503).json({

                status: "error",

                message:
                    "Not enough valid historical results.",

                historyCount:
                    predictionHistory.length,

                shouldBet: false,

                action: "SKIP"
            });
        }

        // ------------------------------------------------------
        // RUN PREDICTOR
        // ------------------------------------------------------

        const result =
            predictorEngine.predict(
                predictionHistory
            );

        if (!result.success) {

            return res.status(400).json({

                status: "error",

                message:
                    result.error,

                shouldBet: false,

                action: "SKIP"
            });
        }

        // ------------------------------------------------------
        // FINAL API RESPONSE
        // ------------------------------------------------------

        return res.status(200).json({

            status: "success",

            period:
                targetPeriod,

            prediction:
                result.prediction,

            confidence:
                result.confidence,

            level:
                result.level,

            shouldBet:
                result.shouldBet,

            action:
                result.action,

            message:
                result.message,

            historyCount:
                predictionHistory.length,

            targetAlreadyInHistory:
                targetExists,

            analysis:
                result.analysis,

            disclaimer:
                "Prediction is algorithmic only; WinGo outcomes may be random and no result is guaranteed."
        });

    } catch (error) {

        console.error(
            "WINGO API ERROR:",
            error
        );

        return res.status(500).json({

            status: "error",

            message:
                "Unable to fetch WinGo history.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,

            shouldBet: false,

            action: "SKIP"
        });
    }
};
