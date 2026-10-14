/**
 * Settings Screen — App preferences and information.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Bell,
  Shield,
  Volume2,
  Smartphone,
  Info,
  ExternalLink,
  Cpu,
  Zap,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthSection } from "@/components/AuthSection";
import { checkEngineStatus } from "@/services/apiService";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TrueShield AI" },
      { name: "description", content: "Configure your TrueShield AI preferences." },
    ],
  }),
  component: SettingsPage,
});

interface ToggleSettingProps {
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

/** A single toggleable setting row */
function ToggleSetting({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
}: ToggleSettingProps) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <button
          onClick={onToggle}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </CardContent>
    </Card>
  );
}

function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoMonitor, setAutoMonitor] = useState(false);
  const [vibration, setVibration] = useState(true);
  const [engineStatus, setEngineStatus] = useState<{
    hybridEnabled: boolean;
    aiActive: boolean;
    engineName: string;
    tier1: string;
    tier2: string;
  } | null>(null);

  useEffect(() => {
    checkEngineStatus()
      .then(setEngineStatus)
      .catch(() => setEngineStatus(null));
  }, []);

  return (
    <div className="flex min-h-screen flex-col px-4 sm:px-6 pb-24 pt-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3 pb-4 border-b border-border/40">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">System Preferences</h1>
          <p className="text-xs text-muted-foreground">Configure defense thresholds, neural alerts & telemetry options</p>
        </div>
      </div>

      {/* Account */}
      <div className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AuthSection />
        </motion.div>
      </div>

      {/* Notification Settings */}
      <div className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notifications
        </h2>
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <ToggleSetting
              icon={Bell}
              title="Push Notifications"
              description="Get notified when a scam is detected"
              enabled={notifications}
              onToggle={() => setNotifications(!notifications)}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ToggleSetting
              icon={Volume2}
              title="Sound Alerts"
              description="Play a sound for high-risk detections"
              enabled={soundAlerts}
              onToggle={() => setSoundAlerts(!soundAlerts)}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <ToggleSetting
              icon={Smartphone}
              title="Vibration"
              description="Vibrate on scam detection alerts"
              enabled={vibration}
              onToggle={() => setVibration(!vibration)}
            />
          </motion.div>
        </div>
      </div>

      {/* Monitoring Settings */}
      <div className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Monitoring
        </h2>
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ToggleSetting
              icon={Shield}
              title="Auto-Monitor Calls"
              description="Automatically start monitoring incoming calls"
              enabled={autoMonitor}
              onToggle={() => setAutoMonitor(!autoMonitor)}
            />
          </motion.div>
        </div>
      </div>

      {/* AI Engine Status */}
      <div className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI Engine
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <Card className="border-primary/30 bg-primary/5 overflow-hidden">
            <CardContent className="p-0">
              {/* Header Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-primary/15 bg-primary/10">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Detection Engine</span>
                </div>
                {engineStatus ? (
                  <Badge
                    className={
                      engineStatus.aiActive
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px]"
                    }
                  >
                    {engineStatus.aiActive ? "✓ Hybrid Active" : "⚠ Rules Only"}
                  </Badge>
                ) : (
                  <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-[10px]">
                    Loading…
                  </Badge>
                )}
              </div>

              {/* Engine name */}
              <div className="px-4 py-3 border-b border-primary/10">
                <p className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">Active Configuration</p>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  {engineStatus?.engineName ?? "Loading engine info…"}
                </p>
              </div>

              {/* Tier 1 */}
              <div className="px-4 py-3 border-b border-primary/10 flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 mt-0.5">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Tier 1 — Edge Circuit Breaker</p>
                  <p className="text-xs text-foreground">{engineStatus?.tier1 ?? "Regex & Keyword Rule Engine"}</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">Always ON · &lt;5ms · 100% offline</p>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="px-4 py-3 flex items-start gap-3">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5 ${engineStatus?.aiActive ? "bg-primary/15" : "bg-amber-500/10"}`}>
                  {engineStatus?.aiActive
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    : <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Tier 2 — Cloud AI Context Analysis</p>
                  <p className="text-xs text-foreground">{engineStatus?.tier2 ?? "Google Gemini 1.5 Flash"}</p>
                  {engineStatus?.aiActive ? (
                    <p className="text-[10px] text-primary mt-0.5">Active · Full conversation arc scoring</p>
                  ) : (
                    <div className="mt-2 rounded-md bg-amber-500/10 border border-amber-500/25 p-2.5">
                      <p className="text-[10px] text-amber-300 font-medium mb-1">🔑 Add GEMINI_API_KEY to activate</p>
                      <p className="text-[10px] text-muted-foreground">
                        1. Go to{" "}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          aistudio.google.com
                        </a>{" "}
                        → Get API key (free)
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        2. Add <code className="bg-slate-800 px-1 rounded">GEMINI_API_KEY=your_key</code> in your <code className="bg-slate-800 px-1 rounded">.env</code> file
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        3. Also add it to Vercel Dashboard → Settings → Environment Variables
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* About */}
      <div>

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          About
        </h2>
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Info className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">TrueShield AI</h3>
                    <p className="text-xs text-muted-foreground">
                      Version 1.0.0
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  TrueShield AI uses advanced artificial intelligence to detect
                  scam calls in real time, protecting you from fraud and social
                  engineering attacks.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <a
                  href="https://docs.lovable.dev/features/ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Powered by Lovable AI
                </a>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
