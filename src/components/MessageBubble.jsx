"use client";

import { useState, useRef } from "react";

export default function MessageBubble({ message, showAvatar, currentUser, friends = [], onReply }) {
  const isOwn = currentUser?.email === message.userEmail;
  const isFriend = friends.includes(message.userEmail);
  const isAI = message.isAI;
  
  const canSeeProfile = isOwn || isFriend || isAI;

  const formatTime = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(null);
  const startY = useRef(null);
  const isDragging = useRef(false);

  const handlePointerDown = (e) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || startX.current === null || startY.current === null) return;
    if (e.pointerType === 'touch' && !e.isPrimary) return;
    const diffX = e.clientX - startX.current;
    const diffY = e.clientY - startY.current;
    if (Math.abs(diffY) > Math.abs(diffX) && translateX === 0) { isDragging.current = false; return; }
    if (diffX > 0) {
      if (diffX < 70) setTranslateX(diffX);
      else setTranslateX(70 + (diffX - 70) * 0.15);
    }
  };

  const handleTouchStart = (e) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current || startX.current === null || startY.current === null) return;
    const diffX = e.touches[0].clientX - startX.current;
    const diffY = e.touches[0].clientY - startY.current;
    if (Math.abs(diffY) > Math.abs(diffX) && translateX === 0) { isDragging.current = false; return; }
    if (diffX > 0) {
      if (diffX < 70) setTranslateX(diffX);
      else setTranslateX(70 + (diffX - 70) * 0.15);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (translateX > 50 && onReply) onReply(message);
    setTranslateX(0);
  };

  const handlePointerCancel = () => {
    isDragging.current = false;
    setTranslateX(0);
  };

  // Convert URLs in messages into clickable links
  const renderTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.split(urlRegex).map((part, index) => {
      if (/^https?:\/\//i.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="message__link"
          >
            {part}
          </a>
        );
      }

      return part;
    });
  };

  const renderMedia = () => {
    if (!message.fileUrl) return null;

    const t = message.fileType;

    if (t === "sticker") {
      return (
        <img
          src={message.fileUrl}
          alt="sticker"
          className="msg-media--sticker"
          loading="lazy"
        />
      );
    }

    if (t === "image") {
      return (
        <img
          src={message.fileUrl}
          alt={message.fileName || "image"}
          className="msg-media msg-media--img"
          loading="lazy"
        />
      );
    }

    if (t === "audio") {
      return (
        <audio
          controls
          className="msg-media msg-media--audio"
          src={message.fileUrl}
          preload="metadata"
        />
      );
    }

    if (t === "video") {
      return (
        <video
          controls
          className="msg-media msg-media--video"
          src={message.fileUrl}
          preload="metadata"
        />
      );
    }

    return (
      <a
        href={message.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="msg-file-link"
      >
        📎 {message.fileName || "File"}
      </a>
    );
  };

  return (
    <div style={{ position: 'relative', overflow: 'visible' }}>
      <div 
        className="message-swipe-indicator" 
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          marginTop: '-16px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: Math.min(translateX / 50, 1),
          transform: `scale(${Math.min(0.5 + (translateX / 100), 1)})`,
          transition: translateX === 0 ? 'opacity 0.2s, transform 0.2s' : 'none',
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
        </svg>
      </div>

      <div
        id={`msg-${message.id}`}
        className={`message ${isOwn ? "message--own" : ""} ${isAI ? "message--ai" : ""
          } ${!showAvatar ? "message--grouped" : ""}`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 ? 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
          touchAction: 'pan-y',
          position: 'relative',
          zIndex: 1
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePointerUp}
      >
      {showAvatar && (
        <div className="message__header">
          <div className="message__avatar">
            {isAI ? (
              <div className="ai-avatar">🤖</div>
            ) : (canSeeProfile && message.userPhoto) ? (
              <img src={message.userPhoto} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
            ) : (
              <div className="message__avatar-placeholder">
                {message.userName?.charAt(0)}
              </div>
            )}
          </div>

          <span
            className={`message__name ${isAI ? "message__name--ai" : ""
              }`}
          >
            {message.userName}
          </span>

          <span className="message__time">
            {formatTime(message.createdAt)}
          </span>
        </div>
      )}

      <div className="message__body">
        <div
          className={message.fileType === "sticker" && !message.text && !message.replyTo 
            ? "message__sticker-container" 
            : `message__bubble ${isOwn ? "message__bubble--own" : ""} ${isAI ? "message__bubble--ai" : ""}`}
        >
          {message.replyTo && (
            <div 
              className="message__reply-quote"
              onClick={() => {
                const el = document.getElementById(`msg-${message.replyTo.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.style.transition = 'background-color 0.3s ease';
                  const origBg = el.style.backgroundColor;
                  el.style.backgroundColor = 'rgba(150, 150, 150, 0.2)';
                  setTimeout(() => { el.style.backgroundColor = origBg; }, 1200);
                }
              }}
              style={{
                margin: '-4px -10px 6px -10px',
                padding: '6px 10px 8px 12px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '8px',
                borderLeft: '4px solid #00a884',
                cursor: 'pointer',
                fontSize: '14px',
                userSelect: 'none',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                maxWidth: 'calc(100% + 20px)'
              }}
            >
              <div style={{fontWeight: '600', color: '#00a884', marginBottom: '4px', fontSize: '12px'}}>{message.replyTo.userName}</div>
              <div 
                 style={{
                   color: 'rgba(255,255,255,0.7)', 
                   display: '-webkit-box',
                   WebkitLineClamp: 4,
                   WebkitBoxOrient: 'vertical',
                   overflow: 'hidden',
                   textOverflow: 'ellipsis',
                   fontSize: '13px', 
                   lineHeight: '1.3',
                   whiteSpace: 'pre-wrap',
                   wordBreak: 'break-word'
                 }}
              >
                 {message.replyTo.text || (message.replyTo.fileType ? `[${message.replyTo.fileType}]` : "Attachment")}
              </div>
            </div>
          )}

          {message.text && (
            <p className="message__text">
              {renderTextWithLinks(message.text)}
            </p>
          )}

          {renderMedia()}
        </div>
        </div>
      </div>
    </div>
  );
}