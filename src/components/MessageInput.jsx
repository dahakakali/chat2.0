"use client";

import { useState, useRef } from "react";
import { sendMessage, sendAIMessage, uploadFile, getFileType } from "@/lib/firebase";

export default function MessageInput({ roomId, currentUser }) {
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
      await sendMessage(roomId, currentUser, trimmed);
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
      await sendMessage(roomId, currentUser, "", url, type, file.name);
    } catch (e) { alert("Upload failed: " + e.message); }
    finally { setUploading(false); fileRef.current.value = ""; }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="message-input">
      <div className="message-input__wrapper">
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
