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
  Play,
  Pause,
  MessageSquare,
  Clock,
  PhoneCall,
  Radio,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { analyzeTranscript } from "@/services/apiService";
import { analyzeWithRules } from "@/services/riskAnalyzer";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Live Call Studio — VoiceGuard AI" },
      { name: "description", content: "Real-time call monitoring, transcription, and AI fraud detection studio." },
    ],
  }),
  component: MonitoringPage,
});

// Pre-defined sample call library matching the reference design
const SAMPLE_CALLS = [
  {
    id: "sample-normal",
    title: "Normal Conversation",
    duration: "02:34",
    tag: "No Detections",
    tagType: "safe" as const,
    riskScore: 6,
    callerNumber: "+91 98201 44520",
    callerName: "Pooja Verma (Friend)",
    transcriptLines: [
      { time: "00:00", speaker: "Pooja", text: "Hey! Are you free this weekend for the exhibition?" },
      { time: "00:04", speaker: "You", text: "Yeah, mostly free on Saturday afternoon. Where is it?" },
      { time: "00:09", speaker: "Pooja", text: "At the BKC convention center. Let me send you the passes." },
      { time: "00:15", speaker: "You", text: "Great, see you then! Take care." },
    ],
    detectionSummary: "No suspicious urgency, credential requests, or impersonation detected.",
    detectedKeywords: [],
  },
  {
    id: "sample-financial",
    title: "Suspicious Call (Financial)",
    duration: "03:12",
    tag: "Keywords Detected",
    tagType: "warning" as const,
    riskScore: 78,
    callerNumber: "+91 98765 43210",
    callerName: "Unknown Caller (Bank Alert)",
    transcriptLines: [
      { time: "00:00", speaker: "Caller", text: "Hello, I am calling from SBI fraud prevention department." },
      { time: "00:05", speaker: "Caller", text: "Your debit card was used for an unauthorized Rs 45,000 transfer." },
      { time: "00:11", speaker: "Caller", text: "To reverse this payment, open WhatsApp and share the 6-digit OTP right now." },
      { time: "00:18", speaker: "Caller", text: "If you don't share within 2 minutes, the money cannot be refunded." },
    ],
    detectionSummary: "Coercive urgency and OTP credential solicitation detected.",
    detectedKeywords: ["transfer", "amount", "WhatsApp", "OTP", "within 2 minutes"],
  },
  {
    id: "sample-business",
    title: "Business Meeting",
    duration: "05:47",
    tag: "No Detections",
    tagType: "safe" as const,
    riskScore: 10,
    callerNumber: "+91 91234 56789",
    callerName: "Arun Nair (Tech Lead)",
    transcriptLines: [
      { time: "00:00", speaker: "Arun", text: "Hello, I wanted to discuss the project update before the sprint demo." },
      { time: "00:05", speaker: "You", text: "Sure, let me share the details with you regarding the backend API." },
      { time: "00:10", speaker: "Arun", text: "I'll get back to you by the end of the day with the documentation." },
      { time: "00:16", speaker: "Arun", text: "Actually, there is some change in the plan for deployment." },
      { time: "04:22", speaker: "You", text: "We need to be careful about database indexing before launch." },
    ],
    detectionSummary: "Routine engineering collaboration. Standard professional vocabulary.",
    detectedKeywords: [],
  },
  {
    id: "sample-threat",
    title: "Threat Call (High Risk)",
    duration: "04:22",
    tag: "Multiple Detections",
    tagType: "danger" as const,
    riskScore: 96,
    callerNumber: "+91 88001 92841",
    callerName: "Fake Customs / Police Office",
    transcriptLines: [
      { time: "00:00", speaker: "Officer", text: "This is Inspector Vijay Kumar from Delhi Cyber Crime Cell." },
      { time: "00:04", speaker: "Officer", text: "An illegal parcel containing banned substances is registered under your Aadhaar." },
      { time: "00:12", speaker: "Officer", text: "You are placed under digital arrest right now. Do not disconnect this call." },
      { time: "00:20", speaker: "Officer", text: "Transfer Rs 50,000 to the court clearance account immediately to avoid FIR." },
    ],
    detectionSummary: "Critical extortion: Digital arrest extortion, law enforcement impersonation, and money transfer demand.",
    detectedKeywords: ["Cyber Crime", "illegal parcel", "digital arrest", "do not disconnect", "Transfer immediately"],
  },
];

