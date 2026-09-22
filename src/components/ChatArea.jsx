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
  const room = ROOMS.find((r) => r.id === roomId);

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

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-header__info">
          <span className="chat-header__icon">{room?.icon}</span>
          <div><h2 className="chat-header__name">{room?.name}</h2><p className="chat-header__desc">{room?.description}</p></div>
        </div>
        <div className="chat-header__hint">Type <code>@AI</code> to chat with Luna AI ✨</div>
      </div>
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
