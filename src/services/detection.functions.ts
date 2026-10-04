/**
 * Detection Server Functions for VoxShield AI
 * 
 * Combines rule-based analysis with AI analysis for comprehensive
 * scam detection. Stores results in Supabase and provides history.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { analyzeWithRules, CATEGORY_LABELS } from "@/services/riskAnalyzer";
import { analyzeWithAI } from "@/services/geminiService.server";

/** Input validation schema for transcript analysis */
const detectInputSchema = z.object({
  transcript: z
    .string()
    .min(3, "Transcript must be at least 3 characters")
    .max(5000, "Transcript must be under 5000 characters"),
  sessionId: z.string().optional(),
  resetSession: z.boolean().optional(),
});

/**
 * Analyzes a transcript for scam indicators using both
 * rule-based keyword matching and AI-powered analysis with conversation context.
 * Final score = max(ruleScore, aiScore) for maximum sensitivity.
 */
export const detectScam = createServerFn({ method: "POST" })
  .inputValidator((input: { transcript: string; sessionId?: string; resetSession?: boolean }) =>
    detectInputSchema.parse(input)
  )
  .handler(async ({ data }) => {
    const { transcript, sessionId, resetSession } = data;

    // Step 1: Rule-based analysis (fast, deterministic)
    const ruleResult = analyzeWithRules(transcript);

    // Step 2: AI-powered analysis with running context and fallback note
    let aiResult;
    let aiUnavailable = false;

    try {
      aiResult = await analyzeWithAI(transcript, sessionId, resetSession);
    } catch (err) {
      console.warn("AI analysis timed out or failed, falling back to rules:", err);
      aiUnavailable = true;
      aiResult = {
        riskScore: ruleResult.ruleScore,
        category: ruleResult.primaryCategory,
        reason: ruleResult.reason,
        suggestion:
          ruleResult.ruleScore > 70
            ? "End the call immediately and block the number."
            : "This call appears safe, but stay vigilant.",
        detailedReasoning: ruleResult.reason,
      };
    }

    // Step 3: Combine scores — take maximum for safety
    const finalScore = Math.max(ruleResult.ruleScore, aiResult.riskScore);

    const finalCategory =
      ruleResult.ruleScore >= aiResult.riskScore
        ? ruleResult.primaryCategory
        : aiResult.category;

    const baseReason =
      ruleResult.matchedKeywords.length > 0 && aiResult.reason && !aiUnavailable
        ? `${aiResult.reason} Additionally, keyword analysis found: ${ruleResult.matchedKeywords
            .slice(0, 3)
            .map((m) => `"${m.keyword}"`)
            .join(", ")}.`
        : aiResult.reason || ruleResult.reason;

    const combinedReason = aiUnavailable
      ? `[Note: AI analysis unavailable, showing rule-based result] ${baseReason}`
      : aiResult.detailedReasoning && !baseReason.includes(aiResult.detailedReasoning)
        ? `${baseReason} Pattern Analysis: ${aiResult.detailedReasoning}`
        : baseReason;

    const suggestion =
      aiResult.suggestion ||
      (finalScore > 70
        ? "End the call immediately. Do not share any personal information. Block this number."
        : finalScore > 40
          ? "Proceed with caution. Verify the caller's identity through official channels."
          : "This call appears safe. No immediate action needed.");

    // Step 4: Store result in database
    const categoryLabel =
      CATEGORY_LABELS[finalCategory] || finalCategory;

    try {
      await supabaseAdmin.from("detections").insert({
        transcript,
        risk_score: finalScore,
        category: categoryLabel,
        reason: combinedReason,
        suggestion,
      });
    } catch (dbErr) {
      console.error("Failed to store detection:", dbErr);
      // Don't fail the response if DB insert fails
    }

    return {
      riskScore: finalScore,
      category: categoryLabel,
      explanation: combinedReason,
      suggestion,
      detailedReasoning: aiResult.detailedReasoning || combinedReason,
      timestamp: new Date().toISOString(),
      transcript,
    };
  });

/**
 * Fetches detection history from the database.
 * Returns the 50 most recent detections.
 */
export const getDetectionHistory = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("detections")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to fetch history:", error);
      throw new Error("Could not load detection history");
    }

    return (data || []).map((d) => ({
      id: d.id,
      riskScore: d.risk_score,
      explanation: d.reason,
      suggestion: d.suggestion || "",
      timestamp: d.created_at,
      transcript: d.transcript,
      category: d.category,
    }));
  }
);
