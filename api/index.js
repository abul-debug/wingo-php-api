// ============================================================
// 🚀 WINGO PREDICTOR ENGINE v6.0
// REAL WINGO HISTORY
// EXACT API STRUCTURE: data.list[]
// ============================================================

class Predictor {

    constructor(options = {}) {
        this.betThreshold = options.betThreshold ?? 75;
    }

    // ==========================================================
    // MAIN PREDICT
    // ==========================================================

    predict(data) {

        const results = this._normalize(data);

        if (results.length < 20) {
            return this._error(
                `Need at least 20 valid results. Found ${results.length}`
            );
        }

        // ------------------------------------------------------
        // RUN ALL CALCULATIONS
        // ------------------------------------------------------

        const signals = [
            this._markov(results),
            this._streak(results),
            this._threeGram(results),
            this._fourGram(results),
            this._recentRatio(results),
            this._weightedRatio(results),
            this._frequency(results),
            this._numberDistribution(results),
            this._alternation(results),
            this._bayesian(results),
            this._recentWindow(results),
            this._digitPattern(results)
        ];

        // ------------------------------------------------------
        // CALCULATE WEIGHTED SCORE
        //
        // Every signal returns:
        // direction = Big / Small
        // strength  = 0 to 1
        // weight    = importance
        // ------------------------------------------------------

        let bigScore = 0;
        let smallScore = 0;

        for (const signal of signals) {

            if (!signal || !signal.direction) {
                continue;
            }

            const weight =
                Number(signal.weight) || 1;

            const strength =
                Math.max(
                    0,
                    Math.min(
                        1,
                        Number(signal.strength) || 0
                    )
                );

            const score =
                weight * strength;

            if (signal.direction === "Big") {
                bigScore += score;
            }

            if (signal.direction === "Small") {
                smallScore += score;
            }
        }

        // ------------------------------------------------------
        // RAW PROBABILITY
        // ------------------------------------------------------

        const total =
            bigScore + smallScore;

        if (total <= 0) {
            return this._error(
                "No usable calculation signal"
            );
        }

        const bigProbability =
            (bigScore / total) * 100;

        const smallProbability =
            (smallScore / total) * 100;

        const prediction =
            bigProbability >= smallProbability
                ? "Big"
                : "Small";

        // ------------------------------------------------------
        // CONFIDENCE
        //
        // 50% = completely balanced
        // 100% = one side dominates
        // ------------------------------------------------------

        const dominantProbability =
            Math.max(
                bigProbability,
                smallProbability
            );

        const margin =
            Math.abs(
                bigProbability -
                smallProbability
            );

        let confidence =
            Math.round(
                50 + (margin / 2)
            );

        confidence =
            Math.max(
                50,
                Math.min(
                    98,
                    confidence
                )
            );

        // ------------------------------------------------------
        // LEVEL
        // ------------------------------------------------------

        const level =
            this._getLevel(confidence);

        // ------------------------------------------------------
        // BET / SKIP
        // ------------------------------------------------------

        const shouldBet =
            confidence >= this.betThreshold;

        const action =
            shouldBet
                ? "BET"
                : "SKIP";

        const message =
            shouldBet
                ? `✅ BET: ${prediction} (${confidence}%)`
                : `⏸ SKIP: ${prediction} (${confidence}%) — ${this.betThreshold}% required`;

        // ------------------------------------------------------
        // RECENT HISTORY
        // ------------------------------------------------------

        const recent =
            results
                .slice(-10)
                .map(x => ({
                    period: x.issueNumber,
                    number: x.number,
                    size: x.size
                }));

        // ------------------------------------------------------
        // RETURN
        // ------------------------------------------------------

        return {

            success: true,

            prediction,

            confidence,

            level,

            shouldBet,

            action,

            message,

            calculation: {

                bigScore:
                    Number(bigScore.toFixed(3)),

                smallScore:
                    Number(smallScore.toFixed(3)),

                bigProbability:
                    Number(
                        bigProbability.toFixed(2)
                    ),

                smallProbability:
                    Number(
                        smallProbability.toFixed(2)
                    ),

                margin:
                    Number(
                        margin.toFixed(2)
                    ),

                dominantProbability:
                    Number(
                        dominantProbability.toFixed(2)
                    )
            },

            analysis: {

                signals:
                    signals.map(s => ({

                        method: s.method,

                        prediction:
                            s.direction,

                        strength:
                            Math.round(
                                s.strength * 100
                            ),

                        weight:
                            s.weight,

                        score:
                            Number(
                                (
                                    s.strength *
                                    s.weight
                                ).toFixed(2)
                            ),

                        details:
                            s.details || ""
                    })),

                streak:
                    this._getStreak(results),

                distribution:
                    this._distribution(results),

                recentTrend:
                    results
                        .slice(-10)
                        .map(x =>
                            x.size === "Big"
                                ? "B"
                                : "S"
                        )
                        .join(""),

                recentResults:
                    recent
            }
        };
    }


