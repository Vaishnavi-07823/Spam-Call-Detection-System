/**
 * History Screen — Displays past scam detection results.
 * Fetches data from backend API.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, ShieldCheck, Shield, ArrowRight, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Static mock data for demonstration
const mockHistoryData = [
  {
    id: "1",
    riskScore: 92,
    explanation: "Multiple red flags detected: Request for OTP, urgency tactics, and impersonation of bank official",
    suggestion: "Immediately hang up and contact your bank directly using their official number",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    transcript: "Hello, this is from State Bank security department. We detected suspicious activity...",
    category: "Financial Fraud"
  },
  {
    id: "2",
    riskScore: 15,
    explanation: "Normal conversation pattern detected. No scam indicators found",
    suggestion: "This appears to be a legitimate call",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    transcript: "Hi, this is Sarah from the delivery service. Your package will arrive tomorrow...",
    category: "Safe"
  },
  {
    id: "3",
    riskScore: 78,
    explanation: "Tech support scam detected: Caller claims computer virus and requests remote access",
    suggestion: "Do not provide remote access. Legitimate companies do not make unsolicited tech support calls",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    transcript: "Your computer has been infected with a virus. We need to access your system immediately...",
    category: "Tech Support Scam"
  },
  {
    id: "4",
    riskScore: 88,
    explanation: "IRS/Tax scam identified: Threats of legal action and demands for immediate payment",
    suggestion: "The IRS never demands immediate payment over the phone. Report this to authorities",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    transcript: "This is the IRS. You owe back taxes and must pay within 24 hours or face arrest...",
    category: "Tax Scam"
  },
  {
    id: "5",
    riskScore: 35,
    explanation: "Possible telemarketing call but no scam indicators",
    suggestion: "Standard sales call. Use your discretion",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    transcript: "Hello, we are offering a special promotion on health insurance...",
    category: "Telemarketing"
  }
];


export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Forensic Incident Ledger — VoxShield AI" },
      { name: "description", content: "View past scam call detection and telemetry logs." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const navigate = useNavigate();
  const [items] = useState(mockHistoryData);
  const [filter, setFilter] = useState<"all" | "scams" | "safe">("all");

  const filteredItems = items.filter((item) => {
    if (filter === "scams") return item.riskScore >= 50;
    if (filter === "safe") return item.riskScore < 50;
    return true;
  });

  const scamCount = items.filter((i) => i.riskScore >= 50).length;
  const safeCount = items.length - scamCount;

  return (
    <div className="flex min-h-screen flex-col px-4 sm:px-6 pb-24 pt-6 max-w-5xl mx-auto w-full">
      {/* Header & Ledger Telemetry */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight">Forensic Incident Ledger</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-card border border-border/70 text-muted-foreground">
                {items.length} Records Logged
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cryptographic audit log of analyzed voice calls, extracted keywords and threat vectors
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-card/80 border border-border/60 shadow-sm">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              filter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter("scams")}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              filter === "scams"
                ? "bg-red-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Threats ({scamCount})
          </button>
          <button
            onClick={() => setFilter("safe")}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              filter === "safe"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Verified Safe ({safeCount})
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="mt-6 space-y-3">
        {filteredItems.map((item, i) => {
          const isScam = item.riskScore >= 50;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="border-border/50 bg-card/40 hover:bg-card/70 backdrop-blur-md transition-all p-4 shadow-sm hover:border-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        isScam
                          ? "bg-red-500/15 border-red-500/30 text-red-400"
                          : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      }`}
                    >
                      {isScam ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <ShieldCheck className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] font-bold text-muted-foreground/80">
                          #INC-2026-00{item.id}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            isScam
                              ? "bg-red-500/15 text-red-300 border-red-500/40"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                          }`}
                        >
                          {isScam ? "CRITICAL THREAT" : "SAFE VERIFIED"}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-card border border-border/70 text-muted-foreground">
                          {item.category}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-foreground leading-snug">
                        {item.explanation}
                      </p>

                      <div className="mt-2 p-2 rounded-lg bg-slate-950/40 border border-border/30 font-mono text-[11px] text-muted-foreground">
                        "{item.transcript}"
                      </div>

                      <span className="mt-2 block text-[10px] text-muted-foreground">
                        Timestamp: {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Score & View Alert Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40 gap-2">
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block text-left sm:text-right">
                        Threat Score
                      </span>
                      <span
                        className={`text-xl font-extrabold ${
                          isScam ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {item.riskScore}%
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-3 gap-1 border-border/60 hover:border-primary/40"
                      onClick={() =>
                        navigate({
                          to: isScam ? "/alert" : "/safe",
                          search: {
                            score: item.riskScore,
                            explanation: item.explanation,
                            suggestion: item.suggestion,
                          },
                        })
                      }
                    >
                      <span>Forensic File</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
