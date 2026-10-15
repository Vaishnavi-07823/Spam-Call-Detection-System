/**
 * Gemini AI Analysis Service for TrueShield AI
 * 
 * Uses Google Gemini (or Lovable AI Gateway) to analyze transcripts
 * for scam intent using natural language understanding with full conversation context.
 */
import { z } from "zod";

/** In-memory running transcript store per call session */
const sessionTranscripts = new Map<string, string[]>();

/**
 * Resets the accumulated transcript history for a call session.
 */
export function resetCallSession(sessionId: string = "current_call_session"): void {
  sessionTranscripts.delete(sessionId);
}

/**
 * Retrieves the full running transcript accumulated for a call session.
 */
export function getRunningTranscript(sessionId: string = "current_call_session"): string {
  return (sessionTranscripts.get(sessionId) || []).join("\n");
}

/** Schema for the AI analysis response */
const aiAnalysisSchema = z.object({
  riskScore: z.number().min(0).max(100),
  category: z.string(),
  reason: z.string(),
  suggestion: z.string(),
  detailedReasoning: z.string().optional(),
});

export type AIAnalysisResult = z.infer<typeof aiAnalysisSchema>;

/**
 * Sends a transcript chunk to Gemini for scam analysis, accumulating and sending
 * the full running transcript for the current call session so the AI considers
 * the conversation's full arc.
 */
export async function analyzeWithAI(
  transcript: string,
  sessionId: string = "current_call_session",
  resetSession: boolean = false
): Promise<AIAnalysisResult> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!LOVABLE_API_KEY && !GEMINI_API_KEY) {
    throw new Error("Neither LOVABLE_API_KEY nor GEMINI_API_KEY is configured.");
  }

  // Reset session history if explicitly requested
  if (resetSession) {
    sessionTranscripts.delete(sessionId);
  }

  const trimmed = transcript.trim();
  const history = sessionTranscripts.get(sessionId) || [];
  const fullHistoryText = history.join(" ");

  // Accumulate running transcript without redundant repeats if caller already sends cumulative text
  if (history.length > 0 && trimmed.startsWith(fullHistoryText)) {
    sessionTranscripts.set(sessionId, [trimmed]);
  } else if (!history.includes(trimmed)) {
    history.push(trimmed);
    sessionTranscripts.set(sessionId, history);
  }

  const runningTranscript = (sessionTranscripts.get(sessionId) || [trimmed]).join("\n");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    if (GEMINI_API_KEY) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a scam call detection AI analyzing a phone call session in real time.
CRITICAL INSTRUCTION: Analyze the full conversation context across its entire arc, not just the latest chunk in isolation. A transcript chunk that seems innocent alone (e.g., asking for confirmation or saying okay) but follows earlier urgency, threats, or authority impersonation earlier in the call must still score high.

Full Running Conversation Transcript So Far:
"""
${runningTranscript}
"""

Latest Transcript Chunk:
"""
${trimmed}
"""

Evaluate the entire conversation arc for scam indicators: personal info requests (OTP, passwords, PINs), urgency/pressure tactics, authority impersonation, lottery/prizes, unusual payments, remote access, threats.
Provide:
1. riskScore: integer from 0 to 100
2. category: one of credential_theft, financial_fraud, identity_theft, pressure_tactic, verification_scam, impersonation, lottery_scam, tech_support_scam, safe
3. reason: concise explanation of the risk
4. suggestion: recommended safety action for the user
5. detailedReasoning: a short 1-line detailed reasoning explaining WHY that score was assigned, referencing what pattern across the conversation triggered it.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                riskScore: { type: "INTEGER" },
                category: {
                  type: "STRING",
                  enum: [
                    "credential_theft",
                    "financial_fraud",
                    "identity_theft",
                    "pressure_tactic",
                    "verification_scam",
                    "impersonation",
                    "lottery_scam",
                    "tech_support_scam",
                    "safe",
                  ],
                },
                reason: { type: "STRING" },
                suggestion: { type: "STRING" },
                detailedReasoning: {
                  type: "STRING",
                  description:
                    "A short 1-line detailed reasoning explaining WHY that score, referencing what pattern across the conversation triggered it.",
                },
              },
              required: ["riskScore", "category", "reason", "suggestion", "detailedReasoning"],
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API failed with status ${response.status}`);
      }

      const resJson = await response.json();
      const textResponse = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) throw new Error("Gemini API returned empty response");

      const parsed = JSON.parse(textResponse);
      if (!parsed.detailedReasoning && parsed.detailed_reasoning) {
        parsed.detailedReasoning = parsed.detailed_reasoning;
      }

      return aiAnalysisSchema.parse(parsed);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a scam call detection AI analyzing a phone call session in real time. Analyze the entire running conversation history across its full arc, not just the latest chunk in isolation. A statement that seems innocent alone but follows urgent pressure or impersonation earlier in the call should still score high. Return analysis using the analyze_transcript tool with a 1-line detailedReasoning explaining what pattern across the conversation triggered the score.",
          },
          {
            role: "user",
            content: `Full Running Conversation Transcript So Far:\n"""\n${runningTranscript}\n"""\n\nLatest Transcript Chunk:\n"""\n${trimmed}\n"""`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_transcript",
              parameters: {
                type: "object",
                properties: {
                  riskScore: { type: "number" },
                  category: { type: "string" },
                  reason: { type: "string" },
                  suggestion: { type: "string" },
                  detailedReasoning: {
                    type: "string",
                    description:
                      "A short 1-line detailed reasoning explaining WHY that score, referencing what pattern across the conversation triggered it.",
                  },
                },
                required: ["riskScore", "category", "reason", "suggestion", "detailedReasoning"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_transcript" } },
      }),
    });

    if (!response.ok) throw new Error(`AI Gateway failed with status ${response.status}`);

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("Missing tool call in AI response");

    const parsed = JSON.parse(toolCall.function.arguments);
    if (!parsed.detailedReasoning && parsed.detailed_reasoning) {
      parsed.detailedReasoning = parsed.detailed_reasoning;
    }

    return aiAnalysisSchema.parse(parsed);
  } finally {
    clearTimeout(timeoutId);
  }
}
