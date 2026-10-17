import { useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  PhoneOff,
  ArrowLeft,
  PhoneIncoming,
  PhoneOutgoing,
  MapPin,
  ShieldAlert,
  FileDown,
  Copy,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RiskScoreGauge } from "@/components/RiskScoreGauge";
import { useLiveLocation } from "@/hooks/useLiveLocation";

interface AlertSearch {
  score: number;
  explanation: string;
  suggestion: string;
  callerName?: string;
  callerNumber?: string;
  callerTitle?: string;
  targetName?: string;
  targetNumber?: string;
  location?: string;
  callType?: string;
}

export const Route = createFileRoute("/alert")({
  head: () => ({
    meta: [
      { title: "⚠️ Scam Alert — TrueShield AI" },
      { name: "description", content: "A potential scam call has been detected." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): AlertSearch => ({
    score: Number(search.score) || 85,
    explanation: String(search.explanation || "Suspicious patterns and extortion keywords detected in the call."),
    suggestion: String(search.suggestion || "Call disconnected by TrueShield Circuit Breaker. Block number immediately."),
    callerName: search.callerName ? String(search.callerName) : "Rajesh Sharma (State Bank of India Impersonation)",
    callerNumber: search.callerNumber ? String(search.callerNumber) : "+91 98765 43210",
    callerTitle: search.callerTitle ? String(search.callerTitle) : "Fraudulent Inbound Voice Caller",
    targetName: search.targetName ? String(search.targetName) : "Vaishnavi Trivedi",
    targetNumber: search.targetNumber ? String(search.targetNumber) : "+91 98451 22910",
    location: search.location ? String(search.location) : "",
    callType: search.callType ? String(search.callType) : "Incoming Cellular Voice Call",
  }),
  component: AlertPage,
});

function AlertPage() {
  const {
    score,
    explanation,
    suggestion,
    callerName,
    callerNumber,
    callerTitle,
    targetName,
    targetNumber,
    location,
    callType,
  } = Route.useSearch();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const liveLoc = useLiveLocation();

  // Combine query location or live device GPS
  const displayLocation =
    location && location.trim().length > 0
      ? location
      : `${liveLoc.locationString} • ${liveLoc.address}`;

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

  /** Generate and download printable official forensic incident report */
  const handleDownloadReport = () => {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return;

    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const incidentId = "CR-" + Math.floor(100000 + Math.random() * 900000);
    const resolvedGps = `${liveLoc.latitude.toFixed(6)}° N, ${liveLoc.longitude.toFixed(6)}° E`;

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>TrueShield AI - Cyber Incident Forensic Report (${incidentId})</title>
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            padding: 36px; 
            color: #0f172a; 
            background: #ffffff;
            line-height: 1.5; 
            max-width: 900px;
            margin: 0 auto;
          }
          .header { 
            border-bottom: 3px solid #dc2626; 
            padding-bottom: 20px; 
            margin-bottom: 24px; 
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .brand { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
          .subbrand { font-size: 13px; color: #64748b; font-weight: 500; }
          .badge { 
            display: inline-block; 
            padding: 6px 14px; 
            background: #fee2e2; 
            color: #991b1b; 
            font-weight: 800; 
            border-radius: 8px; 
            font-size: 13px; 
            letter-spacing: 0.5px;
            border: 1px solid #fecaca;
          }
          .grid-2 { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 16px; 
            margin: 20px 0; 
          }
          .card { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 10px; 
            padding: 16px; 
          }
          .card h4 { 
            margin: 0 0 6px 0; 
            color: #64748b; 
            font-size: 11px; 
            text-transform: uppercase; 
            letter-spacing: 0.5px;
          }
          .card p { margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; }
          .card .highlight-red { color: #dc2626; }
          .card .highlight-blue { color: #2563eb; }
          
          .section { 
            margin: 24px 0; 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
            padding: 18px; 
            background: #ffffff;
          }
          .section-title { 
            font-size: 14px; 
            font-weight: 800; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            color: #1e293b;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 8px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .telephony-table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 13px; 
            margin-top: 8px;
          }
          .telephony-table th, .telephony-table td { 
            padding: 10px 12px; 
            border: 1px solid #e2e8f0; 
            text-align: left; 
          }
          .telephony-table th { 
            background: #f1f5f9; 
            font-weight: 700; 
            color: #334155; 
            width: 32%;
          }
          .telephony-table td { font-weight: 500; }
          .tag-scam { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; }
          .tag-victim { background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; }

          .geo-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 16px;
            margin: 20px 0;
          }
          .geo-box h4 {
            margin: 0 0 6px 0;
            color: #166534;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .geo-coords {
            font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace;
            font-size: 15px;
            font-weight: 800;
            color: #14532d;
          }
          .geo-meta {
            font-size: 12px;
            color: #15803d;
            margin-top: 4px;
          }

          .analysis-text {
            background: #fff1f2;
            border-left: 4px solid #e11d48;
            padding: 12px 16px;
            font-size: 14px;
            color: #881337;
            font-weight: 500;
            border-radius: 0 8px 8px 0;
          }

          .footer { 
            margin-top: 36px; 
            font-size: 11px; 
            color: #64748b; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 14px; 
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          @media print { 
            body { padding: 15px; }
            button { display: none; } 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">🛡️ TrueShield AI Telephony Protection</div>
            <div class="subbrand">Certified Forensic Cyber Incident & Telephony Intercept Report</div>
          </div>
          <div class="badge">THREAT SCORE: ${score}/100 [HIGH RISK FRAUD]</div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h4>Forensic Incident Reference ID</h4>
            <p>${incidentId}</p>
          </div>
          <div class="card">
            <h4>Incident Timestamp (IST)</h4>
            <p>${timestamp}</p>
          </div>
          <div class="card">
            <h4>Defense Intercept Status</h4>
            <p class="highlight-red">FORCE-TERMINATED (Circuit Breaker)</p>
          </div>
          <div class="card">
            <h4>National Helpline Referral</h4>
            <p class="highlight-blue">1930 / cybercrime.gov.in</p>
          </div>
        </div>

        <!-- SECTION 1: INCOMING & OUTGOING CALL TELEMETRY -->
        <div class="section">
          <div class="section-title">
            <span>1. Telephony Carrier Metadata & Party Identification</span>
            <span style="font-size: 11px; color: #64748b;">Carrier Inbound Intercept</span>
          </div>

          <table class="telephony-table">
            <tr>
              <th colspan="2" style="background: #fee2e2; color: #991b1b; font-size: 12px; text-transform: uppercase;">
                📞 Incoming Call (Flagged Suspect / Extortionist)
              </th>
            </tr>
            <tr>
              <th>Caller Display Name</th>
              <td><strong>${callerName || "Rajesh Sharma (SBI Impersonator)"}</strong></td>
            </tr>
            <tr>
              <th>Incoming Phone Number</th>
              <td><span style="font-family: monospace; font-size: 14px; font-weight: 700; color: #dc2626;">${callerNumber || "+91 98765 43210"}</span> <span class="tag-scam">SUSPECT FRAUDULENT CALLER</span></td>
            </tr>
            <tr>
              <th>Impersonated Entity</th>
              <td>${callerTitle || "SBI Banking Service Desk / Extortion Syndicate"}</td>
            </tr>
            <tr>
              <th>Channel & Carrier Route</th>
              <td>${callType || "VoLTE Cellular Audio Stream"}</td>
            </tr>

            <tr>
              <th colspan="2" style="background: #dbeafe; color: #1e40af; font-size: 12px; text-transform: uppercase; margin-top: 10px;">
                📱 Outgoing / Receiving Target Device (Protected User)
              </th>
            </tr>
            <tr>
              <th>Target Subscriber Name</th>
              <td><strong>${targetName || "Vaishnavi Trivedi (Account Holder)"}</strong></td>
            </tr>
            <tr>
              <th>Target Mobile Number</th>
              <td><span style="font-family: monospace; font-size: 14px; font-weight: 700; color: #2563eb;">${targetNumber || "+91 98451 22910"}</span> <span class="tag-victim">VERIFIED SUBSCRIBER</span></td>
            </tr>
            <tr>
              <th>Device Defense Status</th>
              <td>Active AI Acoustic Shield (Protected & Line Severed at 120ms)</td>
            </tr>
          </table>
        </div>

        <!-- SECTION 2: LIVE DEVICE INCIDENT GEOLOCATION -->
        <div class="geo-box">
          <h4>📍 2. Incident GPS Geolocation & Subscriber Locus</h4>
          <div class="geo-coords">${displayLocation || resolvedGps}</div>
          <div class="geo-meta">
            • <strong>GPS Latitude / Longitude:</strong> ${resolvedGps} (Precision: ±${liveLoc.accuracy}m)<br/>
            • <strong>Location Area:</strong> ${liveLoc.address}<br/>
            • <strong>Jurisdiction / Authority:</strong> Indian Cyber Crime Reporting Center (MHA)
          </div>
        </div>

        <!-- SECTION 3: AI SPEECH FORENSICS -->
        <div class="section">
          <div class="section-title">
            <span>3. AI Acoustic Analysis & Extortion Evidence</span>
            <span style="font-size: 11px; color: #dc2626;">Dual-Engine Verified</span>
          </div>
          <div class="analysis-text">
            <strong>Threat Evidence:</strong> ${explanation}
          </div>
          <p style="margin-top: 12px; font-size: 13px; color: #334155;">
            <strong>Immediate Legal Remediation:</strong> ${suggestion}
          </div>
        </div>

        <!-- SECTION 4: INSTRUCTIONS FOR POLICE & CYBER CELL -->
        <div class="section">
          <div class="section-title">
            <span>4. Official Evidence Submission Instructions</span>
          </div>
          <p style="font-size: 12px; color: #475569; margin: 0;">
            This automated forensic brief is certified by the TrueShield Dual-Engine Acoustic Defense Architecture. Present this document when registering a financial cyber fraud complaint at <strong>cybercrime.gov.in</strong> or dispatching an urgent freeze via the <strong>1930</strong> National Cyber Crime Hotline.
          </p>
        </div>

        <div class="footer">
          <div>TrueShield AI Telephony Protection System &bull; Case File: ${incidentId}</div>
          <div>Certified Autonomous Security Engine &copy; ${new Date().getFullYear()}</div>
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
    const draft = `[OFFICIAL CYBER CRIME COMPLAINT DRAFT]
Incident Date: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
Incident Location: ${displayLocation}

--- SUSPECT CALLER DETAILS (INCOMING) ---
Caller Name: ${callerName || "Rajesh Sharma (Impersonator)"}
Caller Phone Number: ${callerNumber || "+91 98765 43210"}
Organization Claimed: ${callerTitle || "Bank / Police Authority"}

--- TARGET VICTIM DETAILS (RECEIVER) ---
Target Name: ${targetName || "Vaishnavi Trivedi"}
Target Phone Number: ${targetNumber || "+91 98451 22910"}

--- THREAT ANALYSIS & EVIDENCE ---
Threat Score: ${score}/100 (HIGH RISK SCAM)
Evidence: ${explanation}
Action Taken: Call force-terminated by TrueShield AI Circuit Breaker.
Requesting immediate investigation under Section 66D IT Act and 1930 Cyber Fraud Helpline.`;

    navigator.clipboard.writeText(draft);
    alert("Official Complaint draft copied to clipboard with full caller, recipient, and GPS location!");
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-4 sm:px-6 pb-24 pt-6 max-w-2xl mx-auto">
      {/* Pulsing warning icon */}
      <motion.div
        className="mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-danger/15"
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
        <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-danger" />
      </motion.div>

      <motion.h1
        className="text-xl sm:text-2xl font-black text-danger tracking-tight text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🚨 Scam Call Intercepted & Cut!
      </motion.h1>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground text-center max-w-md">
        Call was automatically terminated by TrueShield Circuit Breaker to prevent financial extortion
      </p>

      {/* Risk Score */}
      <div className="my-5">
        <RiskScoreGauge score={score} />
      </div>

      {/* Telephony Metadata & Live Location Card */}
      <div className="w-full space-y-4">
        {/* Caller vs Target Telephony Details */}
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-red-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              Telephony Call Intercept
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
              Line Severed &lt;120ms
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Incoming Caller Details */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <PhoneIncoming className="h-3 w-3 text-red-400" />
                  Incoming Suspect
                </span>
                <p className="text-sm font-bold text-white mt-1">{callerName}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5 font-bold">{callerNumber}</p>
              </div>
              <p className="text-[11px] text-red-300 mt-2 font-medium">{callerTitle}</p>
            </div>

            {/* Outgoing / Recipient Details */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <PhoneOutgoing className="h-3 w-3 text-blue-400" />
                  Target Subscriber
                </span>
                <p className="text-sm font-bold text-white mt-1">{targetName}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5 font-bold">{targetNumber}</p>
              </div>
              <p className="text-[11px] text-emerald-400 mt-2 font-medium">✓ Protected by TrueShield</p>
            </div>
          </div>

          {/* Live Incident Location Bar */}
          <div className="mt-3 rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Incident GPS Geolocation
                </span>
                <p className="text-xs font-semibold text-white truncate">
                  {displayLocation}
                </p>
              </div>
            </div>
            <button
              onClick={() => liveLoc.refreshLocation()}
              title="Refresh GPS Coordinates"
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 shrink-0 flex items-center gap-1"
            >
              <Navigation className="h-3 w-3" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* AI Threat Analysis & Evidence */}
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
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-danger flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />
                AI Acoustic Threat Analysis
              </h3>
              <p className="text-sm leading-relaxed text-slate-200">{explanation}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Immediate Action Required */}
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-start gap-3 p-4">
            <PhoneOff className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Immediate Action Required
              </h3>
              <p className="text-sm leading-relaxed">{suggestion}</p>
            </div>
          </CardContent>
        </Card>

        {/* Cyber Crime 1930 & Download Report Actions */}
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            🛡️ Official Incident Response & Evidence
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            <a href="tel:1930" className="w-full">
              <Button variant="destructive" className="w-full text-xs h-10 font-bold gap-1.5 shadow-md shadow-red-600/30">
                📞 Call 1930 Helpline
              </Button>
            </a>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Button variant="outline" className="w-full text-xs h-10 font-semibold gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                cybercrime.gov.in
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Button
              className="w-full text-xs h-10 font-bold gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30"
              onClick={handleDownloadReport}
            >
              <FileDown className="h-4 w-4" />
              Download PDF Report
            </Button>
            <Button
              variant="secondary"
              className="w-full text-xs h-10 font-semibold gap-1.5 border border-slate-700"
              onClick={handleCopyDraft}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Complaint Draft
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <Link to="/monitoring" className="flex-1">
            <Button variant="outline" className="w-full gap-2 h-10">
              <ArrowLeft className="h-4 w-4" />
              New Scan
            </Button>
          </Link>
          <Link to="/" className="flex-1">
            <Button className="w-full h-10">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
