import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Shield,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Phone,
  PhoneOff,
  Volume2,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WaveformAnimation } from "@/components/WaveformAnimation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { analyzeTranscript } from "@/services/apiService";
import { analyzeWithRules } from "@/services/riskAnalyzer";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Live Monitoring — VoxShield AI" },
      { name: "description", content: "Live call monitoring and scam detection." },
    ],
  }),
  component: MonitoringPage,
});

function MonitoringPage() {
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState<"en-IN" | "hi-IN">("en-IN");
  const { transcript, isListening, error, lang, setLang, startListening, stopListening, resetTranscript } =
    useSpeechRecognition(selectedLang);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Call simulator states
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [callState, setCallState] = useState<"ringing" | "connected" | "ended">("ringing");
  const [callDuration, setCallDuration] = useState(0);
  const ringtoneCtxRef = useRef<AudioContext | null>(null);

  // Sync language selection
  const handleLanguageChange = (newLang: "en-IN" | "hi-IN") => {
    setSelectedLang(newLang);
    setLang(newLang);
  };

  // Live real-time keyword analysis as the user speaks
  const liveRisk = useMemo(() => {
    if (!transcript.trim()) return null;
    return analyzeWithRules(transcript.trim());
  }, [transcript]);

  const handleAnalyze = useCallback(
    async (customText?: string) => {
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
    },
    [transcript, stopListening, navigate]
  );

  // Auto-analyze when speech reaches high risk
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

  /** Web Audio Phone Ringtone Synthesizer */
  const startRingtone = () => {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    ringtoneCtxRef.current = ctx;

    let isRinging = true;
    const playRing = () => {
      if (!isRinging || ctx.state === "closed") return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 1.3);
      osc2.stop(ctx.currentTime + 1.3);

      setTimeout(playRing, 2500);
    };

    playRing();
  };

  const stopRingtone = () => {
    if (ringtoneCtxRef.current && ringtoneCtxRef.current.state !== "closed") {
      ringtoneCtxRef.current.close().catch(() => {});
      ringtoneCtxRef.current = null;
    }
  };

  /** Open Simulator & Start Ringtone */
  const openSimulator = () => {
    setIsSimulatorOpen(true);
    setCallState("ringing");
    setCallDuration(0);
    startRingtone();
  };

  const closeSimulator = () => {
    stopRingtone();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSimulatorOpen(false);
  };

  /** Accept simulated scam call */
  const handleAcceptSimulatedCall = () => {
    stopRingtone();
    setCallState("connected");

    const scamSpeech =
      selectedLang === "hi-IN"
        ? "Namaste, main SBI bank security branch se bol raha hoon. Aapka khata aur ATM card block ho gaya hai. Turant apna OTP aur account number verify karein warna police case ho jayega aur khata band ho jayega."
        : "Hello, this is State Bank fraud prevention department. Your debit card is blocked. You must verify your 6-digit OTP and account number right now, otherwise your account will be suspended immediately.";

    // Speak through browser speech synthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(scamSpeech);
      utterance.lang = selectedLang;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }

    // Trigger live analysis after 3 seconds of call speech
    setTimeout(() => {
      closeSimulator();
      handleAnalyze(scamSpeech);
    }, 3800);
  };

  // Call duration counter
  useEffect(() => {
    let interval: any;
    if (callState === "connected") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

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
          {isListening
            ? "Listening & transcribing in real time..."
            : "Tap mic to listen or simulate an incoming call"}
        </p>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 mt-3 p-1 rounded-full bg-card/80 border border-border/60">
          <Globe className="h-3.5 w-3.5 text-muted-foreground ml-2" />
          <button
            onClick={() => handleLanguageChange("en-IN")}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              selectedLang === "en-IN"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            English (en-IN)
          </button>
          <button
            onClick={() => handleLanguageChange("hi-IN")}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              selectedLang === "hi-IN"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            हिंदी / Hinglish
          </button>
        </div>
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
                SUSPICIOUS CALL: Threat {liveRisk.ruleScore}% (Detected:{" "}
                {liveRisk.matchedKeywords.map((k) => k.keyword).join(", ")})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Normal conversation detected so far.</span>
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

            <span className="text-xs font-medium text-muted-foreground text-center">
              {isAnalyzing
                ? "Analyzing conversation with Dual-Engine AI..."
                : isListening
                  ? "Speaking... Tap to stop & get instant alert"
                  : "Tap mic to speak or run simulator below"}
            </span>

            {/* Incoming Call Simulator Trigger (Showstopper for College Demo) */}
            <div className="w-full pt-2 border-t border-border/40">
              <Button
                variant="outline"
                className="w-full text-xs h-10 font-bold border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary gap-2"
                onClick={openSimulator}
              >
                <Phone className="h-3.5 w-3.5" />
                📞 Simulate Live Incoming Call
              </Button>
            </div>

            {/* Quick 1-Click Demo Buttons */}
            {!isListening && !isAnalyzing && (
              <div className="flex w-full gap-2 pt-1">
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 text-xs h-9 font-semibold"
                  onClick={() =>
                    handleAnalyze(
                      selectedLang === "hi-IN"
                        ? "Namaste, SBI bank se bol rahe hain. Aapka khata block ho chuka hai. Turant apna OTP aur password bataiye warna police complaint hogi."
                        : "Hello, this is State Bank verification. Your debit card is blocked. Please share your OTP and bank account number right now or your account will be suspended immediately."
                    )
                  }
                >
                  ⚡ Fast Scam Alert
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs h-9 font-medium"
                  onClick={() =>
                    handleAnalyze(
                      selectedLang === "hi-IN"
                        ? "Haan bhai main college pahuch gaya hoon. Class 10 baje shuru hogi, canteen mein milte hain."
                        : "Hello Priya, I have reached college. Are we meeting in the library before the lecture starts?"
                    )
                  }
                >
                  ✅ Fast Safe Demo
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
                  LIVE TRANSCRIPTION ({selectedLang})
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

      {/* Live Incoming Phone Call Simulator Modal */}
      <AnimatePresence>
        {isSimulatorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-xs rounded-3xl bg-slate-900 border border-slate-700 p-6 flex flex-col items-center text-center shadow-2xl text-white"
            >
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center animate-ping absolute inset-0" />
                <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-red-500/60 flex items-center justify-center relative">
                  <Phone className="h-10 w-10 text-red-400 animate-bounce" />
                </div>
              </div>

              <span className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-1">
                {callState === "ringing" ? "Incoming Call" : "Call Connected"}
              </span>
              <h3 className="text-lg font-bold">+91 98112-78401</h3>
              <p className="text-xs text-slate-400 mt-1 mb-6">
                {callState === "ringing"
                  ? "Suspected: SBI Fraud & Cyber Cell Dept"
                  : `In-Call Audio Stream: 00:0${callDuration}`}
              </p>

              {callState === "ringing" ? (
                <div className="flex w-full justify-between items-center px-4">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={closeSimulator}
                      className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                    >
                      <PhoneOff className="h-6 w-6 text-white" />
                    </button>
                    <span className="text-[11px] text-slate-300">Decline</span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={handleAcceptSimulatedCall}
                      className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center shadow-lg transition-transform active:scale-95 animate-pulse"
                    >
                      <Phone className="h-6 w-6 text-white" />
                    </button>
                    <span className="text-[11px] text-emerald-300 font-semibold">Accept</span>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/20 px-3 py-1.5 rounded-full">
                    <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                    <span>Caller speaking... VoxShield analyzing</span>
                  </div>
                  <button
                    onClick={closeSimulator}
                    className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg mt-2"
                  >
                    <PhoneOff className="h-5 w-5 text-white" />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
