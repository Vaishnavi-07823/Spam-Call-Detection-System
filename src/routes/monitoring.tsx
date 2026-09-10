import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Shield, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WaveformAnimation } from "@/components/WaveformAnimation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { analyzeTranscript } from "@/services/apiService";
import { analyzeWithRules } from "@/services/riskAnalyzer";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Monitoring — VoxShield AI" },
      { name: "description", content: "Live call monitoring and scam detection." },
    ],
  }),
  component: MonitoringPage,
});

function MonitoringPage() {
  const navigate = useNavigate();
  const { transcript, isListening, error, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Live real-time keyword analysis as the user speaks
  const liveRisk = useMemo(() => {
    if (!transcript.trim()) return null;
    return analyzeWithRules(transcript.trim());
  }, [transcript]);

  const handleAnalyze = useCallback(async (customText?: string) => {
    const textToAnalyze = (customText || transcript).trim();
    if (!textToAnalyze) return;

    setIsAnalyzing(true);
    setApiError(null);
    stopListening();

    try {
      const result = await analyzeTranscript(textToAnalyze);

      // Navigate based on risk score threshold (>= 50 is High/Medium Threat)
      if (result.riskScore >= 50) {
        navigate({
          to: "/alert",
          search: {
            score: result.riskScore,
            explanation: result.explanation,
            suggestion: result.suggestion,
          },
        });
      } else {
        navigate({
          to: "/safe",
          search: {
            score: result.riskScore,
            explanation: result.explanation,
          },
        });
      }
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Failed to analyze transcript"
      );
      setIsAnalyzing(false);
    }
  }, [transcript, stopListening, navigate]);

  // Auto-analyze when speech reaches 40 characters or when critical scam pattern detected
  useEffect(() => {
    if (isListening && liveRisk && liveRisk.ruleScore >= 60) {
      const timer = setTimeout(() => {
        handleAnalyze();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [liveRisk, isListening, handleAnalyze]);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim().length > 3) {
        handleAnalyze();
      }
    } else {
      startListening();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-6 pb-24 pt-8">
      {/* Header */}
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="mb-2 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Live Call Monitor</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {isListening ? "Listening & transcribing live speech..." : "Tap the mic to start listening"}
        </p>
      </motion.div>

      {/* Live Threat Indicator Banner while listening */}
      {liveRisk && transcript && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 w-full max-w-sm"
        >
          {liveRisk.ruleScore >= 50 ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/15 border border-danger/40 text-danger text-xs font-semibold animate-pulse">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                SUSPICIOUS CALL: Risk {liveRisk.ruleScore}% (Detected:{" "}
                {liveRisk.matchedKeywords.map((k) => k.keyword).join(", ")})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Speech captured. Normal conversation pattern.</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Waveform Visualization */}
      <div className="my-5 w-full max-w-sm">
        <Card className="border-border/50 bg-card/50 overflow-hidden">
          <CardContent className="flex flex-col items-center gap-5 p-6">
            <WaveformAnimation isActive={isListening} />

            {/* Mic Toggle Button */}
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                className="h-16 w-16 rounded-full p-0 shadow-lg"
                onClick={handleMicToggle}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : isListening ? (
                  <MicOff className="h-7 w-7" />
                ) : (
                  <Mic className="h-7 w-7" />
                )}
              </Button>
            </motion.div>

            <span className="text-xs font-medium text-muted-foreground">
              {isAnalyzing
                ? "Analyzing conversation for fraud intent..."
                : isListening
                  ? "Speaking... Tap to stop & get instant result"
                  : "Tap mic & speak live"}
            </span>

            {/* 1-Click Demo Buttons for Viva / College */}
            {!isListening && !isAnalyzing && (
              <div className="flex w-full gap-2 pt-2 border-t border-border/40">
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 text-xs h-9 font-semibold"
                  onClick={() =>
                    handleAnalyze(
                      "Hello, this is State Bank verification. Your debit card is blocked. Please share your OTP and bank account number right now or your account will be suspended immediately."
                    )
                  }
                >
                  ⚡ Test Scam Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs h-9 font-medium"
                  onClick={() =>
                    handleAnalyze(
                      "Hello Priya, I have reached college. Are we meeting in the library before the lecture starts?"
                    )
                  }
                >
                  ✅ Test Safe Call
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Transcript Display */}
      {transcript && (
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground">
                  LIVE TRANSCRIPTION
                </span>
                <button
                  onClick={resetTranscript}
                  className="text-xs text-primary hover:underline"
                >
                  Clear
                </button>
              </div>
              <p className="max-h-32 overflow-y-auto text-sm leading-relaxed text-foreground font-medium">
                {transcript}
              </p>
            </CardContent>
          </Card>

          {/* Analyze Button */}
          {!isAnalyzing && (
            <Button
              className="mt-3 w-full font-semibold h-11 text-sm shadow-md"
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing}
            >
              Check Call for Scam (Analyze Now)
            </Button>
          )}
        </motion.div>
      )}

      {/* Error Display */}
      {(error || apiError) && (
        <motion.p
          className="mt-4 text-sm text-destructive"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error || apiError}
        </motion.p>
      )}
    </div>
  );
}
