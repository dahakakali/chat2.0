"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeToMessages, ROOMS } from "@/lib/firebase";
import { showNotification } from "@/lib/notifications";
import MessageBubble from "./MessageBubble";

export default function ChatArea({ roomId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const msgCountRef = useRef(0);
  
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const fileInputRef = useRef(null);
  
  let room = ROOMS.find((r) => r.id === roomId);
  if (!room && roomId.startsWith("dm_")) {
    const emails = roomId.replace("dm_", "").split("_");
    const otherEmail = emails.find(e => e !== currentUser?.email) || "Someone";
    room = { id: roomId, name: otherEmail.split("@")[0], icon: "👤", description: "Direct Message" };
  }

  useEffect(() => {
    setLoading(true); setMessages([]); msgCountRef.current = 0;
    const unsub = subscribeToMessages(roomId, (msgs) => {
      // Notification for new messages
      if (msgs.length > msgCountRef.current && msgCountRef.current > 0) {
        const newMsg = msgs[msgs.length - 1];
        if (newMsg.userEmail !== currentUser?.email) {
          showNotification(`${newMsg.userName} in #${room?.name}`, newMsg.text || "Sent a file");
        }
      }
      msgCountRef.current = msgs.length;
      setMessages(msgs); setLoading(false);
    });
    return () => unsub();
  }, [roomId, currentUser?.email, room?.name]);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  };
  
  const { updateUser } = import("@/lib/auth-context").then(m => m.useAuth) ? require("@/lib/auth-context").useAuth() : { updateUser: ()=>{} }; // safe dynamic import fallback, wait, actually we can just pass updateUser from page.jsx

  // It's better to just pass updateUser via props or cleanly grab it.
  const auth = require("@/lib/auth-context").useAuth();

  const handleProfileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProfile(true);
    try {
      const { uploadFile, updateUserProfile } = await import("@/lib/firebase");
      const url = await uploadFile("profiles", file);
      await updateUserProfile(currentUser.email, url);
      auth.updateUser({ photoURL: url });
      alert("Profile picture updated!");
    } catch (err) {
      alert("Failed to upload profile picture.");
      console.error(err);
    } finally {
      setUploadingProfile(false);
    }
  };

  useEffect(() => {
    if (currentUser && !currentUser.uid) {
       // Autoload missing UID onto current session without forcing a logout
       import("firebase/firestore").then(async ({ getDoc, doc }) => {
          const { db } = await import("@/lib/firebase");
          const d = await getDoc(doc(db, "users", currentUser.email));
          if (d.exists() && d.data().uid) {
             auth.updateUser({ uid: d.data().uid, photoURL: d.data().photoURL });
          }
       }).catch(()=>{});
    }
  }, [currentUser?.email]);

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-header__info">
          <span className="chat-header__icon">{room?.icon}</span>
          <div><h2 className="chat-header__name">{room?.name}</h2><p className="chat-header__desc">{room?.description}</p></div>
        </div>
        <div className="chat-header__hint" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <span>Type <code>@AI</code> to chat with Luna</span>
          <button onClick={() => setProfileModalOpen(true)} aria-label="Profile Settings" style={{background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', marginLeft: '10px'}}>
             {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="profile" style={{width: 36, height: 36, borderRadius: '50%', objectFit: 'cover'}} />
             ) : (
                <div style={{width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>{currentUser?.name?.charAt(0)}</div>
             )}
          </button>
        </div>
      </div>
      
      {profileModalOpen && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', width: '320px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
            <h2 style={{marginTop: 0, marginBottom: '24px'}}>Your Profile</h2>
            <div style={{width: 90, height: 90, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', overflow: 'hidden'}}>
               {currentUser?.photoURL ? <img src={currentUser.photoURL} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : currentUser?.name?.charAt(0)}
            </div>
            
            <h3 style={{margin: '0 0 4px 0', fontSize: '18px'}}>{currentUser?.name}</h3>
            <p style={{color: 'var(--primary)', margin: '0 0 20px 0', fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px'}}>UID: {currentUser?.uid || "Generating..."}</p>
            
            <input type="file" accept="image/*" ref={fileInputRef} style={{display: 'none'}} onChange={handleProfileUpload} />
            <button className="btn btn--primary" style={{width: '100%', marginBottom: '12px'}} onClick={() => fileInputRef.current?.click()} disabled={uploadingProfile}>
                {uploadingProfile ? "Uploading..." : "Change Picture"}
            </button>
            <button className="btn btn--ghost" style={{width: '100%'}} onClick={() => setProfileModalOpen(false)}>Done</button>
          </div>
        </div>
      )}

      <div className="messages-container" ref={containerRef} onScroll={handleScroll}>
        {loading ? (
          <div className="messages-loading"><div className="loading-spinner"></div><p>Loading messages...</p></div>
        ) : messages.length === 0 ? (
          <div className="messages-empty"><span className="empty-icon">{room?.icon}</span><h3>Welcome to #{room?.name}</h3><p>Say hi! 👋</p></div>
        ) : (
          messages.map((msg, i) => {
            const prev = i > 0 ? messages[i - 1] : null;
            return <MessageBubble key={msg.id} message={msg} showAvatar={!prev || prev.userEmail !== msg.userEmail} currentUser={currentUser} />;
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
