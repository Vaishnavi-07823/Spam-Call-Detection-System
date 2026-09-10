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
  Wifi,
  Battery,
  User,
  Grid,
  Plus,
  MessageSquare,
  Clock,
  PhoneCall,
  ShieldAlert,
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
      { title: "Live Monitoring — TrueShield AI" },
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
  const [simulatorMode, setSimulatorMode] = useState<"bot" | "user_scammer">("bot");
  const [callState, setCallState] = useState<"ringing" | "connected" | "interrupted" | "ended">("ringing");
  const [callDuration, setCallDuration] = useState(0);
  const [activeTurnIndex, setActiveTurnIndex] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<
    { speaker: "Scammer" | "You"; speakerName: string; text: string; risk: number; status: string }[]
  >([]);
  const ringtoneCtxRef = useRef<AudioContext | null>(null);
  const simulatorTimerRef = useRef<any>(null);
  const autoCutTimerRef = useRef<any>(null);
  const [manualInputText, setManualInputText] = useState("");

  // Load and cache browser voices for female vs male distinction
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        setAvailableVoices(v);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Distinct Female Voice (Crystal-Clear Natural Hindi Girl Voice for Victim)
  const femaleVoice = useMemo(() => {
    if (!availableVoices.length) return null;
    // 1. Natural Hindi female voice (Swara Online is studio quality in Edge/Windows)
    const naturalHindiFemale = availableVoices.find(
      (v) =>
        v.lang.toLowerCase().startsWith("hi") &&
        /swara|kalpana|geeta|heera|kavya|natural/i.test(v.name)
    );
    if (naturalHindiFemale) return naturalHindiFemale;

    // 2. Google Hindi (female in Chrome)
    const googleHindi = availableVoices.find(
      (v) => v.lang.toLowerCase().startsWith("hi") && /google/i.test(v.name)
    );
    if (googleHindi) return googleHindi;

    // 3. Any Hindi voice
    const anyHindi = availableVoices.find((v) => v.lang.toLowerCase().startsWith("hi"));
    if (anyHindi) return anyHindi;

    // 4. Indian English female voice
    const inFemale = availableVoices.find(
      (v) =>
        v.lang.toLowerCase().includes("in") &&
        /swara|heera|neerja|priya|female/i.test(v.name)
    );
    if (inFemale) return inFemale;

    // 5. Any clear female voice
    const anyFemale = availableVoices.find((v) =>
      /female|zira|samantha|kavya|karen|victoria/i.test(v.name)
    );
    if (anyFemale) return anyFemale;

    return availableVoices[0] || null;
  }, [availableVoices]);

  // Distinct Male Voice (Authoritative Bank Scammer Voice)
  const maleVoice = useMemo(() => {
    if (!availableVoices.length) return null;
    // 1. Hindi male voice (Madhur / Ravi / Hemant)
    const hiMale = availableVoices.find(
      (v) =>
        v.lang.toLowerCase().startsWith("hi") &&
        /madhur|ravi|hemant|david|male/i.test(v.name)
    );
    if (hiMale) return hiMale;

    // 2. Indian English male voice
    const inMale = availableVoices.find(
      (v) =>
        v.lang.toLowerCase().includes("in") &&
        /madhur|ravi|prabhat|david|male/i.test(v.name)
    );
    if (inMale) return inMale;

    // 3. Any distinct male voice
    const anyMale = availableVoices.find(
      (v) =>
        /male|david|george|mark|alex|daniel/i.test(v.name) &&
        v.name !== femaleVoice?.name
    );
    if (anyMale) return anyMale;

    const otherVoice = availableVoices.find((v) => v.name !== femaleVoice?.name);
    return otherVoice || availableVoices[0] || null;
  }, [availableVoices, femaleVoice]);

  // Simulated 2-Way Turn-by-Turn Hindi Phone Conversation (Spammer Male vs Victim Girl)
  const SIMULATED_CONVERSATION = useMemo(
    () => [
      {
        speaker: "Scammer" as const,
        speakerName: "Rajesh Sharma (SBI Security Desk)",
        gender: "male" as const,
        role: "Caller (Bank Scammer)",
        hindi: "Namaste madam! Main State Bank of India Mumbai Head Office se Rajesh Sharma bol raha hoon. Kya meri baat account holder se ho rahi hai?",
        english: "Hello madam! I am Rajesh Sharma calling from SBI Mumbai Head Office. Am I speaking with the account holder?",
        risk: 12,
        status: "Safe Initial Contact",
        pitch: 0.88,
        rate: 0.98,
      },
      {
        speaker: "You" as const,
        speakerName: "Account Holder (You)",
        gender: "female" as const,
        role: "You (Target)",
        hindi: "Haan ji namaste sir. Ji boliye, main account holder hi bol rahi hoon. Kahiye kya kaam tha?",
        english: "Yes hello sir. Yes, I am the account holder. How can I help you?",
        risk: 12,
        status: "Safe Conversation",
        pitch: 1.10,
        rate: 0.96,
      },
      {
        speaker: "Scammer" as const,
        speakerName: "Rajesh Sharma (SBI Security Desk)",
        gender: "male" as const,
        role: "Caller (Bank Scammer)",
        hindi: "Madam, aapka SBI Global debit card pichle do saal se active hai na? Bank security update ke liye bas ek routine verification chal raha hai.",
        english: "Madam, your SBI Global debit card has been active for 2 years, right? This is a routine bank database update verification.",
        risk: 24,
        status: "Trust Building & Verification Claim",
        pitch: 0.88,
        rate: 0.98,
      },
      {
        speaker: "You" as const,
        speakerName: "Account Holder (You)",
        gender: "female" as const,
        role: "You (Target)",
        hindi: "Acha theek hai sir, par mere account ya card mein koi dikkat hai kya?",
        english: "Okay sir, but is there any issue with my account or card?",
        risk: 24,
        status: "Trust Building & Verification Claim",
        pitch: 1.10,
        rate: 0.96,
      },
      {
        speaker: "Scammer" as const,
        speakerName: "Rajesh Sharma (SBI Security Desk)",
        gender: "male" as const,
        role: "Caller (Bank Scammer)",
        hindi: "Ji madam! Naye RBI guidelines ke mutabik agar aaj raat 12 baje se pehle aapka e-KYC update nahi hua, toh aapka khata aur debit card permanently freeze ho jayega!",
        english: "Yes madam! Under new RBI rules, if your e-KYC is not updated before midnight, your account and debit card will be permanently frozen!",
        risk: 65,
        status: "⚠️ Coercive Urgency & Account Freeze Threat",
        pitch: 0.88,
        rate: 1.0,
      },
      {
        speaker: "You" as const,
        speakerName: "Account Holder (You)",
        gender: "female" as const,
        role: "You (Target)",
        hindi: "Arre sir par main toh kal subah bank branch jaa kar aaram se apna KYC karwa lungi na!",
        english: "Oh sir, but I can just visit my bank branch tomorrow morning and do the KYC easily!",
        risk: 65,
        status: "⚠️ Coercive Urgency & Account Freeze Threat",
        pitch: 1.10,
        rate: 0.96,
      },
      {
        speaker: "Scammer" as const,
        speakerName: "Rajesh Sharma (SBI Security Desk)",
        gender: "male" as const,
        role: "Caller (Bank Scammer)",
        hindi: "Nahi madam! Kal tak der ho jayegi, server lock ho jayega! Hum direct helpline se unblock kar rahe hain. Maine aapke phone par 6-digit OTP bheja hai, turant apna OTP aur PIN batayein warna police complaint hogi aur khata band!",
        english: "No madam! Tomorrow will be too late! We are unblocking online right now. I sent a 6-digit OTP to your mobile, share your OTP immediately or face police action and account closure!",
        risk: 95,
        status: "🚨 CRITICAL: OTP Extortion & Police Threat",
        pitch: 0.88,
        rate: 1.02,
      },
    ],
    []
  );

  // Active simulated dialogue turn
  const currentTurn = useMemo(() => {
    return (
      SIMULATED_CONVERSATION[activeTurnIndex] ||
      SIMULATED_CONVERSATION[0] || {
        speaker: "Scammer",
        speakerName: "Caller",
        gender: "male",
        role: "Caller",
        hindi: "",
        english: "",
        risk: 10,
        status: "Call Active",
        pitch: 1.0,
        rate: 1.0,
      }
    );
  }, [SIMULATED_CONVERSATION, activeTurnIndex]);

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

  /** Play realistic Telecom Disconnect 3-tone Beep Sequence */
  const playDisconnectTone = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      // 3 fast beeps standard in mobile carrier call termination (425 Hz)
      [0, 0.35, 0.7].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(425, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.25);
      });
    } catch {
      // Ignore if audio context not permitted
    }
  };

  /** Open Simulator & Start Ringtone */
  const openSimulator = (mode: "bot" | "user_scammer" = "bot") => {
    setSimulatorMode(mode);
    setIsSimulatorOpen(true);
    setCallState("ringing");
    setCallDuration(0);
    setActiveTurnIndex(0);
    setConversationHistory([]);
    startRingtone();
  };

  const closeSimulator = () => {
    stopRingtone();
    stopListening();
    clearTimeout(simulatorTimerRef.current);
    clearTimeout(autoCutTimerRef.current);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSimulatorOpen(false);
  };

  /** Protective Automatic Call Termination & Scammer Mute when OTP/Critical Risk is detected */
  const triggerProtectiveCallCut = useCallback(
    (transcriptText: string) => {
      // 1. Instantly silence the call and stop mic
      clearTimeout(simulatorTimerRef.current);
      clearTimeout(autoCutTimerRef.current);
      stopListening();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      // 2. Play telecom disconnect tones & haptic buzz
      playDisconnectTone();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }

      // 3. Show the emergency protective call-cut state in the smartphone UI
      setCallState("interrupted");

      // 4. After 2.4 seconds of showing the auto-cut screen, navigate to the threat alert report
      setTimeout(() => {
        closeSimulator();
        handleAnalyze(transcriptText);
      }, 2400);
    },
    [handleAnalyze, stopListening]
  );

  /** Play next dialogue turn in the 2-way conversation */
  const playTurn = useCallback(
    (index: number) => {
      if (index >= SIMULATED_CONVERSATION.length) {
        const fullTranscript = SIMULATED_CONVERSATION.map(
          (t) => `${t.speakerName}: ${selectedLang === "hi-IN" ? t.hindi : t.english}`
        ).join("\n");
        closeSimulator();
        handleAnalyze(fullTranscript);
        return;
      }

      const turn = SIMULATED_CONVERSATION[index];
      setActiveTurnIndex(index);
      const textToSpeak = selectedLang === "hi-IN" ? turn.hindi : turn.english;

      setConversationHistory((prev) => [
        ...prev,
        {
          speaker: turn.speaker,
          speakerName: turn.speakerName,
          text: textToSpeak,
          risk: turn.risk,
          status: turn.status,
        },
      ]);

      // CRITICAL PROTECTIVE INTERVENTION:
      // When the scammer reaches Turn 6 (OTP / Police threat demand, risk >= 90%),
      // VoxShield automatically mutes the scammer and disconnects the call mid-sentence!
      if (turn.risk >= 90) {
        const fullTranscriptSoFar = SIMULATED_CONVERSATION.slice(0, index + 1)
          .map((t) => `${t.speakerName}: ${selectedLang === "hi-IN" ? t.hindi : t.english}`)
          .join("\n");

        // Scammer begins speaking line... Exactly 2.8 seconds in (as soon as OTP is uttered), CUT THE CALL!
        autoCutTimerRef.current = setTimeout(() => {
          triggerProtectiveCallCut(fullTranscriptSoFar);
        }, 2800);
      }

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = selectedLang === "hi-IN" ? "hi-IN" : "en-IN";

        // Assign distinct female vs male voices
        if (turn.gender === "female" && femaleVoice) {
          utterance.voice = femaleVoice;
        } else if (turn.gender === "male" && maleVoice) {
          utterance.voice = maleVoice;
        }

        utterance.pitch = turn.pitch;
        utterance.rate = turn.rate;

        utterance.onend = () => {
          // If already interrupted, do not proceed to next turn
          simulatorTimerRef.current = setTimeout(() => {
            playTurn(index + 1);
          }, 1100);
        };

        utterance.onerror = () => {
          simulatorTimerRef.current = setTimeout(() => {
            playTurn(index + 1);
          }, 2500);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        simulatorTimerRef.current = setTimeout(() => {
          playTurn(index + 1);
        }, 3000);
      }
    },
    [SIMULATED_CONVERSATION, selectedLang, femaleVoice, maleVoice, handleAnalyze, triggerProtectiveCallCut]
  );

  /** Voice Response Synthesizer for AI Victim (Girl Voice) */
  const speakVictimResponse = useCallback(
    (text: string, onDone?: () => void) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        onDone?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLang === "hi-IN" ? "hi-IN" : "en-IN";
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      utterance.pitch = 1.12;
      utterance.rate = 0.98;
      utterance.onend = () => onDone?.();
      utterance.onerror = () => onDone?.();
      window.speechSynthesis.speak(utterance);
    },
    [selectedLang, femaleVoice]
  );

  /** Accept simulated call — starts 2-way conversation or live user roleplay */
  const handleAcceptSimulatedCall = () => {
    stopRingtone();
    setCallState("connected");

    if (simulatorMode === "user_scammer") {
      // User is the scammer! The AI Victim picks up and greets the user first in Hindi girl voice
      const initialGreeting =
        selectedLang === "hi-IN"
          ? "Haan ji namaste, kaun bol raha hai? Ji kahiye kya kaam tha?"
          : "Hello, yes who is speaking? How may I help you?";

      setConversationHistory([
        {
          speaker: "You",
          speakerName: "Account Holder (Priya Sharma)",
          text: initialGreeting,
          risk: 10,
          status: "Call Picked Up — Listening to Caller",
        },
      ]);

      speakVictimResponse(initialGreeting, () => {
        // Start listening to the user speaking into the microphone
        resetTranscript();
        startListening();
      });
    } else {
      // Pre-recorded realistic 2-way bot dialogue
      playTurn(0);
    }
  };

  /** In User-Scammer Mode: Watch user's live speech and respond as innocent victim, or auto-cut on OTP/Urgency */
  useEffect(() => {
    if (
      isSimulatorOpen &&
      simulatorMode === "user_scammer" &&
      callState === "connected" &&
      transcript.trim()
    ) {
      const lower = transcript.toLowerCase();
      const detectedRisk = analyzeWithRules(transcript);

      // Check if user (acting as scammer) demanded OTP, password, card details, or threatened police
      const hasOTP = /otp|one time password|pin|cvv|6-digit|6 digit|password|code/i.test(lower);
      const hasPoliceOrFreeze = /police|arrest|jail|freeze|block|band|suspend|fir/i.test(lower);

      if (hasOTP || detectedRisk.ruleScore >= 75) {
        // 🚨 AUTO-CUT! Scammer demanded OTP or high-risk coercion
        triggerProtectiveCallCut(
          `Scammer (Live User Call): ${transcript}\nVictim: [TRUESHIELD INTERVENTION — Call Terminated Mid-Sentence to Protect OTP]`
        );
      } else if (hasPoliceOrFreeze && conversationHistory.length <= 2) {
        // AI Victim responds nervously to threat
        const responseText =
          selectedLang === "hi-IN"
            ? "Arre sir please account freeze mat kijiye! Par bank wale toh kabhi call par details nahi maangte na?"
            : "Oh please do not freeze my account sir! But banks never ask for credentials on call right?";

        setConversationHistory((prev) => [
          ...prev,
          {
            speaker: "Scammer",
            speakerName: "You (Live Caller / Scammer)",
            text: transcript,
            risk: detectedRisk.ruleScore,
            status: "Suspicious Bank Threat Detected",
          },
          {
            speaker: "You",
            speakerName: "Account Holder (Priya Sharma)",
            text: responseText,
            risk: detectedRisk.ruleScore,
            status: "Victim Responding with Caution",
          },
        ]);

        stopListening();
        speakVictimResponse(responseText, () => {
          resetTranscript();
          startListening();
        });
      }
    }
  }, [
    transcript,
    isSimulatorOpen,
    simulatorMode,
    callState,
    selectedLang,
    conversationHistory.length,
    speakVictimResponse,
    stopListening,
    startListening,
    resetTranscript,
    triggerProtectiveCallCut,
  ]);

  /** Instant fast-forward to scam alert with protective call-cut */
  const handleSkipToScam = () => {
    const threatText =
      selectedLang === "hi-IN"
        ? "Rajesh Sharma (SBI Security Desk): Namaste, SBI bank se bol rahe hain. Aapka khata aur card block ho gaya hai. Turant 6-digit OTP bataiye warna police case aur khata band hoga!"
        : "Rajesh Sharma (SBI Security Desk): Hello, this is State Bank fraud team. Your card is blocked. Give your 6-digit OTP right now or face police arrest and account freeze!";

    triggerProtectiveCallCut(threatText);
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
    <div className="flex min-h-screen flex-col items-center px-4 sm:px-6 pb-24 pt-6 max-w-5xl mx-auto w-full">
      {/* Top Header & Status Telemetry */}
      <motion.div
        className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-border/40"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight">Live Interception Deck</h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Active Radar
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dual-engine ambient speech decoding & conversational fraud detection
            </p>
          </div>
        </div>

        {/* Language Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-card/80 border border-border/60 shadow-sm backdrop-blur-sm">
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

      {/* Main Dual-Panel Command Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Interception Engine & Mic Controls (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-md overflow-hidden shadow-lg relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-primary/40" />
            <CardContent className="flex flex-col items-center gap-5 p-6">
              <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  ACOUSTIC SENSOR
                </span>
                <span className="font-mono text-[11px] text-primary">
                  {isListening ? "SAMPLING 48kHz" : "STANDBY"}
                </span>
              </div>

              {/* Waveform Visualization */}
              <div className="w-full py-2 flex justify-center">
                <WaveformAnimation isActive={isListening} />
              </div>

              {/* Mic Toggle Button */}
              <motion.div whileTap={{ scale: 0.95 }} className="relative">
                {isListening && (
                  <div className="absolute -inset-3 rounded-full bg-red-500/20 animate-ping" />
                )}
                <Button
                  size="lg"
                  variant={isListening ? "destructive" : "default"}
                  className={`h-20 w-20 rounded-full p-0 shadow-2xl transition-all duration-300 ${
                    isListening
                      ? "ring-4 ring-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                      : "shadow-[0_0_25px_rgba(59,130,246,0.35)] hover:scale-105"
                  }`}
                  onClick={handleMicToggle}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : isListening ? (
                    <MicOff className="h-8 w-8" />
                  ) : (
                    <Mic className="h-8 w-8" />
                  )}
                </Button>
              </motion.div>

              <div className="text-center">
                <p className="text-xs font-semibold text-foreground">
                  {isAnalyzing
                    ? "Deep Neural Fraud Analysis..."
                    : isListening
                      ? "Interception Active — Listening..."
                      : "Click Mic to Begin Interception"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isListening
                    ? "Speak normally or simulate caller speech"
                    : "Or simulate a realistic phone call below"}
                </p>
              </div>

              {/* Showstopper: Realistic Call Simulators */}
              <div className="w-full pt-3 border-t border-border/40 flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full text-xs h-11 font-bold border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 gap-2 shadow-sm transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  onClick={() => openSimulator("bot")}
                >
                  <Phone className="h-4 w-4 animate-bounce" />
                  📞 1. Auto 2-Way Call Simulator (Bot vs Bot)
                </Button>

                <Button
                  className="w-full text-xs h-11 font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white gap-2 shadow-md hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
                  onClick={() => openSimulator("user_scammer")}
                >
                  <PhoneCall className="h-4 w-4 animate-pulse" />
                  🎙️ 2. Live Roleplay: You Call as Scammer
                </Button>
              </div>

              {/* Fast 1-Click Evaluator Triggers */}
              {!isListening && !isAnalyzing && (
                <div className="w-full space-y-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block text-center">
                    Quick Evaluator Demos
                  </span>
                  <div className="flex w-full gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 text-[11px] h-9 font-semibold"
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
                      className="flex-1 text-[11px] h-9 font-medium border-border/70"
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

                  {/* Direct Text Input Fallback (for testing without microphone) */}
                  <div className="pt-2 w-full">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={manualInputText}
                        onChange={(e) => setManualInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && manualInputText.trim()) {
                            handleAnalyze(manualInputText.trim());
                          }
                        }}
                        placeholder={
                          selectedLang === "hi-IN"
                            ? "Type or paste Hindi call line to test..."
                            : "Type or paste English call line to test..."
                        }
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-900/90 border border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      />
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs font-semibold"
                        disabled={!manualInputText.trim() || isAnalyzing}
                        onClick={() => {
                          if (manualInputText.trim()) {
                            handleAnalyze(manualInputText.trim());
                          }
                        }}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Real-Time Forensic Intelligence Hub (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Live Threat Telemetry Meter */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-md p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Live Threat Probability
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-card border border-border/60 text-muted-foreground">
                  Dual-Engine Radar
                </span>
              </div>
              <span
                className={`text-sm font-extrabold ${
                  liveRisk && liveRisk.ruleScore >= 50
                    ? "text-red-400"
                    : liveRisk && liveRisk.ruleScore > 0
                      ? "text-amber-400"
                      : "text-emerald-400"
                }`}
              >
                {liveRisk ? `${liveRisk.ruleScore}% Risk` : "0% (Neutral)"}
              </span>
            </div>

            {/* Dynamic Progress Meter */}
            <div className="w-full h-3 bg-muted/40 rounded-full overflow-hidden p-0.5 border border-border/50">
              <motion.div
                className={`h-full rounded-full transition-all duration-300 ${
                  liveRisk && liveRisk.ruleScore >= 50
                    ? "bg-gradient-to-r from-amber-500 to-red-500"
                    : liveRisk && liveRisk.ruleScore > 0
                      ? "bg-gradient-to-r from-emerald-500 to-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${Math.max(5, liveRisk ? liveRisk.ruleScore : 5)}%` }}
              />
            </div>

            {/* Status Banner */}
            <div className="mt-3">
              {liveRisk && liveRisk.ruleScore >= 50 ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-semibold animate-pulse">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>CRITICAL THREAT: Conversational coercion & credential harvesting detected!</span>
                </div>
              ) : liveRisk && liveRisk.ruleScore > 0 ? (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>Elevated suspicion: monitoring subsequent statements for urgent requests...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Acoustic baseline clear — no coercive threat vectors matched.</span>
                </div>
              )}
            </div>

            {/* Matched Keywords Radar Chips */}
            {liveRisk && liveRisk.matchedKeywords.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Extracted Threat Vectors ({liveRisk.matchedKeywords.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {liveRisk.matchedKeywords.map((k, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-red-500/15 border border-red-500/40 text-red-300 flex items-center gap-1"
                    >
                      <span>{k.keyword}</span>
                      <span className="text-[9px] text-red-400/80">+{k.weight}pts</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Live Decrypted Speech Stream Terminal */}
          <Card className="flex-1 border-border/50 bg-card/40 backdrop-blur-md p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Live Decrypted Stream ({selectedLang})
                  </span>
                </div>
                {transcript && (
                  <button
                    onClick={resetTranscript}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Clear Stream
                  </button>
                )}
              </div>

              {transcript ? (
                <div className="font-mono text-xs sm:text-sm leading-relaxed p-3.5 rounded-xl bg-slate-950/60 border border-border/40 text-foreground max-h-56 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{transcript}</p>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground font-mono text-xs border border-dashed border-border/50 rounded-xl bg-card/20">
                  <Mic className="h-6 w-6 text-muted-foreground/40 mb-2" />
                  <p>Stream buffer empty</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    Speech captured via microphone or simulator will stream here in real time
                  </p>
                </div>
              )}
            </div>

            {/* Analysis Trigger Action */}
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Engine: Gemini 1.5 Flash + Rule-Based Heuristic
              </span>
              <Button
                className="w-full sm:w-auto font-bold text-xs h-10 px-5 shadow-md ml-auto"
                onClick={() => handleAnalyze()}
                disabled={isAnalyzing || !transcript.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    Analyzing Threat...
                  </>
                ) : (
                  <>
                    <Shield className="h-3.5 w-3.5 mr-2" />
                    Deep Analyze Threat
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 2-Way Live Phone Call Simulator Hyper-Realistic Smartphone Modal */}
      <AnimatePresence>
        {isSimulatorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-3 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.88, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.88, y: 30 }}
              className="w-full max-w-[370px] rounded-[48px] bg-slate-950 border-[6px] border-slate-800 p-5 flex flex-col items-center shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-white max-h-[92vh] overflow-y-auto relative select-none ring-1 ring-white/10"
            >
              {/* Smartphone Status Bar (Time, Dynamic Island, Signals) */}
              <div className="w-full flex items-center justify-between px-2 pt-1 pb-2">
                <span className="text-[12px] font-bold text-slate-300 font-mono">9:41</span>
                {/* Dynamic Island Notch */}
                <div className="w-24 h-5 rounded-full bg-black border border-slate-800 flex items-center justify-center px-2">
                  <div className="w-2 h-2 rounded-full bg-slate-900 mr-2" />
                  <div className="w-8 h-1 bg-slate-900 rounded-full" />
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="text-[10px] font-bold">5G</span>
                  <Wifi className="h-3.5 w-3.5" />
                  <Battery className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              </div>

              {callState === "ringing" ? (
                /* Hyper-Realistic Incoming Call Screen */
                <div className="flex flex-col items-center text-center w-full py-5">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-6">
                    INCOMING CELLULAR CALL...
                  </span>

                  {/* Caller Photo Avatar with Ringing Pulse */}
                  <div className="relative mb-5">
                    <div className="w-28 h-28 rounded-full bg-red-500/20 flex items-center justify-center animate-ping absolute inset-0" />
                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-slate-700 p-1 flex items-center justify-center shadow-2xl relative">
                      <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl">
                          {simulatorMode === "user_scammer" ? "👩" : "👨‍💼"}
                        </span>
                        <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-tight mt-0.5">
                          {simulatorMode === "user_scammer" ? "PRIYA SHARMA" : "SBI SECURITY"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Caller Information */}
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    {simulatorMode === "user_scammer"
                      ? "Priya Sharma (Victim)"
                      : "SBI Security Department"}
                  </h2>
                  <p className="text-xs font-semibold text-cyan-300 mt-0.5">
                    {simulatorMode === "user_scammer"
                      ? "Account Holder · Answering Call..."
                      : "Rajesh Sharma · Head Office Cyber Cell"}
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    {simulatorMode === "user_scammer" ? "+91 98451-22910" : "+91 98112-78401"}
                  </p>

                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 text-[10px] font-bold">
                    <AlertTriangle className="h-3 w-3" />
                    <span>
                      {simulatorMode === "user_scammer"
                        ? "🎙️ You are Caller: Speak into mic to scam, ask OTP to trigger Auto-Cut!"
                        : "Suspected Bank Impersonation / Credential Phishing"}
                    </span>
                  </div>

                  {/* Quick Options Bar (Remind Me / Message) */}
                  <div className="flex w-full justify-around items-center px-8 mt-10 mb-8 text-slate-400">
                    <button
                      onClick={closeSimulator}
                      className="flex flex-col items-center gap-1 hover:text-white transition-colors"
                    >
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px]">Remind Me</span>
                    </button>
                    <button
                      onClick={closeSimulator}
                      className="flex flex-col items-center gap-1 hover:text-white transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-[10px]">Message</span>
                    </button>
                  </div>

                  {/* Accept / Decline Buttons (Real Smartphone Style) */}
                  <div className="flex w-full justify-around items-center px-4">
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={closeSimulator}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/40 transition-transform active:scale-95"
                      >
                        <PhoneOff className="h-7 w-7 text-white" />
                      </button>
                      <span className="text-xs font-semibold text-slate-300">Decline</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={handleAcceptSimulatedCall}
                        className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-600/40 transition-transform active:scale-95 animate-pulse"
                      >
                        <Phone className="h-7 w-7 text-white" />
                      </button>
                      <span className="text-xs font-bold text-emerald-400">Accept</span>
                    </div>
                  </div>
                </div>
              ) : callState === "interrupted" ? (
                /* Protective Auto-Cut & Scammer Mute Screen */
                <div className="flex flex-col items-center text-center w-full py-8 px-2 animate-in fade-in duration-200">
                  <div className="relative mb-5">
                    <div className="w-24 h-24 rounded-full bg-red-600/30 flex items-center justify-center animate-ping absolute inset-0" />
                    <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.7)] relative">
                      <PhoneOff className="h-10 w-10 text-white animate-bounce" />
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-[10px] font-black uppercase tracking-wider mb-3">
                    <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                    <span>CALL TERMINATED BY AI DEFENSE</span>
                  </div>

                  <h3 className="text-xl font-black text-white leading-tight">
                    Scammer Muted & Call Disconnected!
                  </h3>

                  <p className="text-xs text-red-300/90 font-medium mt-2 leading-relaxed max-w-[280px]">
                    🚨 <span className="font-bold">OTP Extortion detected</span>. The scammer was instantly muted mid-sentence and the connection severed to protect your credentials.
                  </p>

                  <div className="mt-6 flex flex-col items-center gap-2 w-full p-3 rounded-2xl bg-red-950/40 border border-red-500/30">
                    <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                      <span>Generating Incident Forensic Report...</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Auto-redirecting to Threat Alert in 2 seconds
                    </span>
                  </div>
                </div>
              ) : (
                /* Hyper-Realistic Connected Call Screen */
                <div className="w-full flex flex-col items-center pt-2">
                  {/* Top Caller Header & Timer */}
                  <div className="flex flex-col items-center text-center w-full mb-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        {simulatorMode === "user_scammer"
                          ? "LIVE CALL: YOU ARE CALLER"
                          : "CALL CONNECTED (HINDI)"}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white">
                      {simulatorMode === "user_scammer"
                        ? "Priya Sharma (Account Holder)"
                        : "SBI Security Desk (Rajesh Sharma)"}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {String(Math.floor(callDuration / 60)).padStart(2, "0")}:
                      {String(callDuration % 60).padStart(2, "0")}
                    </p>

                    {/* Live Threat Escalation Badge */}
                    <div className="mt-2">
                      <span
                        className={`text-[10px] font-extrabold px-3 py-1 rounded-full border shadow-sm ${
                          currentTurn.risk >= 70
                            ? "bg-red-500/25 text-red-300 border-red-500/60 animate-pulse"
                            : currentTurn.risk >= 40
                              ? "bg-amber-500/25 text-amber-300 border-amber-500/60"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        }`}
                      >
                        {currentTurn.risk >= 70
                          ? `🚨 CRITICAL SCAM RISK: ${currentTurn.risk}%`
                          : currentTurn.risk >= 40
                            ? `⚠️ SUSPICIOUS URGENCY: ${currentTurn.risk}%`
                            : `🛡️ SCANNING CONVERSATION: ${currentTurn.risk}%`}
                      </span>
                    </div>
                  </div>

                  {/* Real Mobile 6-Keypad Function Grid */}
                  <div className="grid grid-cols-3 gap-2.5 w-full px-2 py-2 mb-2 bg-slate-900/60 rounded-2xl border border-slate-800/80">
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/50 text-slate-400 text-[10px]">
                      <MicOff className="h-4 w-4 mb-1 text-slate-300" />
                      <span>Mute</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/50 text-slate-400 text-[10px]">
                      <Grid className="h-4 w-4 mb-1 text-slate-300" />
                      <span>Keypad</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-primary/20 border border-primary/40 text-primary text-[10px] font-bold">
                      <Volume2 className="h-4 w-4 mb-1 text-primary animate-pulse" />
                      <span>Speaker</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/50 text-slate-400 text-[10px]">
                      <Plus className="h-4 w-4 mb-1 text-slate-300" />
                      <span>Add Call</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/50 text-slate-400 text-[10px]">
                      <User className="h-4 w-4 mb-1 text-slate-300" />
                      <span>Contacts</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                      <Shield className="h-4 w-4 mb-1 text-emerald-400 animate-pulse" />
                      <span>AI Active</span>
                    </div>
                  </div>

                  {/* 2-Way Dialogue Stream */}
                  <div className="w-full space-y-2.5 max-h-52 overflow-y-auto pr-1 my-2">
                    {conversationHistory.map((msg, idx) => {
                      const isScammer = msg.speaker === "Scammer";
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex flex-col ${
                            isScammer ? "items-start" : "items-end"
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-0.5 px-1">
                            <span className="text-[10px] font-bold">
                              {simulatorMode === "user_scammer"
                                ? isScammer
                                  ? "🎙️ You (Live Caller / Scammer)"
                                  : "👩 Priya (Account Holder)"
                                : isScammer
                                  ? "👨 Rajesh Sharma (SBI Caller)"
                                  : "👩 You (Account Holder)"}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                isScammer
                                  ? "bg-blue-500/20 text-blue-300"
                                  : "bg-pink-500/20 text-pink-300"
                              }`}
                            >
                              {isScammer ? "Caller" : "Girl Voice"}
                            </span>
                          </div>
                          <div
                            className={`p-2.5 rounded-2xl text-xs max-w-[88%] leading-relaxed ${
                              isScammer
                                ? "bg-slate-900 text-slate-100 rounded-tl-none border border-slate-700 shadow-sm"
                                : "bg-pink-950/40 text-pink-50 rounded-tr-none border border-pink-500/40 shadow-sm"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Live Speaker Telemetry Indicator */}
                  <div className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs mt-1">
                    <div className="flex items-center gap-2 text-slate-300">
                      {simulatorMode === "user_scammer" ? (
                        <>
                          <Mic className="h-4 w-4 text-red-400 animate-pulse" />
                          <span className="text-[11px] font-bold text-red-300">
                            Speak to scam: Try saying &ldquo;OTP bataiye&rdquo;...
                          </span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4 text-primary animate-pulse" />
                          <span className="text-[11px] font-bold">
                            {currentTurn.speaker === "Scammer"
                              ? "👨 Rajesh speaking (Male Voice)..."
                              : "👩 You speaking (Girl Voice)..."}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {simulatorMode === "user_scammer"
                        ? isListening
                          ? "Mic Live"
                          : "Connecting..."
                        : currentTurn.status}
                    </span>
                  </div>

                  {/* Active In-Call End Button & Fast Forward */}
                  <div className="flex items-center justify-between w-full pt-4 mt-2 border-t border-slate-800">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-9 border-amber-500/60 text-amber-300 hover:bg-amber-500/10 font-bold"
                      onClick={handleSkipToScam}
                    >
                      ⚡ Fast Forward to Threat
                    </Button>

                    <button
                      onClick={closeSimulator}
                      className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/50 transition-transform active:scale-95"
                    >
                      <PhoneOff className="h-6 w-6 text-white" />
                    </button>
                  </div>
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
