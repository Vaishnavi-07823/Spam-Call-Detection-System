import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({
    next: typeof s.next === "string" && s.next.startsWith("/") ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "TrueShield AI — Sign In & Create Account" },
      {
        name: "description",
        content: "Sign in to TrueShield AI for real-time scam call detection and fraud security.",
      },
    ],
  }),
  component: LoginPage,
});

export function LoginPage() {
  const { user, loading, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const { next } = Route.useSearch();

  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (next) {
        window.location.href = next;
      } else {
        navigate({ to: "/" });
      }
    }
  }, [user, loading, navigate, next]);

  const handleGoogleSignIn = async () => {
    const redirectUri = next
      ? `${window.location.origin}${next}`
      : window.location.origin;
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectUri,
    });
    if (result.error) {
      setAuthError(result.error.message || "Google sign in failed");
    }
  };

  const handleQuickDemoAccess = () => {
    setAuthError(null);
    setInfoMessage(null);
    signInAsGuest();
    navigate({ to: next || "/" });
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setAuthError("Please enter your email above to receive a fresh verification link.");
      return;
    }
    setResending(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setInfoMessage(`Fresh confirmation link sent to ${email}! Please check your inbox and spam folder.`);
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to resend confirmation email.");
    } finally {
      setResending(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setInfoMessage(null);
    setCanResend(false);

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setAuthError("Please fill in all required fields.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes("weak")) {
            throw new Error("Password is too simple. Please choose at least 8 characters with numbers or symbols.");
          }
          throw error;
        }

        // Check if user already exists
        if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
          setAuthError("An account with this email already exists. Please Sign In below with your existing password, or use Quick Demo Access.");
          setIsSignUp(false);
          return;
        }

        // If session was granted immediately (auto-confirm enabled in Supabase)
        if (data.session) {
          navigate({ to: next || "/" });
          return;
        }

        // If email confirmation is required by Supabase
        setInfoMessage(
          `Account registered! Supabase requires email verification. We have sent a confirmation link to ${cleanEmail}. Please check your inbox (or spam folder) and click the link to activate your account.`
        );
        setCanResend(true);
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("email not confirmed") || error.status === 400 && msg.includes("confirm")) {
            setCanResend(true);
            throw new Error(`Email not verified: Supabase requires you to click the confirmation link sent to ${cleanEmail} before signing in.`);
          }
          if (msg.includes("invalid login credentials")) {
            setCanResend(true);
            throw new Error(
              "Invalid login credentials. If you just registered, please verify that you clicked the confirmation link sent to your email inbox, or check your password."
            );
          }
          throw error;
        }

        navigate({ to: next || "/" });
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center py-10 px-4 sm:px-6 selection:bg-blue-600/30">
      <div className="w-full max-w-[440px] bg-white rounded-3xl border border-slate-200/90 shadow-xl p-7 sm:p-9 flex flex-col items-center text-center">
        {/* Brand Logo with Soundwave Icon */}
        <Link to="/" className="flex items-center gap-2.5 mb-5 group">
          <div className="flex items-center gap-0.5 h-6 px-1">
            <span className="w-1 h-3.5 bg-blue-500 rounded-full group-hover:h-5 transition-all" />
            <span className="w-1 h-5 bg-blue-400 rounded-full group-hover:h-3 transition-all" />
            <span className="w-1 h-6 bg-blue-500 rounded-full group-hover:h-6 transition-all" />
            <span className="w-1 h-4 bg-cyan-400 rounded-full group-hover:h-5 transition-all" />
            <span className="w-1 h-2.5 bg-blue-500 rounded-full group-hover:h-4 transition-all" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
              TrueShield<span className="text-blue-600"> AI</span>
            </span>
            <span className="text-[9px] text-slate-400 tracking-wider uppercase mt-0.5 font-medium">
              Real-Time Scam Call Detection
            </span>
          </div>
        </Link>

        {/* Title & Subtitle */}
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isSignUp ? "Create Account" : "Sign In"}
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          {isSignUp
            ? "Get started with TrueShield AI protection."
            : "Welcome back! Login to access live call defense."}
        </p>

        {/* 1-Click Quick Demo / Evaluator Banner */}
        <div className="w-full mb-5 p-3 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border border-blue-200 text-left flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-spin" />
              Viva / Evaluator Demo Access
            </span>
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-wider">
              No Email Verify Needed
            </span>
          </div>
          <p className="text-[11px] text-blue-700 leading-snug">
            Evaluating the project? Skip email verification and enter immediately with 1 click.
          </p>
          <button
            type="button"
            onClick={handleQuickDemoAccess}
            className="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>⚡ Enter as Evaluator / Demo User</span>
          </button>
        </div>

        {/* Info Banner (e.g. Email verification notice) */}
        {infoMessage && (
          <div className="w-full p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs mb-4 text-left flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium leading-relaxed">{infoMessage}</p>
            </div>
          </div>
        )}

        {/* Error Alert if any */}
        {authError && (
          <div className="w-full p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mb-4 text-left flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{authError}</p>
            </div>

            {canResend && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="self-start text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 mt-1 bg-white px-2.5 py-1 rounded-md border border-red-200 shadow-xs"
              >
                <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                <span>{resending ? "Sending link..." : "Resend Verification Link to Email"}</span>
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-3.5 text-left">
          {/* Full Name field (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Vaishnavi Trivedi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder={isSignUp ? "At least 8 chars" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Remember me & Forgot Password (Sign In only) */}
          {!isSignUp && (
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => alert("Password reset link sent to your registered email.")}
                className="text-blue-600 hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={authLoading}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all mt-2"
          >
            {authLoading
              ? "Please wait..."
              : isSignUp
              ? "Register Account"
              : "Sign In"}
          </Button>
        </form>

        {/* Divider OR */}
        {!isSignUp && (
          <>
            <div className="relative w-full my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                <span className="bg-white px-2">OR</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all hover:border-slate-300"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </>
        )}

        {/* Bottom Toggle Between Sign In & Sign Up */}
        <div className="mt-5 text-xs text-slate-500">
          {isSignUp ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setAuthError(null);
                  setInfoMessage(null);
                }}
                className="text-blue-600 font-bold hover:underline ml-0.5"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setAuthError(null);
                  setInfoMessage(null);
                }}
                className="text-blue-600 font-bold hover:underline ml-0.5"
              >
                Register
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
