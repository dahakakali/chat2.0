"use client";

export function requestNotificationPermission() {
  if (typeof window === "undefined") return;
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function showNotification(title, body) {
  if (typeof window === "undefined") return;
  if ("Notification" in window && Notification.permission === "granted") {
    // Only show if page is not focused
    if (document.hidden || !document.hasFocus()) {
      try {
        const notification = new Notification(title, {
          body: body || "New message",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "chat2-msg-" + Date.now(),
          requireInteraction: false,
        });

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Focus window on click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (e) {
        console.warn("Notification failed:", e);
      }
    }
  }
}

export function isNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}
