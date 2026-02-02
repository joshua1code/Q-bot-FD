import React, { useState } from 'react';
import '../App.css'

function ChatAssistant({ isOpen, setIsOpen }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, from: 'user' }]);
      // Simulate bot response (replace with real logic/API if needed)
      setMessages(prev => [...prev, { text: 'Bot response: ' + input, from: 'bot' }]);
      setInput('');
    }
  };

  return (
    <>
      <div className="chat-bot" onClick={() => setIsOpen(!isOpen)}>
        💬
      </div>
      {isOpen && (
        <div className="chat-window">
          <h3>Chat Assistant</h3>
          <div className="messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.from}>{msg.text}</div>
            ))}
          </div>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
          />
          <button onClick={handleSend}>Send</button>
        </div>
      )}
    </>
  );
}

export default ChatAssistant;