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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { analyzeTranscript } from "@/services/apiService";
import { analyzeWithRules } from "@/services/riskAnalyzer";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Live Monitoring Studio — VoiceGuard AI" },
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
      { time: "00:00", text: "Hey! Are you free this weekend for the exhibition?" },
      { time: "00:04", text: "Yeah, mostly free on Saturday afternoon. Where is it?" },
      { time: "00:09", text: "At the BKC convention center. Let me send you the passes." },
      { time: "00:15", text: "Great, see you then! Take care." },
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
      { time: "00:00", text: "Hello, I am calling from SBI fraud prevention department." },
      { time: "00:05", text: "Your debit card was used for an unauthorized Rs 45,000 transfer." },
      { time: "00:11", text: "To reverse this payment, open WhatsApp and share the 6-digit OTP right now." },
      { time: "00:18", text: "If you don't share within 2 minutes, the money cannot be refunded." },
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
      { time: "00:00", text: "Hello, I wanted to discuss the project update before the sprint demo." },
      { time: "00:05", text: "Sure, let me share the details with you regarding the backend API." },
      { time: "00:10", text: "I'll get back to you by the end of the day with the documentation." },
      { time: "00:16", text: "Actually, there is some change in the plan for deployment." },
      { time: "04:22", text: "We need to be careful about database indexing before launch." },
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
      { time: "00:00", text: "This is Inspector Vijay Kumar from Delhi Cyber Crime Cell." },
      { time: "00:04", text: "An illegal parcel containing banned substances is registered under your Aadhaar." },
      { time: "00:12", text: "You are placed under digital arrest right now. Do not disconnect this call." },
      { time: "00:20", text: "Transfer Rs 50,000 to the court clearance account immediately to avoid FIR." },
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
    injectTranscript,
  } = useSpeechRecognition(selectedLang);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Active Tab inside Player (Live Transcript vs Detection Alerts)
  const [activePlayerTab, setActivePlayerTab] = useState<"transcript" | "alerts">("transcript");
  const [activeSampleTab, setActiveSampleTab] = useState<"transcript" | "alerts">("transcript");

  // Selected sample call state
  const [selectedSample, setSelectedSample] = useState(SAMPLE_CALLS[1]); // Default to Suspicious Call
  const [isSamplePlaying, setIsSamplePlaying] = useState(false);
  const [samplePlaybackIndex, setSamplePlaybackIndex] = useState(0);

  // Live in-call timer & active simulated state
  const [callDuration, setCallDuration] = useState(754); // 00:12:34
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Call simulator modal states (preserved from previous version)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorMode, setSimulatorMode] = useState<"bot" | "user_scammer">("bot");
  const [branchChoice, setBranchChoice] = useState<"pending" | "suspicious" | "genuine">("pending");
  const branchChoiceRef = useRef<"pending" | "suspicious" | "genuine">("pending");
  const [callState, setCallState] = useState<"ringing" | "connected" | "interrupted" | "ended">("ringing");
  const [activeTurnIndex, setActiveTurnIndex] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<
    { speaker: "Scammer" | "You"; speakerName: string; text: string; risk: number; status: string }[]
  >([]);
  const ringtoneCtxRef = useRef<AudioContext | null>(null);
  const simulatorTimerRef = useRef<any>(null);
  const autoCutTimerRef = useRef<any>(null);

  // Browser voices caching
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) setAvailableVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Rule-based live risk evaluation
  const liveRisk = useMemo(() => {
    const activeText = transcript.trim() || selectedSample.transcriptLines.map((l) => l.text).join(" ");
    return analyzeWithRules(activeText);
  }, [transcript, selectedSample]);

  // Main analyze handler
  const handleAnalyze = useCallback(
    async (customText?: string, sessionId?: string, resetSession?: boolean) => {
      const textToAnalyze = (customText || transcript || selectedSample.transcriptLines.map((l) => l.text).join(" ")).trim();
      if (!textToAnalyze) return;

      setIsAnalyzing(true);
      setApiError(null);
      stopListening();

      try {
        const result = await analyzeTranscript(textToAnalyze, sessionId, resetSession);
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
        setApiError(err instanceof Error ? err.message : "Failed to analyze transcript");
        setIsAnalyzing(false);
      }
    },
    [transcript, selectedSample, stopListening, navigate]
  );

  // Play sample call audio simulation step-by-step
  const handlePlaySample = (sample: typeof SAMPLE_CALLS[0]) => {
    setSelectedSample(sample);
    setIsSamplePlaying(true);
    setSamplePlaybackIndex(0);

    // Speak first line using browser speech synthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sample.transcriptLines[0].text);
      utterance.lang = "en-IN";
      utterance.onend = () => {
        setIsSamplePlaying(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim().length > 3) {
        handleAnalyze();
      }
    } else {
      resetTranscript();
      startListening();
    }
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
            <span className="text-xs sm:text-sm font-mono text-slate-400 ml-1">
              {formatTimer(callDuration)}
            </span>
          </div>

          {/* Right Tabs: Live Transcript vs Detection Alerts */}
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
              {liveRisk && liveRisk.ruleScore >= 50 && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              )}
            </button>
          </div>
        </div>

        {/* Main Player Grid: Left (Caller & Waveform & Controls) | Right (Live Transcript Feed) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch">
          {/* Left Column (7 cols): Caller Info, Large Waveform, Call Controls */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6 pr-0 lg:pr-4">
            {/* Caller Identity Card */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center shrink-0 shadow-inner">
                <span className="text-2xl">👤</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {selectedSample.callerName}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 font-mono mt-0.5">
                  {selectedSample.callerNumber}
                </p>
                <span className="text-[10px] text-blue-400 font-medium mt-1 flex items-center gap-1">
                  <Radio className="h-3 w-3 animate-pulse" />
                  Dual-Engine Interception Active
                </span>
              </div>
            </div>

            {/* Glowing Center Waveform (Wide & Dynamic) */}
            <div className="w-full h-24 sm:h-28 bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 flex items-center justify-center gap-1.5 overflow-hidden">
              {[20, 44, 28, 64, 80, 52, 95, 36, 72, 48, 88, 32, 60, 40, 76, 24, 68, 50, 84, 30, 48, 22].map(
                (h, idx) => (
                  <motion.span
                    key={idx}
                    className="w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-blue-600 to-cyan-400"
                    animate={{
                      height: isListening || isSamplePlaying
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

            {/* In-Call Controls Row (Mute, Keypad, Speaker, Red End Call) */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Mute Button */}
                <button
                  onClick={handleMicToggle}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                  title={isListening ? "Stop Microphone" : "Start Live Microphone"}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                {/* Keypad Button */}
                <button
                  onClick={() => setIsSimulatorOpen(true)}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                  title="Open Phone Simulation"
                >
                  <Grid className="h-5 w-5" />
                </button>

                {/* Speaker Toggle Button */}
                <button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors ${
                    isSpeakerOn
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "bg-slate-800 text-slate-500"
                  }`}
                  title="Toggle Audio Speaker"
                >
                  <Volume2 className="h-5 w-5" />
                </button>
              </div>

              {/* Red End Call & Analyze Button */}
              <button
                onClick={() => handleAnalyze()}
                disabled={isAnalyzing}
                className="h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-600/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <PhoneOff className="h-4 w-4" />
                    <span>End Call</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column (5 cols): Live Transcript / Alert Log Box */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/70 rounded-xl border border-slate-800 p-4 min-h-[300px]">
            {activePlayerTab === "transcript" ? (
              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[260px] pr-1">
                {/* Transcript Dialogues */}
                {selectedSample.transcriptLines.map((line, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="font-mono text-slate-500 shrink-0 text-[11px] pt-0.5">
                      {line.time}
                    </span>
                    <p className="leading-snug">
                      {line.text}
                    </p>
                  </div>
                ))}

                {/* Ambient Real-Time Speech Stream if Mic Active */}
                {transcript && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-start gap-2.5 text-xs text-blue-300">
                    <span className="font-mono text-blue-400 shrink-0 text-[11px] pt-0.5">Live</span>
                    <p className="leading-snug">{transcript}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Detection Alerts Tab */
              <div className="flex flex-col gap-3 py-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Risk Assessment
                  </span>
                  <p className="text-sm font-semibold text-white">
                    Risk Score:{" "}
                    <span
                      className={
                        selectedSample.riskScore > 70
                          ? "text-red-400 font-bold"
                          : selectedSample.riskScore > 30
                          ? "text-amber-400 font-bold"
                          : "text-emerald-400 font-bold"
                      }
                    >
                      {selectedSample.riskScore} / 100
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{selectedSample.detectionSummary}</p>
                </div>

                {selectedSample.detectedKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSample.detectedKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-mono"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Alert Banner matching the Reference Image */}
            <div
              className={`mt-4 rounded-xl p-3 border flex items-start gap-3 transition-colors ${
                selectedSample.riskScore > 50
                  ? "bg-red-500/15 border-red-500/40 text-red-200"
                  : "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
              }`}
            >
              <div className="mt-0.5">
                {selectedSample.riskScore > 50 ? (
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
              </div>
              <div className="flex-1 text-xs">
                <p className="font-bold text-white">
                  {selectedSample.riskScore > 50
                    ? "Suspicious Keyword Detected"
                    : "Call Status: Normal & Safe"}
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {selectedSample.riskScore > 50
                    ? `Keyword: ${selectedSample.detectedKeywords[0] || "OTP"} | Confidence: ${selectedSample.riskScore}%`
                    : "No high-risk vectors detected. Verified dialogue pattern."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. SAMPLE CALL SUITE (WHITE CARD LAYOUT AS IN REFERENCE) ================= */}
      <section className="w-full rounded-2xl bg-white text-slate-900 border border-slate-200/90 p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold tracking-tight text-slate-900">Sample Call</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Try our system with a sample call to see how it works.
          </p>
        </div>

        {/* 2-Column Suite Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (6 cols): List of 4 Pre-Loaded Scenarios */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            {SAMPLE_CALLS.map((sample) => {
              const isSelected = selectedSample.id === sample.id;
              return (
                <div
                  key={sample.id}
                  onClick={() => setSelectedSample(sample)}
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
                        handlePlaySample(sample);
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

                  {/* Badge */}
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
              {/* Card Header */}
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
                      <span>{line.text}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-1 space-y-2">
                    <p className="font-medium text-slate-800">
                      Detection Analysis:
                    </p>
                    <p className="text-slate-500 text-xs">
                      {selectedSample.detectionSummary}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Alert Pill / Warning */}
            {selectedSample.detectedKeywords.length > 0 ? (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span>
                  <strong>Keyword detected:</strong>{" "}
                  {selectedSample.detectedKeywords.join(", ")}
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

      {/* ================= 3. QUICK ACTIONS & FULL SIMULATOR LAUNCH ================= */}
      <section className="w-full flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Interactive 2-Branch Phone Simulator</h4>
            <p className="text-xs text-slate-400">
              Test realistic incoming caller dialogues with turn-by-turn Indian voices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              // Open simulator
              setIsSimulatorOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 h-9 rounded-lg"
          >
            Launch Phone Screen
          </Button>
        </div>
      </section>
    </div>
  );
}