    // ==========================================================
    // 1. MARKOV
    // ==========================================================

    _markov(r) {

        let BB = 0;
        let BS = 0;
        let SB = 0;
        let SS = 0;

        for (let i = 1; i < r.length; i++) {

            const previous =
                r[i - 1].size;

            const current =
                r[i].size;

            if (
                previous === "Big" &&
                current === "Big"
            ) BB++;

            if (
                previous === "Big" &&
                current === "Small"
            ) BS++;

            if (
                previous === "Small" &&
                current === "Big"
            ) SB++;

            if (
                previous === "Small" &&
                current === "Small"
            ) SS++;
        }

        const last =
            r[r.length - 1].size;

        let bigProbability = 50;

        if (last === "Big") {

            const total =
                BB + BS;

            if (total > 0) {
                bigProbability =
                    (BB / total) * 100;
            }

        } else {

            const total =
                SB + SS;

            if (total > 0) {
                bigProbability =
                    (SB / total) * 100;
            }
        }

        return this._probabilitySignal(
            "Markov",
            bigProbability,
            15,
            `Big transition P=${Math.round(bigProbability)}%`
        );
    }


    // ==========================================================
    // 2. STREAK
    // ==========================================================

    _streak(r) {

        const last =
            r[r.length - 1].size;

        let streak = 1;

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

        // Long streak = mild reversal signal.
        // Not forced; strength grows gradually.
        let probability = 50;

        if (streak >= 3) {

            const strength =
                Math.min(
                    0.75,
                    0.15 +
                    (streak - 3) * 0.10
                );

            probability =
                last === "Big"
                    ? 50 - strength * 50
                    : 50 + strength * 50;
        }

        return this._probabilitySignal(
            "Streak",
            probability,
            8,
            `${last} streak x${streak}`
        );
    }


    // ==========================================================
    // 3. THREE GRAM
    // ==========================================================

