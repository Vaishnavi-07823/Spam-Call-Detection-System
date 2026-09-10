import { useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle, PhoneOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RiskScoreGauge } from "@/components/RiskScoreGauge";

interface AlertSearch {
  score: number;
  explanation: string;
  suggestion: string;
}

export const Route = createFileRoute("/alert")({
  head: () => ({
    meta: [
      { title: "⚠️ Scam Alert — VoxShield AI" },
      { name: "description", content: "A potential scam call has been detected." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): AlertSearch => ({
    score: Number(search.score) || 85,
    explanation: String(search.explanation || "Suspicious patterns detected in the call."),
    suggestion: String(search.suggestion || "End the call immediately and block the number."),
  }),
  component: AlertPage,
});

function AlertPage() {
  const { score, explanation, suggestion } = Route.useSearch();
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (score < 50) return;

    // Haptic device vibration on mobile devices
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([400, 200, 400, 200, 600]);
    }

    let isPlaying = true;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    const playTone = () => {
      if (!isPlaying || ctx.state === "closed") return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(850, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);

      setTimeout(playTone, 550);
    };

    playTone();

    return () => {
      isPlaying = false;
      if (ctx.state !== "closed") {
        ctx.close().catch(() => {});
      }
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(0);
      }
    };
  }, [score]);

  /** Generate and download printable official incident forensic report */
  const handleDownloadReport = () => {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return;

    const timestamp = new Date().toLocaleString();
    const incidentId = "VX-" + Math.floor(100000 + Math.random() * 900000);

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>VoxShield AI - Cyber Incident Forensic Report (${incidentId})</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { border-bottom: 2px solid #dc2626; padding-bottom: 16px; margin-bottom: 24px; }
          .badge { display: inline-block; padding: 4px 12px; background: #fee2e2; color: #b91c1c; font-weight: bold; border-radius: 9999px; font-size: 14px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
          .box h4 { margin: 0 0 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; }
          .box p { margin: 0; font-size: 15px; font-weight: 600; }
          .section { margin: 24px 0; }
          .section h3 { border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; color: #0f172a; }
          .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>🛡️ VoxShield AI — Cyber Incident Forensic Report</h2>
          <div class="badge">THREAT CLASSIFICATION: HIGH RISK FRAUD (${score}/100)</div>
        </div>

        <div class="grid">
          <div class="box">
            <h4>Incident Tracking ID</h4>
            <p>${incidentId}</p>
          </div>
          <div class="box">
            <h4>Timestamp</h4>
            <p>${timestamp}</p>
          </div>
          <div class="box">
            <h4>Platform Assessment</h4>
            <p style="color: #dc2626;">Fraudulent Call Attempt</p>
          </div>
          <div class="box">
            <h4>National Helpline Referral</h4>
            <p>1930 (National Cyber Crime Portal)</p>
          </div>
        </div>

        <div class="section">
          <h3>1. AI Threat Analysis & Evidence</h3>
          <p>${explanation}</p>
        </div>

        <div class="section">
          <h3>2. Immediate Remediation Advice</h3>
          <p>${suggestion}</p>
        </div>

        <div class="section">
          <h3>3. Official Reporting Instructions</h3>
          <p>This automated forensic brief is certified by VoxShield Dual-Engine Telephony Protection. Present this report when registering a grievance on <strong>cybercrime.gov.in</strong> or calling the <strong>1930</strong> financial fraud hotline.</p>
        </div>

        <div class="footer">
          Generated automatically by VoxShield AI Telephony Security Framework &copy; ${new Date().getFullYear()}
        </div>
        <script>
          window.print();
        </script>
      </body>
      </html>
    `);
    reportWindow.document.close();
  };

  /** Copy complaint text to clipboard */
  const handleCopyDraft = () => {
    const draft = `[Cyber Crime Complaint Draft]\nIncident Date: ${new Date().toLocaleString()}\nThreat: High Risk Phone Scam (${score}% Threat Score)\nAnalysis: ${explanation}\nAction Taken: Call terminated. Reference filed via VoxShield AI.\nPlease investigate this fraudulent caller under the National Cyber Crime Reporting Portal (1930).`;
    navigator.clipboard.writeText(draft);
    alert("Official Complaint draft copied to clipboard!");
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-6 pb-24 pt-8">
      {/* Pulsing warning icon */}
      <motion.div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger/15"
        animate={{
          scale: [1, 1.15, 1],
          boxShadow: [
            "0 0 0 0 oklch(0.58 0.22 25 / 0.4)",
            "0 0 0 24px oklch(0.58 0.22 25 / 0)",
            "0 0 0 0 oklch(0.58 0.22 25 / 0)",
          ],
        }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        <AlertTriangle className="h-10 w-10 text-danger" />
      </motion.div>

      <motion.h1
        className="text-2xl font-bold text-danger tracking-tight"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🚨 Scam Call Detected!
      </motion.h1>
      <p className="mt-1 text-sm text-muted-foreground text-center">
        Dangerous impersonation or credential theft detected in real time
      </p>

      {/* Risk Score */}
      <div className="my-7">
        <RiskScoreGauge score={score} />
      </div>

      {/* Details */}
      <div className="w-full max-w-sm space-y-4">
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 1px oklch(0.58 0.22 25 / 0.4)",
              "0 0 16px 2px oklch(0.58 0.22 25 / 0.35)",
              "0 0 0 1px oklch(0.58 0.22 25 / 0.4)",
            ],
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-xl overflow-hidden"
        >
          <Card className="border-danger/40 bg-danger/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-danger">
                AI Analysis & Evidence
              </h3>
              <p className="text-sm leading-relaxed">{explanation}</p>
            </CardContent>
          </Card>
        </motion.div>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-start gap-3 p-4">
            <PhoneOff className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Immediate Action Required
              </h3>
              <p className="text-sm leading-relaxed">{suggestion}</p>
            </div>
          </CardContent>
        </Card>

        {/* Cyber Crime 1930 Reporting Actions */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
            🛡️ Official Incident Response
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <a href="tel:1930" className="w-full">
              <Button variant="destructive" className="w-full text-xs h-9 font-semibold">
                📞 Call 1930 Helpline
              </Button>
            </a>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Button variant="outline" className="w-full text-xs h-9">
                🌐 cybercrime.gov.in
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="secondary"
              className="w-full text-xs h-9 font-medium"
              onClick={handleDownloadReport}
            >
              📄 Download PDF Report
            </Button>
            <Button
              variant="secondary"
              className="w-full text-xs h-9 font-medium"
              onClick={handleCopyDraft}
            >
              📋 Copy Complaint
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-1">
          <Link to="/monitoring" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              New Scan
            </Button>
          </Link>
          <Link to="/" className="flex-1">
            <Button className="w-full">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
