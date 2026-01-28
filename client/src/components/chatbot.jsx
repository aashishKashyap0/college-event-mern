// =======================================
// FILE: client/src/components/Chatbot.jsx
// =======================================

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api"; // your axios instance with token

const Chatbot = () => {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! I'm your Event Assistant. Ask me about events, registration, QR check-in, etc.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  // If not logged in, don't show chatbot at all
  if (!isAuthenticated) return null;

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add user message to chat
    setMessages((prev) => [...prev, { sender: "user", text: trimmed }]);
    setInput("");
    setTyping(true);

    try {
      const res = await api.post("/ai/chat", {
        message: trimmed,
        // we don't need to send role; backend reads req.user.role
      });

      const reply = res.data?.reply || "Sorry, I couldn't answer right now.";
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Something went wrong talking to AI." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, rgb(59,130,246), rgb(139,92,246))",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          fontSize: "26px",
        }}
        title="Chat with Event Assistant"
      >
        💬
      </div>

      {/* Chat Window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "320px",
            height: "420px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 12px",
              background:
                "linear-gradient(135deg, rgb(59,130,246), rgb(139,92,246))",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
            }}
          >
            <div>
              <div style={{ fontWeight: "bold" }}>Event Assistant</div>
              <div style={{ fontSize: "11px", opacity: 0.8 }}>
                Logged in as: {user?.name} ({user?.role})
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                border: "none",
                background: "transparent",
                color: "white",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: "10px",
              overflowY: "auto",
              fontSize: "13px",
              background: "#f9fafb",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent:
                    m.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    backgroundColor:
                      m.sender === "user" ? "#4f46e5" : "#e5e7eb",
                    color: m.sender === "user" ? "white" : "#111827",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ fontSize: "11px", color: "#6b7280" }}>
                Assistant is typing…
              </div>
            )}
          </div>

          {/* Input area */}
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              padding: "8px",
              background: "white",
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Ask about events, registration, QR check-in..."
              style={{
                width: "100%",
                resize: "none",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                padding: "6px 8px",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                marginTop: "6px",
                width: "100%",
                borderRadius: "8px",
                border: "none",
                padding: "6px",
                background:
                  "linear-gradient(135deg, rgb(59,130,246), rgb(139,92,246))",
                color: "white",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
