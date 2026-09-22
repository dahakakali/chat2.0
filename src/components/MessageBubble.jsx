"use client";

export default function MessageBubble({ message, showAvatar, currentUser }) {
  const isOwn = currentUser?.email === message.userEmail;
  const isAI = message.isAI;

  const formatTime = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMedia = () => {
    if (!message.fileUrl) return null;
    const t = message.fileType;
    if (t === "image") return <img src={message.fileUrl} alt={message.fileName || "image"} className="msg-media msg-media--img" loading="lazy" />;
    if (t === "audio") return <audio controls className="msg-media msg-media--audio" src={message.fileUrl} preload="metadata" />;
    if (t === "video") return <video controls className="msg-media msg-media--video" src={message.fileUrl} preload="metadata" />;
    return <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="msg-file-link">📎 {message.fileName || "File"}</a>;
  };

  return (
    <div className={`message ${isOwn ? "message--own" : ""} ${isAI ? "message--ai" : ""} ${!showAvatar ? "message--grouped" : ""}`}>
      {showAvatar && (
        <div className="message__header">
          <div className="message__avatar">
            {isAI ? <div className="ai-avatar">🤖</div> : <div className="message__avatar-placeholder">{message.userName?.charAt(0)}</div>}
          </div>
          <span className={`message__name ${isAI ? "message__name--ai" : ""}`}>{message.userName}</span>
          <span className="message__time">{formatTime(message.createdAt)}</span>
        </div>
      )}
      <div className="message__body">
        <div className={`message__bubble ${isOwn ? "message__bubble--own" : ""} ${isAI ? "message__bubble--ai" : ""}`}>
          {message.text && <p className="message__text">{message.text}</p>}
          {renderMedia()}
        </div>
      </div>
    </div>
  );
}
