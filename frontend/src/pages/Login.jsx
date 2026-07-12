import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "../services/api";

export default function Login({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("admin@ecosphere.ai");
  const [password, setPassword] = useState("adminpass");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await authService.login(email, password);
        onAuthSuccess();
        navigate("/");
      } else {
        if (!fullName.trim()) {
          throw new Error("Full name is required");
        }
        await authService.register(email, password, fullName);
        // Automatically login after successful registration
        await authService.login(email, password);
        onAuthSuccess();
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-height-screen min-h-screen bg-black flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background Radial Glow */}
      <div className="absolute top-[-40%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.06)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />

      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 z-10"
      >
        <h1 className="text-4xl font-extrabold flex items-center justify-center gap-3 bg-gradient-to-r from-secondaryCyan to-primaryGreen bg-clip-text text-transparent">
          <i className="fa fa-globe text-secondaryCyan"></i> EcoSphere AI
        </h1>
        <p className="text-textMuted text-sm mt-2">
          Intelligent ESG Management Platform &amp; Sustainability twin
        </p>
      </motion.div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-cardBg border border-white/8 backdrop-blur-xl rounded-2xl p-8 shadow-card z-10 hover:border-secondaryCyan/20 transition-all duration-300 relative group"
      >
        {/* Glow Border Decoration */}
        <div className="absolute inset-0 rounded-2xl border border-secondaryCyan/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500 shadow-glow" />

        <div className="flex justify-around mb-8 border-b border-white/8 pb-4">
          <button
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
            className={`font-semibold pb-2 transition-all ${
              isLogin
                ? "text-secondaryCyan border-b-2 border-secondaryCyan"
                : "text-textMuted hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
            className={`font-semibold pb-2 transition-all ${
              !isLogin
                ? "text-secondaryCyan border-b-2 border-secondaryCyan"
                : "text-textMuted hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-dangerRed/10 border border-dangerRed/25 rounded-lg text-dangerRed text-xs text-center font-medium"
          >
            <i className="fa fa-exclamation-triangle mr-2"></i> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <i className="fa fa-user absolute left-3 top-3.5 text-textMuted" />
                  <input
                    type="text"
                    required={!isLogin}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter name"
                    className="w-full bg-black/40 border border-white/8 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-secondaryCyan/40 text-sm transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <i className="fa fa-envelope absolute left-3 top-3.5 text-textMuted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full bg-black/40 border border-white/8 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-secondaryCyan/40 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <i className="fa fa-lock absolute left-3 top-3.5 text-textMuted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-black/40 border border-white/8 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-secondaryCyan/40 text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-accent to-primaryGreen hover:opacity-90 transition-all text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
            style={{
              background: "linear-gradient(135deg, #2E7D32 0%, #00C853 100%)",
            }}
          >
            {loading ? (
              <i className="fa fa-circle-o-notch animate-spin"></i>
            ) : (
              <i className="fa fa-sign-in"></i>
            )}
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        {isLogin && (
          <div className="mt-6 text-center bg-white/2 border border-white/4 rounded-xl p-3">
            <span className="text-[11px] text-textMuted block font-medium uppercase tracking-wider mb-1">
              🔑 Hackathon Demo Access
            </span>
            <span className="text-xs text-textSecondary block">
              Email: <strong className="text-white font-semibold">admin@ecosphere.ai</strong>
            </span>
            <span className="text-xs text-textSecondary block">
              Password: <strong className="text-white font-semibold">adminpass</strong>
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
