import React, { useState, useRef, useEffect } from "react";
import { askChatbot } from "../api/client";
import { useTranslation } from "react-i18next";
import "./Chatbot.css";

export default function Chatbot() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am SoilSense AI, your personal agronomist. I have analyzed your latest soil data. Ask me anything about your yields, pH, or fertilizer recommendations!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const currentHistory = [...messages];
    
    // Add user message to UI immediately
    setMessages([...currentHistory, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Send history (excluding the first generic greeting to save tokens, or keep it if desired)
      // We will send the full history so the AI has conversation context
      const { data } = await askChatbot(userMessage.content, currentHistory.slice(1));
      
      const aiMessage = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const serverError = error?.response?.data?.detail || error?.message || "Unknown error";
      const errorMessage = { role: "assistant", content: `⚠️ Error: ${serverError}` };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render newlines as <br /> and basic bullet points
  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      // If it's a bullet point
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return <div key={i} className="chat-bullet">{line}</div>;
      }
      return <span key={i}>{line}<br /></span>;
    });
  };

  return (
    <div className="chatbot-page">
      <div className="container">
        
        <div className="chat-header fade-up">
          <div className="chat-brand">
            <span className="chat-icon">🤖</span>
            <div>
              <h1>AI <span className="grad-text">Agronomist</span></h1>
              <p>Ask questions about your latest soil analysis and get smart, personalized advice.</p>
            </div>
          </div>
        </div>

        <div className="chat-container fade-up">
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="chat-avatar">
                  {msg.role === "assistant" ? "🌱" : "👤"}
                </div>
                <div className="chat-bubble">
                  {formatText(msg.content)}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="chat-message assistant">
                <div className="chat-avatar">🌱</div>
                <div className="chat-bubble typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="chat-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., Why is my yield low?"
              disabled={loading}
              autoComplete="off"
            />
            <button type="submit" className="chat-send-btn" disabled={loading || !input.trim()}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
              </svg>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
