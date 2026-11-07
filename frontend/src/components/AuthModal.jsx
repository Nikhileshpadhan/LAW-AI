import React, { useState, useEffect } from "react";
import { X, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { LegalApiService } from "../services/api";

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  onAuthSuccess,
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot' | 'verify'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
      setLoading(false);
      setMode("login");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetState = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const switchMode = (m) => {
    resetState();
    setMode(m);
  };

  const handleGoogleLogin = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
    window.location.href = `${apiBase}/auth/google/login`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetState();
    setLoading(true);

    try {
      if (mode === "login") {
        const data = await LegalApiService.login(email, password);
        setSuccessMsg("Counsel authenticated successfully.");
        setTimeout(() => {
          onAuthSuccess?.(data.user);
          onClose();
        }, 500);
      } else if (mode === "register") {
        const data = await LegalApiService.register(email, fullName, password);
        setSuccessMsg("Chamber account registered. Welcome Counsel.");
        setTimeout(() => {
          onAuthSuccess?.(data.user);
          onClose();
        }, 500);
      } else if (mode === "forgot") {
        await LegalApiService.forgotPassword(email);
        setSuccessMsg("If an account exists for this address, password reset instructions have been dispatched.");
      } else if (mode === "verify") {
        await LegalApiService.verifyEmail(verifyToken);
        setSuccessMsg("Email verified successfully! You may now sign in.");
        setMode("login");
      }
    } catch (err) {
      const detail = err.response?.data?.detail || "An unexpected error occurred. Please try again.";
      setErrorMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Brand Header */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-white rounded-[2px]" />
            <span className="font-serif text-sm font-semibold text-white">
              Law AI Chamber
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-white font-normal pt-1">
            {mode === "login" && "Counsel Authentication"}
            {mode === "register" && "Create Chamber Account"}
            {mode === "forgot" && "Recover Credentials"}
            {mode === "verify" && "Verify Email Address"}
          </h2>
          <p className="text-xs text-zinc-400 font-light">
            {mode === "login" && "Access saved consultations and authentic Supreme Court precedent briefs."}
            {mode === "register" && "Join senior advocates utilizing precision Supreme Court RAG intelligence."}
            {mode === "forgot" && "Enter your registered email to receive secure recovery instructions."}
            {mode === "verify" && "Enter the verification token sent to your email address."}
          </p>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google SSO Button (Login / Register) */}
        {(mode === "login" || mode === "register") && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-11 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-lg flex items-center justify-center gap-3 transition-colors duration-150 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-zinc-500 font-mono">or counsel email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-medium text-zinc-400">Full Name</label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adv. Rajesh Sharma"
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>
          )}

          {mode !== "verify" && (
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-medium text-zinc-400">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="counsel@barcouncil.in"
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>
          )}

          {(mode === "login" || mode === "register") && (
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-400">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>
          )}

          {mode === "verify" && (
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-medium text-zinc-400">Verification Token</label>
              <input
                type="text"
                required
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="Paste token from verification email"
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors font-mono"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === "login" && "Enter Chamber"}
                  {mode === "register" && "Create Credentials"}
                  {mode === "forgot" && "Send Reset Link"}
                  {mode === "verify" && "Verify Email"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Modal Footer Nav */}
        <div className="pt-2 border-t border-white/10 text-center text-xs text-zinc-400">
          {mode === "login" && (
            <span>
              New counsel?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="text-white hover:underline cursor-pointer font-medium"
              >
                Register for chamber access
              </button>
            </span>
          )}

          {mode === "register" && (
            <span>
              Already registered?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-white hover:underline cursor-pointer font-medium"
              >
                Sign in to chamber
              </button>
            </span>
          )}

          {(mode === "forgot" || mode === "verify") && (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Return to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
