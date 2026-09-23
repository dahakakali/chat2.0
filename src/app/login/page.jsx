"use client";

import { useAuth } from "@/lib/auth-context";
import { loginUser } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PinInput from "@/components/PinInput";
import Link from "next/link";

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) router.push("/"); }, [user, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Enter your email"); return; }
    if (pin.length !== 6) { setError("Enter your 6-digit PIN"); return; }
    setBusy(true); setError("");
    try {
      const userData = await loginUser(email.trim().toLowerCase(), pin);
      login(userData);
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally { setBusy(false); }
  };

  const handleInputFocus = (e) => {
    const el = e.currentTarget;
    requestAnimationFrame(() => {
      setTimeout(() => {
        try { el?.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch {}
      }, 150);
    });
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg__orb login-bg__orb--1"></div>
        <div className="login-bg__orb login-bg__orb--2"></div>
        <div className="login-bg__orb login-bg__orb--3"></div>
      </div>
      <div className="login-card">
        <div className="login-card__header">
          <div className="login-logo"><span className="login-logo__icon">⚡</span></div>
          <h1 className="login-title">Chat 2.0</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>
        <form className="login-card__body" onSubmit={handleLogin} noValidate>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" autoComplete="email" inputMode="email" placeholder="you@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={handleInputFocus} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">6-Digit PIN</label>
            <PinInput value={pin} onChange={setPin} />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn--primary btn--full" type="submit" disabled={busy} onPointerDown={(e) => e.preventDefault()}>
            {busy ? "Signing in..." : "🔑 Sign In"}
          </button>
          <p className="form-footer">Don&apos;t have an account? <Link href="/register" className="form-link">Register</Link></p>
        </form>
      </div>
    </div>
  );
}