    _threeGram(r) {

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
                    big: 0,
                    small: 0
                };
            }

            if (next === "Big") {
                patterns[pattern].big++;
            } else {
                patterns[pattern].small++;
            }
        }

        const lastPattern =
            r.slice(-3)
                .map(x =>
                    x.size === "Big"
                        ? "B"
                        : "S"
                )
                .join("");

        const p =
            patterns[lastPattern];

        if (!p) {

            return {
                method: "3-Gram",
                direction: null,
                strength: 0,
                weight: 10,
                details:
                    `${lastPattern}: no historical match`
            };
        }

        const total =
            p.big + p.small;

        const probability =
            (p.big / total) * 100;

        return this._probabilitySignal(
            "3-Gram",
            probability,
            12,
            `${lastPattern} → ${p.big}B/${p.small}S`
        );
    }


    // ==========================================================
    // 4. FOUR GRAM
    // ==========================================================

    _fourGram(r) {

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
                    big: 0,
                    small: 0
                };
            }

            if (next === "Big") {
                patterns[pattern].big++;
            } else {
                patterns[pattern].small++;
            }
        }

        const lastPattern =
            r.slice(-4)
                .map(x =>
                    x.size === "Big"
                        ? "B"
                        : "S"
                )
                .join("");

        const p =
            patterns[lastPattern];

        if (!p) {

            return {
                method: "4-Gram",
                direction: null,
                strength: 0,
                weight: 8,
                details:
                    `${lastPattern}: no historical match`
            };
        }

        const total =
            p.big + p.small;

        const probability =
            (p.big / total) * 100;

        return this._probabilitySignal(
            "4-Gram",
            probability,
            10,
            `${lastPattern} → ${p.big}B/${p.small}S`
        );
    }


    // ==========================================================
    // 5. RECENT RATIO
    // ==========================================================

    _recentRatio(r) {

        const recent =
            r.slice(-20);

        const big =
            recent.filter(
                x => x.size === "Big"
            ).length;

        const probability =
            (big / recent.length) * 100;

        return this._probabilitySignal(
            "Recent Ratio",
            probability,
            12,
            `Last ${recent.length}: ${big}B/${recent.length - big}S`
        );
    }


    // ==========================================================
    // 6. WEIGHTED RECENT RATIO
    // ==========================================================

    _weightedRatio(r) {

        const recent =
            r.slice(-20);

        let bigScore = 0;
        let totalWeight = 0;

        recent.forEach((x, index) => {

            const weight =
                index + 1;

            totalWeight += weight;

            if (x.size === "Big") {
                bigScore += weight;
            }
        });

        const probability =
            (bigScore / totalWeight) * 100;

        return this._probabilitySignal(
            "Weighted Recent",
            probability,
            14,
            `Weighted Big=${Math.round(probability)}%`
        );
    }


    // ==========================================================
    // 7. FULL FREQUENCY
    // ==========================================================

    _frequency(r) {

        const big =
            r.filter(
                x => x.size === "Big"
            ).length;

        const probability =
            (big / r.length) * 100;

        return this._probabilitySignal(
            "Frequency",
            probability,
            8,
            `${big}B/${r.length - big}S`
        );
    }


    // ==========================================================
    // 8. NUMBER DISTRIBUTION
    // ==========================================================

    _numberDistribution(r) {

        const recent =
            r.slice(-50);

        let big = 0;

        for (const x of recent) {

            if (x.number >= 5) {
                big++;
            }
        }

        const probability =
            (big / recent.length) * 100;

        return this._probabilitySignal(
            "Number Distribution",
            probability,
            8,
            `Last ${recent.length}: ${big} Big`
        );
    }


    // ==========================================================
    // 9. ALTERNATION
    // ==========================================================

    _alternation(r) {

        const recent =
            r.slice(-20);

        let changes = 0;

        for (
            let i = 1;
            i < recent.length;
            i++
        ) {

            if (
                recent[i].size !==
                recent[i - 1].size
            ) {
                changes++;
            }
        }

        const ratio =
            changes /
            (recent.length - 1);

        const last =
            recent[recent.length - 1].size;

        let probability = 50;

        // Very high alternation:
        // slight continuation of opposite side.
        if (ratio > 0.65) {

            probability =
                last === "Big"
                    ? 42
                    : 58;
        }

        // Very low alternation:
        // slight continuation of same side.
        else if (ratio < 0.35) {

            probability =
                last === "Big"
                    ? 56
                    : 44;
        }

        return this._probabilitySignal(
            "Alternation",
            probability,
            7,
            `Change rate=${Math.round(ratio * 100)}%`
        );
    }


    // ==========================================================
    // 10. BAYESIAN
    // ==========================================================

    _bayesian(r) {

        const recent =
            r.slice(-30);

        const big =
            recent.filter(
                x => x.size === "Big"
            ).length;

        // Beta(1,1) prior
        const probability =
            ((big + 1) /
            (recent.length + 2)) * 100;

        return this._probabilitySignal(
            "Bayesian",
            probability,
            10,
            `Posterior=${Math.round(probability)}%`
        );
    }


    // ==========================================================
    // 11. MULTI WINDOW
    // ==========================================================

    _recentWindow(r) {

        const windows = [
            5,
            10,
            20,
            50
        ];

        let totalProbability = 0;
        let count = 0;

        const details = [];

        for (const size of windows) {

            if (r.length < size) {
                continue;
            }

            const part =
                r.slice(-size);

            const big =
                part.filter(
                    x => x.size === "Big"
                ).length;

            const probability =
                (big / size) * 100;

            totalProbability +=
                probability;

            count++;

            details.push(
                `${size}:${Math.round(probability)}%`
            );
        }

        if (!count) {

            return {
                method: "Multi Window",
                direction: null,
                strength: 0,
                weight: 8,
                details: "No windows"
            };
        }

        const probability =
            totalProbability / count;

        return this._probabilitySignal(
            "Multi Window",
            probability,
            10,
            details.join(" | ")
        );
    }


    // ==========================================================
    // 12. LAST NUMBER PATTERN
    // ==========================================================

    _digitPattern(r) {

        const recent =
            r.slice(-10);

        const counts =
            Array(10).fill(0);

        for (const x of recent) {
            counts[x.number]++;
        }

        let bigCount = 0;
        let smallCount = 0;

        for (let n = 0; n <= 9; n++) {

            if (n >= 5) {
                bigCount += counts[n];
            } else {
                smallCount += counts[n];
            }
        }

        const probability =
            (bigCount /
            (bigCount + smallCount)) * 100;

        return this._probabilitySignal(
            "Last Number Pattern",
            probability,
            6,
            `Last ${recent.length}: ${bigCount}B/${smallCount}S`
        );
    }


    // ==========================================================
    // PROBABILITY → SIGNAL
    // ==========================================================

    _probabilitySignal(
        method,
        probability,
        weight,
        details
    ) {

        if (
            !Number.isFinite(probability)
        ) {

            return {
                method,
                direction: null,
                strength: 0,
                weight,
                details
            };
        }

        const distance =
            Math.abs(
                probability - 50
            );

        // Ignore almost 50/50 signals
        if (distance < 2) {

            return {
                method,
                direction: null,
                strength: 0,
                weight,
                details:
                    `${details} | Neutral`
            };
        }

        const direction =
            probability > 50
                ? "Big"
                : "Small";

        // Confidence/strength of this individual method
        const strength =
            Math.min(
                1,
                distance / 50
            );

        return {

            method,

            direction,

            strength,

            weight,

            details:
                `${details} | P(Big)=${probability.toFixed(1)}%`
        };
    }


    // ==========================================================
    // NORMALIZE
    // ==========================================================

    _normalize(data) {

        if (!Array.isArray(data)) {
            return [];
        }

        return data
            .map(item => {

                if (
                    !item ||
                    typeof item !== "object"
                ) {
                    return null;
                }

                const number =
                    Number(item.number);

                if (
                    !Number.isInteger(number) ||
                    number < 0 ||
                    number > 9
                ) {
                    return null;
                }

                return {

                    number,

                    issueNumber:
                        String(
                            item.issueNumber ?? ""
                        ),

                    size:
                        number >= 5
                            ? "Big"
                            : "Small"
                };
            })
            .filter(Boolean);
    }


    // ==========================================================
    // STREAK
    // ==========================================================

    _getStreak(r) {

        if (!r.length) {
            return {
                type: null,
                count: 0
            };
        }

        const last =
            r[r.length - 1].size;

        let count = 1;

        for (
            let i = r.length - 2;
            i >= 0;
            i--
        ) {

            if (r[i].size === last) {
                count++;
            } else {
                break;
            }
        }

        return {
            type: last,
            count
        };
    }


    // ==========================================================
    // DISTRIBUTION
    // ==========================================================

    _distribution(r) {

        const big =
            r.filter(
                x => x.size === "Big"
            ).length;

        const small =
            r.length - big;

        return {

            big,

            small,

            total: r.length,

            bigPercent:
                Number(
                    (
                        big / r.length * 100
                    ).toFixed(2)
                ),

            smallPercent:
                Number(
                    (
                        small / r.length * 100
                    ).toFixed(2)
                )
        };
    }


    // ==========================================================
    // LEVEL
    // ==========================================================

    _getLevel(c) {

        if (c >= 90) {
            return "VERY_HIGH";
        }

        if (c >= 75) {
            return "HIGH";
        }

        if (c >= 65) {
            return "MODERATE";
        }

        return "LOW";
    }


    // ==========================================================
    // ERROR
    // ==========================================================

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
// ENGINE
// ============================================================

