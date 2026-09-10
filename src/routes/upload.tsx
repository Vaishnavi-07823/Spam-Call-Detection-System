/**
 * Upload Screen — Upload a call recording for scam analysis.
 * Supports audio file upload with drag-and-drop, displays transcript
 * and threat analysis results.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileAudio,
  Shield,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RiskScoreGauge } from "@/components/RiskScoreGauge";
import { analyzeAudioFile } from "@/services/audioAnalysis.functions";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Recording — TrueShield AI" },
      { name: "description", content: "Upload a call recording for AI-powered scam analysis." },
    ],
  }),
  component: UploadPage,
});

/** Max file size: 10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/webm", "audio/m4a", "audio/mp4", "audio/x-m4a"];

interface AnalysisResult {
  riskScore: number;
  category: string;
  explanation: string;
  suggestion: string;
  transcript: string;
  timestamp: string;
  fileName: string;
}

function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  /** Validate and set file */
  const handleFile = useCallback((f: File) => {
    setError(null);
    setResult(null);

    if (f.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }

    // Accept any audio type
    if (!f.type.startsWith("audio/")) {
      setError("Please upload an audio file (MP3, WAV, OGG, M4A, WebM).");
      return;
    }

    setFile(f);
  }, []);

  /** Drag handlers */
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragOver(false), []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  /** File input change */
  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  /** Convert file to base64 and analyze */
  const handleAnalyze = useCallback(async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setProgress(10);
    setStatusText("Reading audio file...");

    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          // Strip the data:audio/xxx;base64, prefix
          const base64Data = dataUrl.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      setProgress(30);
      setStatusText("Transcribing audio with AI...");

      // Send to server for transcription + analysis
      const analysisResult = await analyzeAudioFile({
        data: {
          audioBase64: base64,
          mimeType: file.type || "audio/mpeg",
          fileName: file.name,
        },
      });

      setProgress(100);
      setStatusText("Analysis complete!");
      setResult(analysisResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze audio"
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [file]);

  /** Reset state */
  const handleReset = useCallback(() => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setStatusText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center px-4 sm:px-6 pb-24 pt-6 max-w-5xl mx-auto w-full">
      {/* Top Header */}
      <motion.div
        className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-border/40"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <FileAudio className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight">Audio Forensic Studio</h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                Multimodal AI
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Multimodal call recording ingestion, speech spectrogram decoding & threat profiling
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2.5 py-1 rounded-full bg-card/80 border border-border/60">
            Engine: Gemini 1.5 Audio Pipeline
          </span>
        </div>
      </motion.div>

      {/* Results View or Upload Studio */}
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="result"
            className="mt-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Left Column: Forensic Verdict & Gauge (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <Card className="border-border/50 bg-card/50 backdrop-blur-md overflow-hidden shadow-lg p-6 flex flex-col items-center text-center">
                <RiskScoreGauge score={result.riskScore} />

                <div className="mt-4 flex items-center gap-2">
                  {result.riskScore > 50 ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span>{result.category || "CRITICAL SCAM CALL"}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>{result.category || "SAFE VERIFIED CALL"}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 w-full pt-4 border-t border-border/40 text-xs text-muted-foreground text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span>Target File:</span>
                    <span className="font-mono text-foreground">{result.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Analyzed On:</span>
                    <span className="font-mono text-foreground">{result.timestamp.replace("T", " ").slice(0, 19)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Forensic Status:</span>
                    <span className="font-semibold text-primary">Decoded & Indexed</span>
                  </div>
                </div>

                <div className="mt-6 flex w-full gap-3">
                  <Button variant="outline" className="flex-1 text-xs" onClick={handleReset}>
                    Upload Another
                  </Button>
                  <Button
                    className="flex-1 text-xs font-semibold"
                    onClick={() =>
                      navigate({
                        to: result.riskScore >= 50 ? "/alert" : "/safe",
                        search: {
                          score: result.riskScore,
                          explanation: result.explanation,
                          suggestion: result.suggestion,
                        },
                      })
                    }
                  >
                    Incident Dossier
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column: AI Analysis, Recommendation & Full Transcript (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Analysis Explanation */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-md p-5 shadow-lg">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  NEURAL THREAT ASSESSMENT
                </h3>
                <p className="text-sm leading-relaxed text-foreground font-medium">
                  {result.explanation}
                </p>
              </Card>

              {/* Recommendation */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-md p-5 shadow-lg">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  ACTIONABLE RECOMMENDATION
                </h3>
                <p className="text-sm leading-relaxed text-foreground">
                  {result.suggestion}
                </p>
              </Card>

              {/* Audio Transcript */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-md p-5 shadow-lg flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    DECODED AUDIO TRANSCRIPT
                  </h3>
                  <div className="max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-950/60 border border-border/40 font-mono text-xs leading-relaxed text-foreground">
                    {result.transcript || "[No speech detected in audio stream]"}
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            className="mt-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Left Column: Dropzone & Upload Controls (6 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <Card
                className={`cursor-pointer border-2 border-dashed transition-all p-6 backdrop-blur-md ${
                  isDragOver
                    ? "border-primary bg-primary/10 shadow-[0_0_25px_rgba(59,130,246,0.2)]"
                    : file
                      ? "border-primary/60 bg-primary/5 shadow-md"
                      : "border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/60"
                }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center text-center gap-4 py-8">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={onFileChange}
                    className="hidden"
                  />

                  {file ? (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <FileAudio className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || "Audio Format"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset();
                        }}
                      >
                        <X className="mr-1 h-3.5 w-3.5" /> Remove & Choose Another
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border/80 text-primary group-hover:scale-110 transition-transform">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-foreground">
                          {isDragOver ? "Drop audio recording to scan" : "Upload Call Audio File"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                          Drag and drop or tap to browse `.mp3`, `.wav`, `.m4a`, `.ogg` recordings up to 10MB
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-card border border-border/70 text-muted-foreground">
                          Lossless PCM
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-card border border-border/70 text-muted-foreground">
                          Compressed MP3/M4A
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Progress Bar when analyzing */}
              {isAnalyzing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="border-border/50 bg-card/60 backdrop-blur-md p-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{statusText}</span>
                      </div>
                      <span className="font-mono text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </Card>
                </motion.div>
              )}

              {/* Start Analyze Button */}
              {file && !isAnalyzing && (
                <Button
                  className="w-full gap-2 font-bold h-12 text-sm shadow-lg shadow-primary/20"
                  size="lg"
                  onClick={handleAnalyze}
                >
                  <Shield className="h-5 w-5" />
                  Run Forensic AI Analysis
                </Button>
              )}
            </div>

            {/* Right Column: Capabilities & Live Switcher (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <Card className="border-border/50 bg-card/40 backdrop-blur-md p-5 shadow-lg">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Forensic Pipeline Capabilities
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-card/60 border border-border/50">
                    <span className="font-bold text-foreground block mb-0.5">
                      1. Multimodal Audio Transcription
                    </span>
                    <p className="text-muted-foreground">
                      Converts conversational audio directly into text tokens, supporting both Hindi and English accents.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border/50">
                    <span className="font-bold text-foreground block mb-0.5">
                      2. Semantic Coercion Detection
                    </span>
                    <p className="text-muted-foreground">
                      Identifies psychological pressure, artificial deadlines, and deceptive banking authority claims.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border/50">
                    <span className="font-bold text-foreground block mb-0.5">
                      3. Actionable Incident Dossier
                    </span>
                    <p className="text-muted-foreground">
                      Generates immediate advisory steps and prepares draft evidence for Cyber Crime helpline (1930).
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border/40">
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-xs font-semibold h-10 border-primary/40 hover:bg-primary/10"
                    onClick={() => navigate({ to: "/monitoring" })}
                  >
                    <Mic className="h-4 w-4 text-primary" />
                    Switch to Live Ambient Interception
                  </Button>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <motion.p
          className="mt-4 max-w-lg text-center text-xs font-medium text-destructive bg-destructive/10 border border-destructive/30 p-3 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
