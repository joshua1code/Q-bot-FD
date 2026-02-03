import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const panelVariants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    x: "-100%",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

function ChatAssistant({ isOpen, setIsOpen }) {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hello 👋 How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const messagesEndRef = useRef(null);

  // auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const sendMessage = async () => {
    if (!input.trim() || thinking) return;

    const userMessage = input;
    setInput("");

    setMessages(prev => [...prev, { from: "user", text: userMessage }]);
    setThinking(true);

    try {
      const res = await fetch("https://YOUR_API_ENDPOINT_HERE", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { from: "bot", text: data.reply || "No response received." },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          from: "bot",
          text: "⚠️ Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button className="chat-fab" onClick={() => setIsOpen(true)}>
          💬
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className="chat-assistant"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <header className="chat-header">
              <h3>Assistant</h3>
              <button onClick={() => setIsOpen(false)}>✕</button>
            </header>

            <div className="chat-messages">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`chat-msg ${msg.from}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {msg.text}
                </motion.div>
              ))}

              {thinking && (
                <div className="chat-msg bot typing">
                  <span />
                  <span />
                  <span />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about markets, trades, or risk…"
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage} disabled={thinking}>
                Send
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatAssistant;
