
import { useState, useRef, useEffect } from 'react';
import '../pages/ChatAssistant.css';

function ChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Fake bot reply (replace with real fetch / stream later)
    setTimeout(() => {
      const botReply = {
        role: 'assistant',
        content: `Got it! "${input}" — thinking...\n\nHere's my take on that 😄`,
      };
      setMessages((prev) => [...prev, botReply]);
    }, 900);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="app">
      {/* Sidebar trigger – you can make it functional later */}
      <button className="sidebar-btn">≡</button>

      <main className="main-content">
        {isEmpty ? (
          <div className="welcome">
            <h1 className="brand">QB-Assistant</h1>
            <p className="subtitle">How can I help you today?</p>
          </div>
        ) : (
          <div className="messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}
              >
                <div className="bubble">{msg.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="input-area">
        <form onSubmit={handleSend} className="input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!input.trim()}
          >
            →
          </button>
        </form>

        <p className="footer-text">
          CORA uses AI's latest models
        </p>
      </footer>
    </div>
  );
}

export default ChatAssistant;