const predictorEngine =
    new Predictor({
        betThreshold: 75
    });


// ============================================================
// REAL WINGO HISTORY API
// ============================================================

const HISTORY_URL =
    "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";


// ============================================================
// FETCH HISTORY
// ============================================================

async function fetchHistory() {

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
                `HTTP ${response.status}`
            );
        }

        const json =
            await response.json();

        // ======================================================
        // EXACT STRUCTURE FROM YOUR JSON
        // json.data.list
        // ======================================================

        if (
            !json ||
            !json.data ||
            !Array.isArray(
                json.data.list
            )
        ) {

            throw new Error(
                "Invalid WinGo API structure: data.list not found"
            );
        }

        return json.data.list;

    } finally {

        clearTimeout(timeout);
    }
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
    // GET ONLY
    // ----------------------------------------------------------

    if (req.method !== "GET") {

        return res.status(405).json({

            status: "error",

            message:
                "Only GET method is allowed"
        });
    }

    // ----------------------------------------------------------
    // TARGET PERIOD
    // ----------------------------------------------------------

    const period =
        req.query?.period;

    if (
        !period ||
        String(period).trim() === ""
    ) {

        return res.status(400).json({

            status: "error",

            message:
                "Valid period is required. Example: ?period=20260828100052352",

            shouldBet: false,

            action: "SKIP"
        });
    }

    const targetPeriod =
        String(period).trim();

    try {

        // ------------------------------------------------------
        // GET REAL HISTORY
        // ------------------------------------------------------

        const rawHistory =
            await fetchHistory();

        if (
            !rawHistory ||
            rawHistory.length < 20
        ) {

            return res.status(503).json({

                status: "error",

                message:
                    "Not enough real WinGo history",

                historyCount:
                    rawHistory?.length || 0,

                shouldBet: false,

                action: "SKIP"
            });
        }

        // ------------------------------------------------------
        // REMOVE TARGET PERIOD
        //
        // If target is already present in API,
        // don't use its result for predicting itself.
        // ------------------------------------------------------

        let history =
            rawHistory.filter(
                item =>
                    String(
                        item.issueNumber
                    ) !== targetPeriod
            );

        // ------------------------------------------------------
        // API gives newest → oldest.
        // Predictor needs oldest → newest.
        // ------------------------------------------------------

        history =
            history.reverse();

        // ------------------------------------------------------
        // LAST 100 REAL RESULTS
        // ------------------------------------------------------

        history =
            history.slice(-100);

        // ------------------------------------------------------
        // PREDICT
        // ------------------------------------------------------

        const result =
            predictorEngine.predict(
                history
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
        // RESPONSE
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
                history.length,

            calculation:
                result.calculation,

            analysis:
                result.analysis,

            source:
                "WinGo real history",

            note:
                "Prediction is based on historical calculations only. Random outcomes are not guaranteed."
        });

    } catch (error) {

        console.error(
            "WINGO ERROR:",
            error
        );

        return res.status(500).json({

            status: "error",

            message:
                "Failed to fetch or calculate WinGo history",

            error:
                error.message,

            shouldBet: false,

            action: "SKIP"
        });
    }
};
