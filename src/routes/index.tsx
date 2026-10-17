import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mic,
  FileText,
  ShieldCheck,
  BarChart3,
  Lock,
  Play,
  Phone,
  PhoneOff,
  Volume2,
  Grid,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Radio,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrueShield AI — Real-Time Scam Call Detection" },
      {
        name: "description",
        content:
          "TrueShield AI monitors live calls in real-time, detects scam patterns, and automatically cuts suspicious calls to protect you from fraud.",
      },
    ],
  }),
  component: IndexPage,
});

export function IndexPage() {
  const [callTimer, setCallTimer] = useState(754); // 00:12:34 in seconds
  const [isPlayingDemo, setIsPlayingDemo] = useState(true);

  // Live call timer ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setCallTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600/30">
      {/* ================= HERO SECTION (DARK BLUE HIGH-TECH CANVAS) ================= */}
      <section className="relative w-full pt-8 pb-16 lg:pt-14 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#070D1F] via-[#0A1435] to-[#0D1B48]">
        {/* Ambient Glow Circles */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Column: Headlines & Call to Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6 flex flex-col items-start text-left"
          >
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Next-Gen Audio Interception & Fraud Defense</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Live Call Detection <br />
              <span className="text-blue-500">System</span>
            </h1>

            {/* Tagline */}
            <p className="mt-4 text-xl sm:text-2xl font-bold text-slate-200 tracking-wide">
              Detect. Transcribe. Analyze.
            </p>

            {/* Paragraph Description */}
            <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
              Our AI-powered system monitors live calls in real-time, detects
              suspicious activity, and converts conversations into text for better
              security and insights.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <Link to="/monitoring">
                <Button className="h-12 px-7 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Get Started
                </Button>
              </Link>

              <Link to="/monitoring">
                <Button
                  variant="outline"
                  className="h-12 px-6 rounded-xl border-slate-700 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold text-sm gap-2 backdrop-blur-md"
                >
                  <Play className="h-4 w-4 fill-current text-blue-400" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Trust highlights */}
            <div className="mt-10 pt-6 border-t border-slate-800/80 flex items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Zero Latency Circuit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                <span>Dual AI Pipeline</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>100% Private</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Phone Mockup & Floating Detection Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-6 relative flex justify-center items-center py-6"
          >
            {/* Ambient Behind-Phone Glow */}
            <div className="absolute w-72 h-72 sm:w-80 sm:h-80 bg-blue-500/20 rounded-full blur-2xl" />

            {/* Realistic Smartphone Chassis */}
            <div className="relative w-[280px] sm:w-[310px] h-[550px] sm:h-[590px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-[4px] border-slate-700/80 ring-1 ring-slate-800 flex flex-col justify-between overflow-hidden">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2" />
                <div className="w-2 h-2 rounded-full bg-blue-500/80 animate-ping" />
              </div>

              {/* Inside Screen Container */}
              <div className="w-full h-full bg-gradient-to-b from-[#091124] to-[#040814] rounded-[36px] p-5 pt-8 flex flex-col justify-between relative overflow-hidden border border-slate-800/60">
                {/* Screen Header */}
                <div className="flex flex-col items-center text-center mt-3">
                  <span className="text-xs font-semibold text-slate-300">Live Call</span>
                  <span className="text-[11px] font-mono text-slate-400 mt-0.5 tracking-wider">
                    {formatTimer(callTimer)}
                  </span>

                  {/* Caller Avatar */}
                  <div className="mt-5 w-16 h-16 rounded-full bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center shadow-inner">
                    <span className="text-2xl">👤</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-300">Caller (Bank Rep)</p>
                </div>

                {/* Animated Audio Waveform inside Phone */}
                <div className="my-auto py-4 flex items-center justify-center gap-1">
                  {[24, 40, 16, 52, 68, 36, 80, 48, 60, 28, 44, 20].map((height, i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 rounded-full bg-blue-400"
                      animate={{
                        height: isPlayingDemo
                          ? [
                              `${Math.max(12, height * 0.4)}px`,
                              `${height}px`,
                              `${Math.max(8, height * 0.2)}px`,
                            ]
                          : "12px",
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.2,
                        delay: i * 0.08,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>

                {/* In-Call Phone Control Pad */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <button className="h-11 rounded-full bg-slate-800/80 hover:bg-slate-700/80 flex items-center justify-center text-slate-300 transition-colors">
                    <Mic className="h-4 w-4" />
                  </button>
                  <button className="h-11 rounded-full bg-slate-800/80 hover:bg-slate-700/80 flex items-center justify-center text-slate-300 transition-colors">
                    <Grid className="h-4 w-4" />
                  </button>
                  <button className="h-11 rounded-full bg-slate-800/80 hover:bg-slate-700/80 flex items-center justify-center text-slate-300 transition-colors">
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>

                {/* End Call Button */}
                <Link to="/monitoring" className="w-full">
                  <button className="w-full h-11 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all font-semibold text-xs gap-2">
                    <PhoneOff className="h-4 w-4" />
                    <span>End Call & Inspect</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Floating Glassmorphic Detection Card (Overlapping like in reference) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute -right-2 sm:-right-8 top-1/3 max-w-[240px] sm:max-w-[270px] bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4 shadow-2xl text-left z-30"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Radio className="h-3 w-3 text-blue-400 animate-pulse" />
                  Voice Detection
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400">
                  Suspicious Word Detected
                </span>
              </div>

              {/* Mini Waveform in floating card */}
              <div className="h-8 flex items-center gap-0.5 my-2">
                {[12, 22, 16, 28, 32, 18, 26, 14, 20, 10, 24, 16].map((h, idx) => (
                  <span
                    key={idx}
                    style={{ height: `${h}px` }}
                    className="w-1 rounded-full bg-blue-400/80"
                  />
                ))}
              </div>

              {/* Chat bubbles preview */}
              <div className="space-y-1.5 text-[11px] mt-2">
                <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/50 text-slate-300 leading-snug">
                  "Hello, I wanted to discuss the project update..."
                </div>
                <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-200 leading-snug">
                  "Sure, let me share the details with you..."
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================= 5 FEATURE CARDS GRID (AS IN REFERENCE) ================= */}
      <section className="w-full bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center text-center transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mic className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Real-Time Monitoring</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Detect and analyze live calls as they happen.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center text-center transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Accurate Transcription</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Get clear and precise call transcripts instantly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center text-center transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Smart Detection</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Identify important calls, keywords and risks.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center text-center transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Detailed Reports</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Track, analyze and export call data with ease.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center text-center transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Secure & Private</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Your data is protected with advanced encryption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECONDARY NAVIGATION / QUICK ACTIONS ================= */}
      <section className="w-full bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white">Ready to inspect your calls?</h2>
            <p className="text-sm text-slate-400 mt-1">
              Start live call monitoring with dual-engine AI fraud analysis.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/monitoring">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 rounded-xl">
                Open Call Monitor
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="outline" className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl">
                View Past Calls
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