export function MonitoringPage() {
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState<"en-IN" | "hi-IN">("hi-IN");
  const {
    transcript,
    interimTranscript,
    isListening,
    error,
    lang,
    setLang,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition(selectedLang);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Tabs inside Player & Sample sections
  const [activePlayerTab, setActivePlayerTab] = useState<"transcript" | "alerts">("transcript");
  const [activeSampleTab, setActiveSampleTab] = useState<"transcript" | "alerts">("transcript");
  const [selectedSample, setSelectedSample] = useState(SAMPLE_CALLS[1]);

  // LIVE INTERACTIVE CALL ENGINE STATES
  // callStatus: "idle" | "ringing" | "connected" | "cutting" | "ended_safe"
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "connected" | "cutting" | "ended_safe">("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [activeDialogueIndex, setActiveDialogueIndex] = useState(0);
  const [branchSelection, setBranchSelection] = useState<"undecided" | "suspicious" | "genuine">("undecided");
  const [liveTranscriptFeed, setLiveTranscriptFeed] = useState<
    { time: string; speaker: string; text: string; risk: number }[]
  >([]);
  const [currentRiskScore, setCurrentRiskScore] = useState(6);
  const [currentWarning, setCurrentWarning] = useState<string | null>(null);

  // Audio references
  const ringtoneCtxRef = useRef<AudioContext | null>(null);
  const dialogueTimerRef = useRef<any>(null);
  const callDurationTimerRef = useRef<any>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load voices for distinct male (scammer) vs female (victim) playback
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) setAvailableVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const maleVoice = useMemo(() => {
    if (!availableVoices.length) return null;
    const v = availableVoices.find(
      (voice) =>
        (voice.lang.includes("hi") || voice.lang.includes("IN")) &&
        /madhur|ravi|hemant|david|male/i.test(voice.name)
    );
    return v || availableVoices.find((voice) => /male|david|mark/i.test(voice.name)) || availableVoices[0];
  }, [availableVoices]);

  const femaleVoice = useMemo(() => {
    if (!availableVoices.length) return null;
    const v = availableVoices.find(
      (voice) =>
        (voice.lang.includes("hi") || voice.lang.includes("IN")) &&
        /swara|kalpana|geeta|heera|kavya|female/i.test(voice.name)
    );
    return v || availableVoices.find((voice) => /female|zira|samantha/i.test(voice.name)) || availableVoices[1] || availableVoices[0];
  }, [availableVoices]);

  // Ringtone synthesizer using Web Audio API
  const startRingtone = useCallback(() => {
    try {
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

        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + 1.8);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 2.0);
        osc2.stop(ctx.currentTime + 2.0);

        setTimeout(() => {
          if (isRinging && ctx.state !== "closed") playRing();
        }, 3800);
      };

      playRing();
      return () => {
        isRinging = false;
        if (ctx.state !== "closed") ctx.close().catch(() => {});
      };
    } catch {
      return () => {};
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneCtxRef.current && ringtoneCtxRef.current.state !== "closed") {
      ringtoneCtxRef.current.close().catch(() => {});
      ringtoneCtxRef.current = null;
    }
  }, []);

  // Format seconds to mm:ss
  const formatTimer = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Timer runner when connected
  useEffect(() => {
    if (callStatus === "connected") {
      callDurationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callDurationTimerRef.current) clearInterval(callDurationTimerRef.current);
    }
    return () => {
      if (callDurationTimerRef.current) clearInterval(callDurationTimerRef.current);
    };
  }, [callStatus]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopRingtone();
      if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    };
  }, [stopRingtone]);

  // Trigger Incoming Call (Ringing phase)
  const triggerIncomingCall = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    stopRingtone();
    setCallStatus("ringing");
    setCallDuration(0);
    setActiveDialogueIndex(0);
    setBranchSelection("undecided");
    setCurrentRiskScore(6);
    setCurrentWarning(null);
    setLiveTranscriptFeed([]);
    startRingtone();
  };

  // User accepts the call (Pickup phase)
  const acceptIncomingCall = () => {
    stopRingtone();
    setCallStatus("connected");
    setCallDuration(1);
    playTurn(0, "undecided");
  };

  // User declines or cancels the call
  const declineIncomingCall = () => {
    stopRingtone();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCallStatus("idle");
  };

  // Speak text with speech synthesis
  const speakText = (text: string, isMale: boolean, onDone: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setTimeout(onDone, 2500);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetVoice = isMale ? maleVoice : femaleVoice;
    if (targetVoice) utterance.voice = targetVoice;
    utterance.lang = "hi-IN";
    utterance.rate = 1.0;
    utterance.pitch = isMale ? 0.9 : 1.1;

    utterance.onend = () => {
      onDone();
    };
    utterance.onerror = () => {
      onDone();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Master turn-by-turn dialogue orchestrator
  const playTurn = (turnIndex: number, currentBranch: "undecided" | "suspicious" | "genuine") => {
    // SHARED OPENING (Turns 0 & 1)
    if (turnIndex === 0) {
      const text =
        selectedLang === "hi-IN"
          ? "Namaste madam! Main State Bank of India Mumbai Service desk se Rajesh Sharma bol raha hoon. Kya meri baat account holder se ho rahi hai?"
          : "Hello madam! I am Rajesh Sharma calling from SBI Mumbai Service desk. Am I speaking with the account holder?";

      setLiveTranscriptFeed((prev) => [
        ...prev,
        { time: "00:01", speaker: "Caller (Bank)", text, risk: 8 },
      ]);
      setCurrentRiskScore(8);
      setCurrentWarning("Routine bank service desk greeting.");

      speakText(text, true, () => {
        dialogueTimerRef.current = setTimeout(() => {
          playTurn(1, currentBranch);
        }, 1200);
      });
      return;
    }

    if (turnIndex === 1) {
      const text =
        selectedLang === "hi-IN"
          ? "Haan ji namaste sir. Ji boliye, main account holder hi bol rahi hoon. Kahiye kya kaam tha?"
          : "Yes hello sir. Yes, I am the account holder. Please tell me what this is regarding?";

      setLiveTranscriptFeed((prev) => [
        ...prev,
        { time: "00:05", speaker: "You (Target)", text, risk: 8 },
      ]);

      speakText(text, false, () => {
        // Now prompt user for branch decision if undecided
        setActiveDialogueIndex(2);
      });
      return;
    }

    // BRANCH A: SUSPICIOUS / SCAM FLOW (Turns 2 & 3 ➔ AUTO-CUT!)
    if (currentBranch === "suspicious") {
      if (turnIndex === 2) {
        const text =
          selectedLang === "hi-IN"
            ? "Ji madam! RBI guidelines ke mutabik agar aaj raat 12 baje se pehle e-KYC nahi hua toh aapka khata aur debit card permanently freeze ho jayega!"
            : "Yes madam! If e-KYC is not updated before midnight, your account and debit card will be permanently frozen!";

        setLiveTranscriptFeed((prev) => [
          ...prev,
          { time: "00:10", speaker: "Caller (Scammer)", text, risk: 65 },
        ]);
        setCurrentRiskScore(65);
        setCurrentWarning("⚠️ Coercive urgency & KYC account freeze threat detected!");

        speakText(text, true, () => {
          dialogueTimerRef.current = setTimeout(() => {
            playTurn(3, "suspicious");
          }, 1000);
        });
        return;
      }

      if (turnIndex === 3) {
        const text =
          selectedLang === "hi-IN"
            ? "Maine aapke phone par 6-digit OTP bheja hai, turant apna OTP aur PIN batayein warna police complaint hogi aur khata abhi band ho jayega!"
            : "I sent a 6-digit OTP to your phone, share your OTP and PIN immediately or face police complaint and account closure!";

        setLiveTranscriptFeed((prev) => [
          ...prev,
          { time: "00:16", speaker: "Caller (Scammer)", text, risk: 98 },
        ]);
        setCurrentRiskScore(98);
        setCurrentWarning("🚨 CRITICAL SCAM: OTP Extortion & Authority Impersonation!");

        speakText(text, true, () => {
          // ================= AUTO-CUT CIRCUIT BREAKER =================
          setCallStatus("cutting");
          if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }

          // Trigger high-risk siren / alert navigation
          setTimeout(() => {
            navigate({
              to: "/alert",
              search: {
                score: 98,
                explanation:
                  "Scammer impersonating bank representative demanded immediate 6-digit OTP and threatened account closure and police complaint.",
                suggestion:
                  "Call was automatically cut by TrueShield Circuit Breaker to prevent financial fraud. Do not share OTP.",
              },
            });
          }, 2400);
        });
        return;
      }
    }

    // BRANCH B: GENUINE / SAFE FLOW (Turns 2 & 3 ➔ CALL CONCLUDES SAFELY, NOT CUT!)
    if (currentBranch === "genuine") {
      if (turnIndex === 2) {
        const text =
          selectedLang === "hi-IN"
            ? "Madam, hum bas aapke registered branch communication address aur email ka routine annual confirmation lena chahte the. Koi confidential info nahi chahiye."
            : "Madam, we just wanted to confirm your registered communication address and email for routine records. No confidential info needed.";

        setLiveTranscriptFeed((prev) => [
          ...prev,
          { time: "00:10", speaker: "Caller (Bank)", text, risk: 6 },
        ]);
        setCurrentRiskScore(6);
        setCurrentWarning("Routine customer record confirmation. Zero risk keywords.");

        speakText(text, true, () => {
          dialogueTimerRef.current = setTimeout(() => {
            playTurn(3, "genuine");
          }, 1000);
        });
        return;
      }

      if (turnIndex === 3) {
        const text =
          selectedLang === "hi-IN"
            ? "Bahut badhiya madam, aapka confirmation record ho gaya hai. Yaad rahe bank kabhi aapse phone par OTP ya PIN nahi maangta. Have a great day!"
            : "Thank you madam, your confirmation is recorded. Remember banks never ask for OTP or PIN over phone. Have a wonderful day!";

        setLiveTranscriptFeed((prev) => [
          ...prev,
          { time: "00:16", speaker: "Caller (Bank)", text, risk: 4 },
        ]);
        setCurrentRiskScore(4);
        setCurrentWarning("Call Verified Genuine. No credential ask.");

        speakText(text, true, () => {
          setCallStatus("ended_safe");
          setTimeout(() => {
            navigate({
              to: "/safe",
              search: {
                score: 4,
                explanation:
                  "Routine banking communication address verification call. No suspicious urgency, threats, or OTP requests.",
              },
            });
          }, 2400);
        });
        return;
      }
    }
  };

  // Branch Decision Trigger
  const chooseBranch = (branch: "suspicious" | "genuine") => {
    setBranchSelection(branch);
    playTurn(2, branch);
  };

  return (
    <div className="w-full flex flex-col gap-6 py-4 selection:bg-blue-600/30">
      {/* ================= 1. LIVE CALL STUDIO PLAYER (DARK NAVY LIKE REFERENCE) ================= */}
      <section className="w-full rounded-2xl bg-[#091024] border border-slate-800 text-white p-5 sm:p-6 shadow-2xl overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Live Call
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                callStatus === "connected"
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                  : callStatus === "ringing"
                  ? "bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-pulse"
                  : callStatus === "cutting"
                  ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-ping"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  callStatus === "connected"
                    ? "bg-emerald-400 animate-pulse"
                    : callStatus === "ringing"
                    ? "bg-amber-400"
                    : callStatus === "cutting"
                    ? "bg-red-500"
                    : "bg-slate-500"
                }`}
              />
              {callStatus === "connected"
                ? "Live & Analyzing"
                : callStatus === "ringing"
                ? "Incoming Ringing..."
                : callStatus === "cutting"
                ? "AUTO-CUT DISCONNECTING"
                : callStatus === "ended_safe"
                ? "Concluded (Safe)"
                : "Standby"}
            </span>
            <span className="text-xs sm:text-sm font-mono text-slate-400 ml-1">
              {formatTimer(callDuration)}
            </span>
          </div>

          {/* Right Controls: Language Selector + Tab Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => {
                  setSelectedLang("hi-IN");
                  setLang("hi-IN");
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  selectedLang === "hi-IN" ? "bg-blue-600 text-white" : "text-slate-400"
                }`}
              >
                हिंदी / Hinglish
              </button>
              <button
                onClick={() => {
                  setSelectedLang("en-IN");
                  setLang("en-IN");
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  selectedLang === "en-IN" ? "bg-blue-600 text-white" : "text-slate-400"
                }`}
              >
                English
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
              <button
                onClick={() => setActivePlayerTab("transcript")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activePlayerTab === "transcript"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Live Transcript
              </button>
              <button
                onClick={() => setActivePlayerTab("alerts")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activePlayerTab === "alerts"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Detection Alerts</span>
                {currentRiskScore >= 50 && (
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ================= INCOMING CALL RINGING MODAL / OVERLAY ================= */}
        {callStatus === "ringing" && (
          <div className="my-6 p-6 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border-2 border-blue-500/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-blue-500/30 animate-ping absolute inset-0" />
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-3xl shadow-xl relative z-10">
                  👨‍💼
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
                  INCOMING CELLULAR CALL...
                </span>
                <h3 className="text-xl font-black text-white">Rajesh Sharma</h3>
                <p className="text-xs text-slate-300">SBI Mumbai Service & Verification Desk</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">+91 98765 43210</p>
              </div>
            </div>

            {/* Answer / Decline Button Pair */}
            <div className="flex items-center gap-4">
              <button
                onClick={declineIncomingCall}
                className="h-12 px-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-2 border border-slate-700"
              >
                <PhoneOff className="h-4 w-4" />
                <span>Decline</span>
              </button>

              <button
                onClick={acceptIncomingCall}
                className="h-12 px-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all hover:scale-105 active:scale-95 animate-bounce"
              >
                <Phone className="h-5 w-5" />
                <span>Pick Up & Listen</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= AUTO-CUT BANNER (WHEN SUSPICIOUS CALL IS KILLED) ================= */}
        {callStatus === "cutting" && (
          <div className="my-6 p-5 rounded-2xl bg-red-950 border-2 border-red-500 text-white shadow-[0_0_50px_rgba(239,68,68,0.6)] flex items-center gap-4 animate-bounce">
            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <PhoneOff className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-red-200">
                🚨 AUTO-CUT: CALL CUT BY TRUESHIELD CIRCUIT BREAKER!
              </h3>
              <p className="text-xs text-red-300 mt-0.5">
                Critical scam pattern verified: OTP demand + authority intimidation. Line terminated in &lt;120ms to protect account.
              </p>
            </div>
          </div>
        )}

        {/* ================= SAFE END BANNER ================= */}
        {callStatus === "ended_safe" && (
          <div className="my-6 p-5 rounded-2xl bg-emerald-950 border-2 border-emerald-500 text-white shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-emerald-200">
                ✓ CALL SAFELY CONCLUDED (NOT CUT)
              </h3>
              <p className="text-xs text-emerald-300 mt-0.5">
                Genuine verification call confirmed. Zero urgency or sensitive data requests detected.
              </p>
            </div>
          </div>
        )}

        {/* Main Player Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch">
          {/* Left Column (7 cols): Caller Info, Large Waveform, Call Controls */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6 pr-0 lg:pr-4">
            {/* Caller Identity Card */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center shrink-0 shadow-inner">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                    {callStatus === "connected" || callStatus === "ringing"
                      ? "Rajesh Sharma (SBI Bank)"
                      : selectedSample.callerName}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 font-mono mt-0.5">
                    {callStatus === "connected" || callStatus === "ringing"
                      ? "+91 98765 43210"
                      : selectedSample.callerNumber}
                  </p>
                  <span className="text-[10px] text-blue-400 font-medium mt-1 flex items-center gap-1">
                    <Radio className="h-3 w-3 animate-pulse" />
                    AI Acoustic Guard Active
                  </span>
                </div>
              </div>

              {/* Start Simulation Trigger if idle */}
              {callStatus === "idle" && (
                <Button
                  onClick={triggerIncomingCall}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2 px-4 h-10 rounded-xl shadow-lg shadow-blue-600/30"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Simulate Incoming Call</span>
                </Button>
              )}
            </div>

            {/* Glowing Center Waveform (Wide & Dynamic) */}
            <div
              className={`w-full h-24 sm:h-28 rounded-xl px-4 flex items-center justify-center gap-1.5 overflow-hidden transition-colors ${
                currentRiskScore > 70
                  ? "bg-red-950/40 border border-red-500/50"
                  : "bg-slate-950/60 border border-slate-800/80"
              }`}
            >
              {[20, 44, 28, 64, 80, 52, 95, 36, 72, 48, 88, 32, 60, 40, 76, 24, 68, 50, 84, 30, 48, 22].map(
                (h, idx) => (
                  <motion.span
                    key={idx}
                    className={`w-1 sm:w-1.5 rounded-full ${
                      currentRiskScore > 70
                        ? "bg-red-500"
                        : "bg-gradient-to-t from-blue-600 to-cyan-400"
                    }`}
                    animate={{
                      height:
                        callStatus === "connected" || isListening
                          ? [
                              `${Math.max(10, h * 0.3)}px`,
                              `${h}px`,
                              `${Math.max(8, h * 0.2)}px`,
                            ]
                          : `${Math.max(12, h * 0.25)}px`,
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.1,
                      delay: (idx % 8) * 0.08,
                      ease: "easeInOut",
                    }}
                  />
                )
              )}
            </div>

            {/* Turn Decision Selector (Appears during call for user to choose branch) */}
            {callStatus === "connected" && activeDialogueIndex === 2 && branchSelection === "undecided" && (
              <div className="p-3.5 rounded-xl bg-blue-950/70 border border-blue-500/50 flex flex-col gap-2.5 shadow-xl">
                <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Choose How the Caller Proceeds:
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => chooseBranch("suspicious")}
                    className="p-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-left transition-all"
                  >
                    <span className="text-xs font-bold text-red-300 block">
                      ⚠️ Caller Turns Suspicious (Scam)
                    </span>
                    <span className="text-[10px] text-slate-300 block mt-0.5">
                      Demands OTP & threats ➔ Auto-Cuts Call!
                    </span>
                  </button>

                  <button
                    onClick={() => chooseBranch("genuine")}
                    className="p-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-left transition-all"
                  >
                    <span className="text-xs font-bold text-emerald-300 block">
                      🛡️ Caller Stays Genuine (Safe)
                    </span>
                    <span className="text-[10px] text-slate-300 block mt-0.5">
                      Routine address verification ➔ Call NOT cut.
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* In-Call Controls Row */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Mute / Mic Button */}
                <button
                  onClick={() => {
                    if (callStatus === "connected") {
                      if (typeof window !== "undefined" && window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                      }
                    } else {
                      if (isListening) stopListening();
                      else {
                        resetTranscript();
                        startListening();
                      }
                    }
                  }}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                  title="Toggle Microphone"
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                {/* Incoming Call Simulator Trigger */}
                <button
                  onClick={triggerIncomingCall}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                  title="Trigger Incoming Call with Ringtone"
                >
                  <PhoneCall className="h-5 w-5 text-blue-400" />
                </button>
              </div>

              {/* End Call Button */}
              <button
                onClick={() => {
                  declineIncomingCall();
                  if (liveTranscriptFeed.length > 0) {
                    const fullText = liveTranscriptFeed.map((l) => l.text).join(" ");
                    if (currentRiskScore > 50) {
                      navigate({
                        to: "/alert",
                        search: {
                          score: currentRiskScore,
                          explanation: fullText,
                          suggestion: "Call disconnected by user. Inspect detected patterns.",
                        },
                      });
                    } else {
                      navigate({
                        to: "/safe",
                        search: { score: currentRiskScore, explanation: fullText },
                      });
                    }
                  }
                }}
                className="h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-600/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PhoneOff className="h-4 w-4" />
                <span>End Call</span>
              </button>
            </div>
          </div>

          {/* Right Column (5 cols): Live Transcript / Alert Log Box */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/70 rounded-xl border border-slate-800 p-4 min-h-[300px]">
            {activePlayerTab === "transcript" ? (
              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[260px] pr-1">
                {liveTranscriptFeed.length > 0 ? (
                  liveTranscriptFeed.map((line, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="font-mono text-slate-500 shrink-0 text-[11px] pt-0.5">
                        {line.time}
                      </span>
                      <p className="leading-snug">
                        <strong
                          className={
                            line.speaker.includes("Scammer")
                              ? "text-red-400"
                              : line.speaker.includes("Caller")
                              ? "text-blue-400"
                              : "text-emerald-400"
                          }
                        >
                          {line.speaker}:{" "}
                        </strong>
                        {line.text}
                      </p>
                    </div>
                  ))
                ) : (
                  selectedSample.transcriptLines.map((line, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="font-mono text-slate-500 shrink-0 text-[11px] pt-0.5">
                        {line.time}
                      </span>
                      <p className="leading-snug">
                        <strong className="text-blue-400">{line.speaker}: </strong>
                        {line.text}
                      </p>
                    </div>
                  ))
                )}

                {/* Ambient Real-Time Speech Stream if Mic Active */}
                {transcript && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-start gap-2.5 text-xs text-blue-300">
                    <span className="font-mono text-blue-400 shrink-0 text-[11px] pt-0.5">Live Mic</span>
                    <p className="leading-snug">{transcript}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Detection Alerts Tab */
              <div className="flex flex-col gap-3 py-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Continuous Threat Evaluation
                  </span>
                  <p className="text-sm font-semibold text-white">
                    Risk Score:{" "}
                    <span
                      className={
                        currentRiskScore > 70
                          ? "text-red-400 font-black text-base"
                          : currentRiskScore > 30
                          ? "text-amber-400 font-bold"
                          : "text-emerald-400 font-bold"
                      }
                    >
                      {currentRiskScore} / 100
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentWarning || "Awaiting live caller speech stream."}
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Alert Banner matching the Reference Image */}
            <div
              className={`mt-4 rounded-xl p-3 border flex items-start gap-3 transition-colors ${
                currentRiskScore > 50
                  ? "bg-red-500/15 border-red-500/40 text-red-200"
                  : "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
              }`}
            >
              <div className="mt-0.5">
                {currentRiskScore > 50 ? (
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
              </div>
              <div className="flex-1 text-xs">
                <p className="font-bold text-white">
                  {currentRiskScore > 50
                    ? "Suspicious Keyword Detected — Circuit Breaker Active"
                    : "Call Status: Normal & Safe"}
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {currentRiskScore > 50
                    ? `Keyword: OTP / Freeze / Urgent | Confidence: ${currentRiskScore}% (Call will auto-cut)`
                    : "No high-risk vectors detected. Verified dialogue pattern (Call will not be cut)."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. SAMPLE CALL SUITE (WHITE CARD LAYOUT AS IN REFERENCE) ================= */}
      <section className="w-full rounded-2xl bg-white text-slate-900 border border-slate-200/90 p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xl font-bold tracking-tight text-slate-900">Sample Call</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Try our system with a sample call to see how it works.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (6 cols): List of 4 Pre-Loaded Scenarios */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            {SAMPLE_CALLS.map((sample) => {
              const isSelected = selectedSample.id === sample.id;
              return (
                <div
                  key={sample.id}
                  onClick={() => {
                    setSelectedSample(sample);
                    setCurrentRiskScore(sample.riskScore);
                    setCurrentWarning(sample.detectionSummary);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-sm"
                      : "border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSample(sample);
                        setCurrentRiskScore(sample.riskScore);
                        // Speak first line using speech synthesis
                        if (typeof window !== "undefined" && window.speechSynthesis) {
                          window.speechSynthesis.cancel();
                          const utt = new SpeechSynthesisUtterance(sample.transcriptLines[0].text);
                          utt.lang = "en-IN";
                          window.speechSynthesis.speak(utt);
                        }
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105 ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-blue-100 text-blue-600"
                      }`}
                      title="Play Audio Sample"
                    >
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </button>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        {sample.title}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        {sample.duration}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                      sample.tagType === "safe"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : sample.tagType === "warning"
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-red-50 text-red-600 border-red-200"
                    }`}
                  >
                    {sample.tag}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right Column (6 cols): Active Sample Preview Card */}
          <div className="lg:col-span-6 rounded-xl border border-slate-200/90 bg-slate-50/40 p-5 flex flex-col justify-between min-h-[320px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedSample.riskScore > 50 ? "bg-red-500" : "bg-emerald-500"
                    }`}
                  />
                  <h4 className="font-bold text-sm text-slate-900">
                    {selectedSample.title}
                  </h4>
                </div>
                <span className="text-xs font-mono text-slate-400 font-semibold">
                  {selectedSample.duration}
                </span>
              </div>

              {/* Mini Waveform preview */}
              <div className="py-3 flex items-center gap-1 justify-center">
                {[14, 22, 10, 30, 44, 28, 52, 20, 36, 16, 26, 18, 38, 24, 48, 16, 32].map(
                  (h, i) => (
                    <span
                      key={i}
                      style={{ height: `${h}px` }}
                      className="w-1 rounded-full bg-slate-300"
                    />
                  )
                )}
              </div>

              {/* Tabs: Transcript vs Detection Alerts */}
              <div className="flex items-center gap-4 text-xs font-semibold border-b border-slate-200/80 pb-2 text-slate-500">
                <button
                  onClick={() => setActiveSampleTab("transcript")}
                  className={`pb-1 transition-colors ${
                    activeSampleTab === "transcript"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "hover:text-slate-800"
                  }`}
                >
                  Transcript
                </button>
                <button
                  onClick={() => setActiveSampleTab("alerts")}
                  className={`pb-1 transition-colors ${
                    activeSampleTab === "alerts"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "hover:text-slate-800"
                  }`}
                >
                  Detection Alerts
                </button>
              </div>

              {/* Snippets / Tab content */}
              <div className="py-3 space-y-2 text-xs text-slate-700">
                {activeSampleTab === "transcript" ? (
                  selectedSample.transcriptLines.map((line, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                      <span className="font-mono text-slate-400 text-[10px] shrink-0 pt-0.5">
                        {line.time}
                      </span>
                      <span>
                        <strong>{line.speaker}:</strong> {line.text}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-1 space-y-2">
                    <p className="font-medium text-slate-800">Detection Analysis:</p>
                    <p className="text-slate-500 text-xs">{selectedSample.detectionSummary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Alert Pill / Warning */}
            {selectedSample.detectedKeywords.length > 0 ? (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span>
                  <strong>Keyword detected:</strong> {selectedSample.detectedKeywords.join(", ")}
                </span>
              </div>
            ) : (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Normal speech pattern. No financial or authority coercion.</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
