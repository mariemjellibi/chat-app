import React, { useRef, useEffect } from 'react';

const MessageList = ({ messages, typingUser ,username}) => {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-64 overflow-y-auto border p-4 bg-white rounded-md">
      {messages.map((msg, index) => (
        <div key={index} className={`p-2 rounded-md w-fit ${msg.user === username ? 'bg-green-300 ml-auto' : 'bg-gray-300'}`}>
          <strong>{msg.user}</strong> <span className="text-xs text-gray-500">({msg.time})</span>
          <p>{msg.message}</p>
        </div>
      ))}
      {typingUser && <p className="text-gray-500 italic">{typingUser} is typing...</p>}
      <div ref={chatEndRef}></div>
    </div>
  );
};

export default MessageList;
