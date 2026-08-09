// Reading-risk assessment heuristic.
//
// Turns raw live gaze statistics into a clear per-session verdict so a
// grown-up can see at a glance whether a child's session "looks like
// struggling that may benefit from a specialist screening" versus "on track".
//
// IMPORTANT (same caveat as everywhere in this prototype): this is a
// heuristic used to *flag for review* — it does NOT diagnose dyslexia or
// any other condition. Only a trained professional can do that.

import { GAZE_CONFIG } from "./config";

export type RiskLevel = "low" | "moderate" | "high";

export interface ReadingAssessment {
    // Enough data to make a meaningful call (min saccades seen)
    hasEnoughData: boolean;
    flagged: boolean; // recommended for review/screening
    risk: RiskLevel;
    shortVerdict: string;
    signals: string[]; // human-readable reasons behind the verdict
    regressionRate: number; // 0..1
    avgFixationMs: number;
    longFixationCount: number;
    saccades: number;
    score: number; // internal 0..6 scale used to derive risk
}

export function assessReading(input: {
    saccades: number;
    regressions: number;
    avgFixation: number;
    longFixations: number;
}): ReadingAssessment {
    const { saccades = 0, regressions = 0, avgFixation = 0, longFixations = 0 } = input;

    const hasEnoughData = saccades >= GAZE_CONFIG.MIN_SACCADES_FOR_FLAG;
    const regressionRate = saccades > 0 ? regressions / saccades : 0;

    const signals: string[] = [];
    let score = 0;

    // Regression (looking back at already-read words) — strongest signal.
    if (regressionRate > 0.3) {
        score += 2;
        signals.push("Looks back at already-read words very often");
    } else if (regressionRate > 0.18) {
        score += 1;
        signals.push("Looks back at already-read words often");
    }

    // Long average fixation (slow, lingering on words).
    if (avgFixation > 420) {
        score += 2;
        signals.push("Spends unusually long on words");
    } else if (avgFixation > 350) {
        score += 1;
        signals.push("Pauses on words a little longer than expected");
    }

    // Frequent long (hesitant) pauses.
    if (longFixations >= 5) {
        score += 2;
        signals.push("Shows many long, hesitant pauses");
    } else if (longFixations >= 2) {
        score += 1;
        signals.push("Shows some long, hesitant pauses");
    }

    const flagged = hasEnoughData && score >= 3;
    const risk: RiskLevel = !hasEnoughData
        ? "low"
        : score >= 5
            ? "high"
            : score >= 3
                ? "moderate"
                : "low";

    const shortVerdict = !hasEnoughData
        ? "Not enough reading data yet"
        : flagged
            ? "Consider a reading-specialist screening"
            : "Looks on track this session";

    return {
        hasEnoughData,
        flagged,
        risk,
        shortVerdict,
        signals,
        regressionRate,
        avgFixationMs: avgFixation,
        longFixationCount: longFixations,
        saccades,
        score,
    };
}

