"use client";

import { useState, useRef } from "react";
import { sendMessage, sendAIMessage, uploadFile, getFileType } from "@/lib/firebase";

export default function MessageInput({ roomId, currentUser, replyTo, onClearReply }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUser || sending) return;
    setSending(true); setText("");
    try {
      const replyData = replyTo ? { id: replyTo.id, userName: replyTo.userName, text: replyTo.text, fileType: replyTo.fileType } : null;
      await sendMessage(roomId, currentUser, trimmed, null, null, null, replyData);
      
      if (onClearReply) onClearReply();
      // Check for @AI mention
      if (/@ai\b/i.test(trimmed)) {
        const clean = trimmed.replace(/@ai\b/gi, "").trim();
        if (clean) {
          try {
            const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: clean, userName: currentUser.name }) });
            const data = await res.json();
            if (data.reply) await sendAIMessage(roomId, data.reply, trimmed);
            else if (data.error) await sendAIMessage(roomId, data.error, trimmed);
          } catch { await sendAIMessage(roomId, "Sorry, I'm having trouble connecting. Try again! 🔄", trimmed); }
        }
      }
    } catch (e) { console.error("Send failed:", e); }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (file.size > 25 * 1024 * 1024) { alert("File must be under 25MB"); return; }
    setUploading(true);
    try {
      const url = await uploadFile(roomId, file);
      const type = getFileType(file);
      const replyData = replyTo ? { id: replyTo.id, userName: replyTo.userName, text: replyTo.text, fileType: replyTo.fileType } : null;
      await sendMessage(roomId, currentUser, "", url, type, file.name, replyData);
      if (onClearReply) onClearReply();
    } catch (e) { alert("Upload failed: " + e.message); }
    finally { setUploading(false); fileRef.current.value = ""; }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="message-input" style={{ flexDirection: 'column' }}>
      {replyTo && (
        <div className="reply-preview" style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px 12px 0 0', 
          borderLeft: '4px solid var(--primary)', marginBottom: '-4px', zIndex: 1, position: 'relative' 
        }}>
          <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>Replying to {replyTo.userName}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {replyTo.text || (replyTo.fileType ? `[${replyTo.fileType}]` : "Attachment")}
            </span>
          </div>
          <button onClick={onClearReply} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '4px' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>
      )}
      <div className="message-input__wrapper" style={{ borderRadius: replyTo ? '0 0 24px 24px' : '24px' }}>
        <button className="attach-btn" onClick={() => fileRef.current?.click()} disabled={uploading} title="Attach file">
          {uploading ? <span className="send-spinner"></span> : "📎"}
        </button>
        <input ref={fileRef} type="file" accept="image/*,audio/*,video/*" style={{ display: "none" }} onChange={handleFileSelect} />
        <textarea ref={inputRef} className="message-input__field" placeholder={`Message #${roomId}... (Type @AI to ask Luna AI)`} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} rows={1} disabled={sending} />
        <button className={`message-input__send ${text.trim() ? "message-input__send--active" : ""}`} onClick={handleSend} disabled={!text.trim() || sending} aria-label="Send message">
          {sending ? <span className="send-spinner"></span> : <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>}
        </button>
      </div>
    </div>
  );
}
