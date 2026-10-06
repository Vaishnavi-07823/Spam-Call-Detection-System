/**
 * Rule-Based Risk Analyzer for VoxShield AI
 * 
 * Scans transcripts for known scam keywords and patterns.
 * Each keyword match increases the risk score.
 * Combined with AI analysis for final scoring.
 */

/** Weighted scam keywords — higher weight = stronger signal */
const SCAM_KEYWORDS: { keyword: string; weight: number; category: string }[] = [
  // High-Critical Credential & Banking Theft (Asking for these is an immediate scam)
  { keyword: "otp", weight: 75, category: "credential_theft" },
  { keyword: "one time password", weight: 75, category: "credential_theft" },
  { keyword: "cvv", weight: 75, category: "credential_theft" },
  { keyword: "pin", weight: 60, category: "credential_theft" },
  { keyword: "pin number", weight: 65, category: "credential_theft" },
  { keyword: "upi pin", weight: 75, category: "credential_theft" },
  { keyword: "password", weight: 60, category: "credential_theft" },
  { keyword: "net banking", weight: 40, category: "credential_theft" },

  // Critical Remote Access Tools
  { keyword: "anydesk", weight: 85, category: "tech_support_scam" },
  { keyword: "teamviewer", weight: 85, category: "tech_support_scam" },
  { keyword: "quicksupport", weight: 80, category: "tech_support_scam" },
  { keyword: "remote access", weight: 70, category: "tech_support_scam" },
  { keyword: "screen share", weight: 65, category: "tech_support_scam" },
  { keyword: "download app", weight: 40, category: "tech_support_scam" },
  { keyword: "apk", weight: 60, category: "tech_support_scam" },

  // Impersonation & Police/Govt Threats
  { keyword: "cbi", weight: 80, category: "impersonation" },
  { keyword: "police", weight: 65, category: "impersonation" },
  { keyword: "arrest warrant", weight: 85, category: "impersonation" },
  { keyword: "arrest", weight: 55, category: "impersonation" },
  { keyword: "customs", weight: 70, category: "impersonation" },
  { keyword: "narcotics", weight: 75, category: "impersonation" },
  { keyword: "illegal parcel", weight: 80, category: "impersonation" },
  { keyword: "fedex", weight: 50, category: "impersonation" },
  { keyword: "irs", weight: 60, category: "impersonation" },
  { keyword: "tax department", weight: 50, category: "impersonation" },
  { keyword: "law enforcement", weight: 60, category: "impersonation" },
  { keyword: "legal action", weight: 55, category: "impersonation" },

  // Financial, KYC & Account Blocking
  { keyword: "blocked", weight: 45, category: "financial_fraud" },
  { keyword: "block", weight: 35, category: "financial_fraud" },
  { keyword: "suspended", weight: 45, category: "financial_fraud" },
  { keyword: "kyc", weight: 60, category: "verification_scam" },
  { keyword: "aadhaar", weight: 40, category: "identity_theft" },
  { keyword: "pan card", weight: 45, category: "identity_theft" },
  { keyword: "bank account", weight: 40, category: "financial_fraud" },
  { keyword: "credit card", weight: 40, category: "financial_fraud" },
  { keyword: "debit card", weight: 40, category: "financial_fraud" },
  { keyword: "gift card", weight: 60, category: "financial_fraud" },
  { keyword: "wire transfer", weight: 50, category: "financial_fraud" },
  { keyword: "money transfer", weight: 45, category: "financial_fraud" },
  { keyword: "electricity bill", weight: 60, category: "financial_fraud" },
  { keyword: "power cut", weight: 50, category: "financial_fraud" },
  { keyword: "refund", weight: 40, category: "financial_fraud" },

  // Urgency & Pressure Tactics
  { keyword: "urgent", weight: 35, category: "pressure_tactic" },
  { keyword: "immediately", weight: 30, category: "pressure_tactic" },
  { keyword: "right now", weight: 30, category: "pressure_tactic" },
  { keyword: "act fast", weight: 35, category: "pressure_tactic" },
  { keyword: "within 10 minutes", weight: 40, category: "pressure_tactic" },
  { keyword: "expire", weight: 25, category: "pressure_tactic" },

  // Prize & Lottery Scams
  { keyword: "lottery", weight: 75, category: "lottery_scam" },
  { keyword: "you have won", weight: 75, category: "lottery_scam" },
  { keyword: "kbc", weight: 70, category: "lottery_scam" },
  { keyword: "prize", weight: 50, category: "lottery_scam" },
  { keyword: "congratulations", weight: 25, category: "lottery_scam" },

  // Indian Hindi / Hinglish Common Scam Patterns
  { keyword: "khata band", weight: 65, category: "financial_fraud" },
  { keyword: "khata block", weight: 70, category: "financial_fraud" },
  { keyword: "paisa bhejo", weight: 65, category: "financial_fraud" },
  { keyword: "paise bhejo", weight: 65, category: "financial_fraud" },
  { keyword: "bijli kat", weight: 70, category: "financial_fraud" },
  { keyword: "bijli bill", weight: 60, category: "financial_fraud" },
  { keyword: "light cut", weight: 55, category: "financial_fraud" },
  { keyword: "girftari", weight: 80, category: "impersonation" },
  { keyword: "police thana", weight: 75, category: "impersonation" },
  { keyword: "thana", weight: 50, category: "impersonation" },
  { keyword: "court case", weight: 70, category: "impersonation" },
  { keyword: "inaam", weight: 65, category: "lottery_scam" },
  { keyword: "inaam jeeta", weight: 75, category: "lottery_scam" },
  { keyword: "sim block", weight: 60, category: "verification_scam" },
  { keyword: "sim band", weight: 60, category: "verification_scam" },
  { keyword: "turant", weight: 30, category: "pressure_tactic" },
  { keyword: "jaldi", weight: 25, category: "pressure_tactic" },
  { keyword: "abhi ke abhi", weight: 40, category: "pressure_tactic" },
];

