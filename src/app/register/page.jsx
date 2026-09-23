"use client";

import { useAuth } from "@/lib/auth-context";
import { registerUser } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PinInput from "@/components/PinInput";
import Link from "next/link";

export default function RegisterPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) router.push("/"); }, [user, router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("Enter your name"); return; }
    if (!email.trim()) { setError("Enter your email"); return; }
    if (pin.length !== 6) { setError("Create a 6-digit PIN"); return; }
    if (pin !== confirmPin) { setError("PINs don't match"); return; }
    setBusy(true); setError("");
    try {
      const userData = await registerUser(name.trim(), email.trim().toLowerCase(), pin);
      login(userData);
    } catch (err) {
      setError(err.message || "Registration failed.");
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
          <h1 className="login-title">Create Account</h1>
          <p className="login-subtitle">Join Chat 2.0 in seconds</p>
        </div>
        <form className="login-card__body" onSubmit={handleRegister} noValidate>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" name="fullName" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} onFocus={handleInputFocus} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" autoComplete="email" inputMode="email" placeholder="you@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={handleInputFocus} />
          </div>
          <div className="form-group">
            <label className="form-label">Create 6-Digit PIN</label>
            <PinInput value={pin} onChange={setPin} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm PIN</label>
            <PinInput value={confirmPin} onChange={setConfirmPin} />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn--primary btn--full" type="submit" disabled={busy} onPointerDown={(e) => e.preventDefault()}>
            {busy ? "Creating account..." : "🚀 Create Account"}
          </button>
          <p className="form-footer">Already have an account? <Link href="/login" className="form-link">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
