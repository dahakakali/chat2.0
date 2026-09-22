"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { setUserOnline, setUserOffline, verifyPin } from "@/lib/firebase";
import { requestNotificationPermission } from "@/lib/notifications";
import ChatSidebar from "@/components/ChatSidebar";
import ChatArea from "@/components/ChatArea";
import MessageInput from "@/components/MessageInput";
import PinInput from "@/components/PinInput";

export default function Home() {
  const { user, loading, locked, unlock, logout } = useAuth();
  const router = useRouter();
  const [activeRoom, setActiveRoom] = useState("general");
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user && !locked) {
      requestNotificationPermission();
      try { setUserOnline(user); } catch {}
      const h = () => { try { setUserOffline(user); } catch {} };
      window.addEventListener("beforeunload", h);
      return () => { window.removeEventListener("beforeunload", h); try { setUserOffline(user); } catch {} };
    }
  }, [user, locked]);

  const handleUnlock = async () => {
    if (pinValue.length !== 6) { setPinError("Enter your 6-digit PIN"); return; }
    setUnlocking(true); setPinError("");
    try {
      const valid = await verifyPin(user.email, pinValue);
      if (valid) { unlock(); setPinValue(""); }
      else { setPinError("Incorrect PIN."); setPinValue(""); }
    } catch { setPinError("Error verifying PIN."); }
    finally { setUnlocking(false); }
  };

  if (loading) return <div className="app-loading"><div className="loading-spinner loading-spinner--large"></div><p>Loading Chat 2.0...</p></div>;
  if (!user) return <div className="app-loading"><p>Redirecting to login...</p></div>;

  if (locked) {
    return (
      <div className="login-page">
        <div className="login-bg"><div className="login-bg__orb login-bg__orb--1"></div><div className="login-bg__orb login-bg__orb--2"></div><div className="login-bg__orb login-bg__orb--3"></div></div>
        <div className="login-card">
          <div className="login-card__header">
            <div className="lock-avatar"><span>{user.name?.charAt(0)?.toUpperCase()}</span></div>
            <h1 className="login-title">Session Locked</h1>
            <p className="login-subtitle">Welcome back, <strong>{user.name}</strong>. Enter your PIN.</p>
          </div>
          <div className="login-card__body">
            <PinInput value={pinValue} onChange={setPinValue} />
            {pinError && <p className="form-error">{pinError}</p>}
            <button className="btn btn--primary btn--full" onClick={handleUnlock} disabled={unlocking || pinValue.length !== 6}>{unlocking ? "Verifying..." : "🔓 Unlock"}</button>
            <button className="btn btn--ghost btn--full" onClick={logout}>Switch Account</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <ChatSidebar activeRoom={activeRoom} onRoomChange={setActiveRoom} />
      <main className="main-content">
        <ChatArea roomId={activeRoom} currentUser={user} />
        <MessageInput roomId={activeRoom} currentUser={user} />
      </main>
    </div>
  );
}