export interface RuleAnalysisResult {
  /** Risk score from rule-based analysis (0-100) */
  ruleScore: number;
  /** Matched keywords with their categories */
  matchedKeywords: { keyword: string; category: string; weight?: number }[];
  /** Primary scam category detected */
  primaryCategory: string;
  /** Human-readable reason */
  reason: string;
}

/**
 * Helper to match keyword with word boundary awareness.
 * Prevents false positives where short keywords (e.g., 'apk')
 * inadvertently match inside innocent words (e.g., 'aapka').
 */
function matchesKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
  return regex.test(text);
}

/**
 * Analyzes a transcript using keyword matching rules.
 * Returns a risk score and matched pattern details.
 */
export function analyzeWithRules(transcript: string): RuleAnalysisResult {
  const matchedKeywords: { keyword: string; category: string; weight: number }[] = [];
  let totalWeight = 0;

  // Scan for each keyword
  for (const entry of SCAM_KEYWORDS) {
    if (matchesKeyword(transcript, entry.keyword)) {
      matchedKeywords.push(entry);
      totalWeight += entry.weight;
    }
  }

  // Cap the rule score at 100
  const ruleScore = Math.min(totalWeight, 100);

  // Determine primary category by frequency
  const categoryCounts: Record<string, number> = {};
  for (const match of matchedKeywords) {
    categoryCounts[match.category] = (categoryCounts[match.category] || 0) + match.weight;
  }

  const primaryCategory =
    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";

  // Build human-readable reason
  const reason =
    matchedKeywords.length > 0
      ? `Detected ${matchedKeywords.length} suspicious pattern(s): ${matchedKeywords
          .slice(0, 5)
          .map((m) => `"${m.keyword}"`)
          .join(", ")}.`
      : "No suspicious keywords detected.";

  return { ruleScore, matchedKeywords, primaryCategory, reason };
}

/** Category labels for display */
export const CATEGORY_LABELS: Record<string, string> = {
  credential_theft: "Credential Theft",
  financial_fraud: "Financial Fraud",
  identity_theft: "Identity Theft",
  pressure_tactic: "Pressure Tactic",
  verification_scam: "Verification Scam",
  impersonation: "Impersonation",
  lottery_scam: "Lottery/Prize Scam",
  tech_support_scam: "Tech Support Scam",
  unknown: "Unknown",
  safe: "Safe",
};
