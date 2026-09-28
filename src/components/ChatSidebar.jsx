"use client";

import { ROOMS, subscribeToPresence, subscribeToUnreadCount } from "@/lib/firebase";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function ChatSidebar({ activeRoom, onRoomChange }) {
  const { user, logout } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    let unsub;
    try { unsub = subscribeToPresence(setOnlineUsers); } catch {}
    return () => { if (unsub) unsub(); };
  }, []);

  // Track unread messages
  useEffect(() => {
    if (!user) return;
    try {
      const stored = localStorage.getItem(`lastRead_${user.email}`);
      const lastReadTimestamps = stored ? JSON.parse(stored) : {};
      
      const unsubs = [];
      const trackRoom = (roomId) => {
        const lastRead = lastReadTimestamps[roomId] || Date.now();
        unsubs.push(subscribeToUnreadCount(roomId, lastRead, user.email, (count) => {
          setUnreadCounts(prev => ({ ...prev, [roomId]: count }));
        }));
      };

      ROOMS.forEach(r => trackRoom(r.id));
      onlineUsers.forEach(u => {
        if (u.email === user.email) return;
        const sorted = [user.email, u.email].sort();
        trackRoom(`dm_${sorted[0]}_${sorted[1]}`);
      });

      return () => unsubs.forEach(u => u());
    } catch (err) {
      console.error(err);
    }
  }, [user, onlineUsers]);

  // Mark room as read when visited and update it right as we leave
  useEffect(() => {
    if (activeRoom && user) {
      try {
        const updateReadStatus = () => {
          const stored = localStorage.getItem(`lastRead_${user.email}`);
          const lastReadTimestamps = stored ? JSON.parse(stored) : {};
          lastReadTimestamps[activeRoom] = Date.now();
          localStorage.setItem(`lastRead_${user.email}`, JSON.stringify(lastReadTimestamps));
        };
        
        updateReadStatus(); // Do it on entry
        setUnreadCounts(prev => ({ ...prev, [activeRoom]: 0 }));
        
        return () => updateReadStatus(); // Do it again exactly when we leave the room
      } catch {}
    }
  }, [activeRoom, user]);

  const handleRoomClick = (roomId) => { onRoomChange(roomId); setMobileOpen(false); };
  
  const handleUserClick = (targetUser) => {
    if (targetUser.email === user?.email) return;
    const sortedEmails = [user.email, targetUser.email].sort();
    const dmRoomId = `dm_${sortedEmails[0]}_${sortedEmails[1]}`;
    onRoomChange(dmRoomId);
    setMobileOpen(false);
  };

  const totalUnread = Object.entries(unreadCounts).reduce((total, [roomId, count]) => {
    return total + (roomId === activeRoom ? 0 : count);
  }, 0);

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle sidebar" style={{position: 'relative'}}>
        <span className="toggle-icon">{mobileOpen ? "✕" : "☰"}</span>
        {!mobileOpen && totalUnread > 0 && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            background: '#ff4d4d',
            color: 'white',
            borderRadius: '10px',
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
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
                  <div className="room-info" style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <span className="room-name">{room.name}</span>
                      <span className="room-desc">{room.description}</span>
                    </div>
                    {unreadCounts[room.id] > 0 && activeRoom !== room.id && (
                      <span style={{background: '#ff4d4d', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold'}}>{unreadCounts[room.id]}</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="sidebar__section">
          <h3 className="sidebar__section-title">Online — {onlineUsers.length}</h3>
          <ul className="user-list">
            {onlineUsers.map((u) => {
              const sorted = user ? [user.email, u.email].sort() : [];
              const dmRoomId = user ? `dm_${sorted[0]}_${sorted[1]}` : "";
              const unread = unreadCounts[dmRoomId] || 0;
              return (
                <li key={u.id} className="user-item">
                  <button 
                    className={`room-item ${activeRoom?.includes(u.email) ? "room-item--active" : ""}`} 
                    onClick={() => handleUserClick(u)} 
                    style={{background: 'transparent', padding: '5px 10px', margin: 0, width: '100%', display: 'flex', alignItems: 'center'}}
                  >
                    <div className="user-avatar-wrapper" style={{marginRight: 10}}>
                      <div className="user-avatar-placeholder" style={{width:24, height:24, fontSize:12, lineHeight:'24px'}}>{u.name?.charAt(0)}</div>
                      <span className="online-dot"></span>
                    </div>
                    <span className="user-name" style={{flex: 1, textAlign: 'left'}}>{u.name} {u.email === user?.email ? "(You)" : ""}</span>
                    {unread > 0 && !activeRoom?.includes(u.email) && (
                      <span style={{background: '#ff4d4d', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold'}}>{unread}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {user && (
          <div className="sidebar__footer">
            <div className="current-user">
              <div className="user-avatar-wrapper">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="avatar" style={{width: 36, height: 36, borderRadius: '50%', objectFit: 'cover'}} />
                ) : (
                  <div className="user-avatar-placeholder">{user.name?.charAt(0)}</div>
                )}
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
