/**
 * Gemini AI Analysis Service for VoxShield AI
 * 
 * Uses Lovable AI Gateway (Google Gemini) to analyze transcripts
 * for scam intent using natural language understanding.
 */
import { z } from "zod";

/** Schema for the AI analysis response */
const aiAnalysisSchema = z.object({
  riskScore: z.number().min(0).max(100),
  category: z.string(),
  reason: z.string(),
  suggestion: z.string(),
});

export type AIAnalysisResult = z.infer<typeof aiAnalysisSchema>;

/**
 * Sends a transcript to Gemini via Lovable AI Gateway for scam analysis.
 * Uses tool calling for structured output extraction.
 */
export async function analyzeWithAI(transcript: string): Promise<AIAnalysisResult> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!LOVABLE_API_KEY && !GEMINI_API_KEY) {
    throw new Error("Neither LOVABLE_API_KEY nor GEMINI_API_KEY is configured.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    if (GEMINI_API_KEY) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a scam call detection AI. Analyze the given phone call transcript and determine if it's a scam.
Evaluate for: personal info requests (OTP, passwords), urgency/pressure, authority impersonation, lottery/prizes, unusual payments, remote access, threats.
Analyze this transcript:\n"${transcript}"`,
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
              },
              required: ["riskScore", "category", "reason", "suggestion"],
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

      return aiAnalysisSchema.parse(JSON.parse(textResponse));
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
            content: "You are a scam call detection AI. Return analysis using the analyze_transcript tool.",
          },
          { role: "user", content: transcript },
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
                },
                required: ["riskScore", "category", "reason", "suggestion"],
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

    return aiAnalysisSchema.parse(JSON.parse(toolCall.function.arguments));
  } finally {
    clearTimeout(timeoutId);
  }
}
