import React, { useState } from 'react';

const MessageInput = ({ socket, username }) => {
  const [message, setMessage] = useState("");

  const handleTyping = () => {
    socket.emit("typing", message.length > 0);
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("send_message", { user: username, message });
      setMessage("");
    }
  };

  return (
    <div className="mt-2">
      <input 
        type="text" 
        placeholder="Type a message" 
        className="border-2 p-2 w-full rounded-md"
        value={message} 
        onChange={(e) => {
          setMessage(e.target.value);
          handleTyping();
        }} 
      />
      <button 
        className="bg-green-500 text-white p-2 mt-2 rounded-md"
        onClick={sendMessage}
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;
