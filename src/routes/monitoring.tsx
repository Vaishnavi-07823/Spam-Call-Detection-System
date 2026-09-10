/**
 * Monitoring Screen — Live listening UI with waveform animation.
 * Captures speech, sends to API, and navigates to Alert or Safe screen.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WaveformAnimation } from "@/components/WaveformAnimation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { analyzeTranscript } from "@/services/apiService";

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

  const handleAnalyze = useCallback(async (customText?: string) => {
    const textToAnalyze = (customText || transcript).trim();
    if (!textToAnalyze) return;

    setIsAnalyzing(true);
    setApiError(null);
    stopListening();

    try {
      const result = await analyzeTranscript(textToAnalyze);

      // Navigate based on risk score threshold
      if (result.riskScore > 70) {
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

  // Auto-analyze when speech reaches 60 characters or more
  useEffect(() => {
    if (transcript.length >= 60 && isListening) {
      const timer = setTimeout(() => {
        handleAnalyze();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [transcript, isListening, handleAnalyze]);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim().length > 5) {
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
          <h1 className="text-xl font-bold">Call Monitor</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {isListening ? "Listening... speak clearly into mic" : "Tap the mic to start listening"}
        </p>
      </motion.div>

      {/* Waveform Visualization */}
      <div className="my-6 w-full max-w-sm">
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
                ? "Analyzing speech for scam indicators..."
                : isListening
                  ? "Listening... Tap to stop & analyze"
                  : "Tap to start monitoring"}
            </span>

            {/* Quick 1-Click Demo Buttons for Viva / College Demo */}
            {!isListening && !isAnalyzing && (
              <div className="flex w-full gap-2 pt-2 border-t border-border/40">
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 text-xs h-8"
                  onClick={() =>
                    handleAnalyze(
                      "Hello, this is State Bank verification department. Your credit card is blocked. Please verify your OTP and account number right now or your account will be suspended."
                    )
                  }
                >
                  ⚡ Test Scam Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs h-8"
                  onClick={() =>
                    handleAnalyze(
                      "Hi Priya, I reached college on time. The lecture starts at 10 AM, let's meet at the library."
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

      {/* Live Transcript */}
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
                  LIVE TRANSCRIPT
                </span>
                <button
                  onClick={resetTranscript}
                  className="text-xs text-primary hover:underline"
                >
                  Clear
                </button>
              </div>
              <p className="max-h-32 overflow-y-auto text-sm leading-relaxed text-foreground">
                {transcript}
              </p>
            </CardContent>
          </Card>

          {/* Analyze Button */}
          {!isAnalyzing && (
            <Button
              className="mt-3 w-full font-semibold h-11"
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing}
            >
              Analyze Call Now
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
