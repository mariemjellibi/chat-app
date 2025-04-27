import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// const socket = io("https://chat-app-6a63.onrender.com");
const socket = io("http://localhost:3000");

const App = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState(""); // 🔥 Add role
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [joined, setJoined] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (room) {
      socket.emit("load_messages", room);

      socket.on("receive_message", (data) => {
        setMessages((prev) => [...prev, data]);
      });

      socket.on("previous_messages", (oldMessages) => {
        setMessages(oldMessages);
      });

      socket.on("update_users", (userList) => {
        setUsers(userList); // 🔥 Save full user (username + role)
      });

      socket.on("display_typing", (user) => {
        setTypingUser(user);
      });

      socket.on("hide_typing", () => {
        setTypingUser(null);
      });

      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

      return () => {
        socket.off("receive_message");
        socket.off("update_users");
        socket.off("display_typing");
        socket.off("hide_typing");
      };
    }
  }, [room]); // Only depend on room

  const joinChat = () => {
    if (username.trim() && room.trim() && role.trim()) {
      socket.emit("join_chat", { username, room, role }); // 🔥 Send role to backend
      socket.emit("load_messages", room);
      setJoined(true);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("send_message", { user: username, message, room });
      setMessage("");
    }
  };

  const handleTyping = () => {
    socket.emit("typing", room);
    setTimeout(() => socket.emit("stop_typing", room), 2000);
  };

  return (
    <div className="bg-amber-200 min-h-screen flex flex-col p-4">
      {!joined ? (
        <div className="flex flex-col items-center space-y-2">
          <input 
            type="text" 
            placeholder="Enter your name" 
            className="border-2 p-2 rounded-md"
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
          <input 
            type="text" 
            placeholder="Enter room name" 
            className="border-2 p-2 rounded-md"
            value={room} 
            onChange={(e) => setRoom(e.target.value)} 
          />
          <select 
            className="border-2 p-2 rounded-md"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Select Role</option>
            <option value="professor">Professor 👨‍🏫</option>
            <option value="student">Student 👨‍🎓</option>
          </select>
          <button 
            className="bg-blue-500 text-white p-2 mt-2 rounded-md"
            onClick={joinChat}
          >
            Join Chat
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-md shadow-md w-3/4 mx-auto">
            <h2 className="text-xl font-bold">Chat Room: {room}</h2>
            <div className="h-64 overflow-y-auto border p-4 bg-white rounded-md space-y-2">
              {messages.length === 0 ? (
                <p>No messages yet.</p>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`p-2 rounded-md w-fit ${msg.user === username ? 'bg-green-300 ml-auto' : 'bg-gray-300'}`}>
                    <strong>{msg.user}</strong> <span className="text-xs text-gray-500">({msg.time})</span>
                    <p>{msg.message}</p>
                  </div>
                ))
              )}
              <div ref={chatEndRef}></div>
            </div>
            {typingUser && (
              <p className="text-gray-500 text-sm">{typingUser} is typing...</p>
            )}
            <input 
              type="text" 
              placeholder="Type a message" 
              className="border-2 p-2 w-full rounded-md mt-2"
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              onInput={handleTyping}
            />
            <button 
              className="bg-green-500 text-white p-2 mt-2 rounded-md"
              onClick={sendMessage}
              disabled={!message.trim()}
            >
              Send
            </button>
          </div>

          <div className="mt-4 bg-gray-100 p-4 w-3/4 mx-auto rounded-md">
            <h2 className="text-lg font-bold">Online Users</h2>
            <ul className="list-disc list-inside">
              {users.map((user, index) => (
                <li key={index} className="p-1">
                  {user.username} ({user.role === "professor" ? "👨‍🏫 Professor" : "👨‍🎓 Student"})
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
