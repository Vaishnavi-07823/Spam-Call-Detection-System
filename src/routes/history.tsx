import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  AlertTriangle,
  Clock,
  Radio,
  Search,
  Bell,
  ArrowRight,
  TrendingUp,
  FileText,
  Shield,
  Users,
  Settings,
  LayoutDashboard,
  CheckCircle2,
  ChevronDown,
  PhoneCall,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "VoiceGuard Dashboard — Analytics & Detection Activity" },
      { name: "description", content: "Overview of your live calls and detection activity." },
    ],
  }),
  component: DashboardPage,
});

// Mock Call Activity Data (Last 7 Days)
const callActivityData = [
  { date: "Apr 21", calls: 24 },
  { date: "Apr 22", calls: 18 },
  { date: "Apr 23", calls: 42 },
  { date: "Apr 24", calls: 28 },
  { date: "Apr 25", calls: 56 },
  { date: "Apr 26", calls: 34 },
  { date: "Apr 27", calls: 48 },
];

// Recent Detections
const recentDetections = [
  {
    id: 1,
    title: "Suspicious Keyword (OTP Extortion)",
    time: "2 min ago",
    level: "High" as const,
    caller: "+91 98765 43210 (Rajesh Sharma)",
    reason: "Requested 6-digit OTP under KYC freeze threat",
    score: 98,
  },
  {
    id: 2,
    title: "Extended Call Duration & Threat",
    time: "12 min ago",
    level: "Medium" as const,
    caller: "+91 11-2309-8801 (Cyber Police)",
    reason: "Digital arrest extortion claim for customs parcel",
    score: 85,
  },
  {
    id: 3,
    title: "Unusual Pattern (Urgent Payment)",
    time: "25 min ago",
    level: "Medium" as const,
    caller: "+91 98102 33491 (Bijli Vibhag)",
    reason: "Power cut threat tonight if Rs 15 not sent to WhatsApp",
    score: 72,
  },
  {
    id: 4,
    title: "High Priority Call Verified",
    time: "42 min ago",
    level: "Low" as const,
    caller: "+91 98201 44520 (Pooja Verma)",
    reason: "Normal conversation pattern. Zero scam indicators.",
    score: 6,
  },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("Last 7 days");

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row -m-4 sm:-m-6 selection:bg-blue-600/30">
      {/* ================= LEFT SIDEBAR (DARK NAVY LIKE REFERENCE) ================= */}
      <aside className="w-full lg:w-64 bg-[#070D1F] text-slate-300 border-r border-slate-800 flex flex-col justify-between shrink-0 p-5">
        <div>
          {/* Sidebar Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 pb-6 border-b border-slate-800/80 group">
            <div className="flex items-center gap-0.5 h-6 px-1">
              <span className="w-1 h-3.5 bg-blue-500 rounded-full group-hover:h-5 transition-all" />
              <span className="w-1 h-5 bg-blue-400 rounded-full group-hover:h-3 transition-all" />
              <span className="w-1 h-6 bg-blue-500 rounded-full group-hover:h-6 transition-all" />
              <span className="w-1 h-4 bg-cyan-400 rounded-full group-hover:h-5 transition-all" />
              <span className="w-1 h-2.5 bg-blue-500 rounded-full group-hover:h-4 transition-all" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white leading-none">
                Voice<span className="text-blue-500">Guard</span>
              </span>
              <span className="text-[9px] text-slate-400 tracking-wider uppercase mt-0.5 font-medium">
                Live Call Detection System
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="mt-6 flex flex-col gap-1.5 text-xs font-semibold">
            {/* Active Dashboard Link */}
            <Link
              to="/history"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30 transition-all font-bold"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/monitoring"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Live Calls</span>
            </Link>

            <Link
              to="/upload"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Transcripts</span>
            </Link>

            <Link
              to="/history"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span>Detections</span>
            </Link>

            <Link
              to="/learn"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Activity className="h-4 w-4" />
              <span>Reports</span>
            </Link>

            <Link
              to="/monitoring"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>Contacts</span>
            </Link>

            <Link
              to="/settings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer User Widget */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
            V
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate">Vaishnavi Trivedi</span>
            <span className="text-[10px] text-slate-400">Admin</span>
          </div>
        </div>
      </aside>

      {/* ================= RIGHT MAIN DASHBOARD CONTENT ================= */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen overflow-x-hidden">
        {/* Top Header Row with Search & Notification */}
        <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-6">
          {/* Search Input Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search calls, keywords, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-sm"
            />
          </div>

          {/* Right Bell & Profile */}
          <div className="flex items-center justify-end gap-3">
            <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100 flex items-center justify-center transition-colors shadow-sm relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              V
            </div>
          </div>
        </header>

        {/* Dashboard Title & Subtitle */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Overview of your live calls and detection activity
          </p>
        </div>

        {/* ================= 4 METRIC STAT CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Stat 1: Total Calls */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-start justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Total Calls</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">248</h3>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +12% vs last 7 days
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5" />
            </div>
          </div>

          {/* Stat 2: Detections Found */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-start justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Detections Found</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">36</h3>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +8% vs last 7 days
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>

          {/* Stat 3: Avg Call Duration */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-start justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Avg. Call Duration</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">08m 24s</h3>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +5% vs last 7 days
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          {/* Stat 4: Active Calls */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-start justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Active Calls</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">2</h3>
              <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Live now
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* ================= MIDDLE ROW: CALL ACTIVITY CHART (7 COLS) + RECENT DETECTIONS (5 COLS) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Call Activity Line Graph */}
          <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900">Call Activity</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50 font-medium cursor-pointer">
                <span>{timeRange}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Recharts Area/Line Chart */}
            <div className="w-full h-64 sm:h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={callActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="callGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    ticks={[0, 20, 40, 60, 80]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "none",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#callGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Recent Detections List */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900">Recent Detections</h3>
              <Link to="/monitoring" className="text-xs text-blue-600 hover:underline font-semibold">
                View All
              </Link>
            </div>

            {/* Detection Items */}
            <div className="flex flex-col gap-3">
              {recentDetections.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    navigate({
                      to: item.score > 50 ? "/alert" : "/safe",
                      search: {
                        score: item.score,
                        explanation: item.reason,
                        suggestion: "Incident audit review.",
                      },
                    })
                  }
                  className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-100/70 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        item.level === "High"
                          ? "bg-red-100 text-red-600"
                          : item.level === "Medium"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.time} · {item.caller}
                      </span>
                    </div>
                  </div>

                  {/* Level Pill */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                      item.level === "High"
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : item.level === "Medium"
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : "bg-blue-50 text-blue-600 border border-blue-200"
                    }`}
                  >
                    {item.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
