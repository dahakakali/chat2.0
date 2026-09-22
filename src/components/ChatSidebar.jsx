"use client";

import { ROOMS, subscribeToPresence } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function ChatSidebar({ activeRoom, onRoomChange }) {
  const { user, logout } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let unsub;
    try { unsub = subscribeToPresence(setOnlineUsers); } catch {}
    return () => { if (unsub) unsub(); };
  }, []);

  const handleRoomClick = (roomId) => { onRoomChange(roomId); setMobileOpen(false); };

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle sidebar">
        <span className="toggle-icon">{mobileOpen ? "✕" : "☰"}</span>
      </button>
      <aside className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo"><span className="logo-icon">⚡</span><span className="logo-text">Chat 2.0</span></div>
        </div>
        <div className="sidebar__section">
          <h3 className="sidebar__section-title">Channels</h3>
          <ul className="room-list">
            {ROOMS.map((room) => (
              <li key={room.id}>
                <button className={`room-item ${activeRoom === room.id ? "room-item--active" : ""}`} onClick={() => handleRoomClick(room.id)}>
                  <span className="room-icon">{room.icon}</span>
                  <div className="room-info"><span className="room-name">{room.name}</span><span className="room-desc">{room.description}</span></div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="sidebar__section">
          <h3 className="sidebar__section-title">Online — {onlineUsers.length}</h3>
          <ul className="user-list">
            {onlineUsers.map((u) => (
              <li key={u.id} className="user-item">
                <div className="user-avatar-wrapper">
                  <div className="user-avatar-placeholder">{u.name?.charAt(0)}</div>
                  <span className="online-dot"></span>
                </div>
                <span className="user-name">{u.name}</span>
              </li>
            ))}
          </ul>
        </div>
        {user && (
          <div className="sidebar__footer">
            <div className="current-user">
              <div className="user-avatar-wrapper">
                <div className="user-avatar-placeholder">{user.name?.charAt(0)}</div>
                <span className="online-dot"></span>
              </div>
              <div className="current-user-info">
                <span className="current-user-name">{user.name}</span>
                <span className="current-user-email">{user.email}</span>
              </div>
              <Link href="/admin" className="admin-btn" title="Admin">🛡️</Link>
              <button className="logout-btn" onClick={logout} title="Sign out">↪</button>
            </div>
          </div>
        )}
      </aside>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
    </>
  );
}
