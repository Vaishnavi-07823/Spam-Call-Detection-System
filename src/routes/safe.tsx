/**
 * Safe Screen — Displayed when the call is determined to be safe.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ArrowLeft,
  PhoneIncoming,
  PhoneOutgoing,
  MapPin,
  FileDown,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RiskScoreGauge } from "@/components/RiskScoreGauge";
import { useLiveLocation } from "@/hooks/useLiveLocation";

interface SafeSearch {
  score: number;
  explanation: string;
  callerName?: string;
  callerNumber?: string;
  callerTitle?: string;
  targetName?: string;
  targetNumber?: string;
  location?: string;
}

export const Route = createFileRoute("/safe")({
  head: () => ({
    meta: [
      { title: "✓ Call Safe — TrueShield AI" },
      { name: "description", content: "This call has been verified as safe." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): SafeSearch => ({
    score: Number(search.score) || 6,
    explanation: String(search.explanation || "No suspicious urgency, credential requests, or extortion patterns detected."),
    callerName: search.callerName ? String(search.callerName) : "Verified Contact",
    callerNumber: search.callerNumber ? String(search.callerNumber) : "+91 98201 44520",
    callerTitle: search.callerTitle ? String(search.callerTitle) : "Routine Communication Line",
    targetName: search.targetName ? String(search.targetName) : "Vaishnavi Trivedi",
    targetNumber: search.targetNumber ? String(search.targetNumber) : "+91 98451 22910",
    location: search.location ? String(search.location) : "",
  }),
  component: SafePage,
});

function SafePage() {
  const {
    score,
    explanation,
    callerName,
    callerNumber,
    callerTitle,
    targetName,
    targetNumber,
    location,
  } = Route.useSearch();

  const liveLoc = useLiveLocation();
  const displayLocation =
    location && location.trim().length > 0
      ? location
      : `${liveLoc.locationString} • ${liveLoc.address}`;

  /** Download Printable Genuine Call Clearance Certificate */
  const handleDownloadCertificate = () => {
    const certWindow = window.open("", "_blank");
    if (!certWindow) return;

    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const certId = "CLR-" + Math.floor(100000 + Math.random() * 900000);
    const resolvedGps = `${liveLoc.latitude.toFixed(6)}° N, ${liveLoc.longitude.toFixed(6)}° E`;

    certWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>TrueShield AI - Telephony Clearance Certificate (${certId})</title>
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            padding: 36px; 
            color: #0f172a; 
            background: #ffffff;
            line-height: 1.5; 
            max-width: 800px;
            margin: 0 auto;
          }
          .header { 
            border-bottom: 3px solid #10b981; 
            padding-bottom: 20px; 
            margin-bottom: 24px; 
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .brand { font-size: 24px; font-weight: 800; color: #0f172a; }
          .badge { 
            display: inline-block; 
            padding: 6px 14px; 
            background: #ecfdf5; 
            color: #047857; 
            font-weight: 800; 
            border-radius: 8px; 
            font-size: 13px; 
            border: 1px solid #a7f3d0;
          }
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 13px; 
            margin: 20px 0; 
          }
          .table th, .table td { 
            padding: 10px 14px; 
            border: 1px solid #e2e8f0; 
            text-align: left; 
          }
          .table th { background: #f8fafc; font-weight: 700; width: 35%; color: #475569; }
          .footer { 
            margin-top: 36px; 
            font-size: 11px; 
            color: #64748b; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 14px; 
            display: flex;
            justify-content: space-between;
          }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">🛡️ TrueShield AI Telephony Protection</div>
            <div style="font-size: 13px; color: #64748b;">Official Telephony Call Clearance & Verification Certificate</div>
          </div>
          <div class="badge">CALL STATUS: VERIFIED GENUINE (${score}/100 RISK)</div>
        </div>

        <table class="table">
          <tr><th>Clearance Certificate ID</th><td><strong>${certId}</strong></td></tr>
          <tr><th>Timestamp (IST)</th><td>${timestamp}</td></tr>
          <tr>
            <th>Incoming Caller Details</th>
            <td><strong>${callerName}</strong> &bull; <span style="font-family: monospace;">${callerNumber}</span> (${callerTitle})</td>
          </tr>
          <tr>
            <th>Target Device / Subscriber</th>
            <td><strong>${targetName}</strong> &bull; <span style="font-family: monospace;">${targetNumber}</span></td>
          </tr>
          <tr>
            <th>Verified Incident GPS Locus</th>
            <td>${displayLocation || resolvedGps}</td>
          </tr>
          <tr>
            <th>Acoustic AI Assessment</th>
            <td style="color: #047857; font-weight: 600;">${explanation}</td>
          </tr>
        </table>

        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 14px; border-radius: 8px; font-size: 12px; color: #065f46;">
          ✓ This telephony session showed no indication of OTP fraud, financial coercion, impersonation, or cyber extortion. Safe to interact with this caller.
        </div>

        <div class="footer">
          <div>TrueShield Telephony Guard &bull; Certificate: ${certId}</div>
          <div>Autonomous Security Engine &copy; ${new Date().getFullYear()}</div>
        </div>

        <script>
          window.print();
        </script>
      </body>
      </html>
    `);
    certWindow.document.close();
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-4 sm:px-6 pb-24 pt-6 max-w-xl mx-auto">
      {/* Success icon */}
      <motion.div
        className="mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-success/15"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 text-success" />
      </motion.div>

      <motion.h1
        className="text-xl sm:text-2xl font-bold text-success text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Call Verified Safe & Genuine
      </motion.h1>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground text-center">
        No scam indicators, urgency coercion, or fraud patterns were found
      </p>

      {/* Risk Score */}
      <div className="my-5">
        <RiskScoreGauge score={score} />
      </div>

      {/* Telephony Metadata & Live Location Card */}
      <div className="w-full space-y-4">
        {/* Caller vs Target Telephony Details */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Verified Telephony Parties
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              Zero Coercion Detected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Incoming Caller Details */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <PhoneIncoming className="h-3 w-3 text-slate-400" />
                  Incoming Caller
                </span>
                <p className="text-sm font-bold text-white mt-1">{callerName}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5 font-bold">{callerNumber}</p>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 font-medium">{callerTitle}</p>
            </div>

            {/* Outgoing / Recipient Details */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <PhoneOutgoing className="h-3 w-3 text-blue-400" />
                  Target Device User
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
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Live Device GPS Locus
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

        {/* Analysis Details */}
        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-4">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-success">
              Acoustic Guard Analysis
            </h3>
            <p className="text-sm leading-relaxed">{explanation}</p>
          </CardContent>
        </Card>

        {/* Download Certificate */}
        <Button
          onClick={handleDownloadCertificate}
          className="w-full text-xs h-10 font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
        >
          <FileDown className="h-4 w-4" />
          Download Call Clearance Certificate
        </Button>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
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
