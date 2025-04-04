import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io("http://localhost:3000");

const App = () => {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [joined, setJoined] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Fetch previous messages when the room is set
    const fetche = () => {
      socket.emit("load_messages", room);
    };
  
    // Call fetche() after the socket event listeners are set
    fetche();
  
    // Set up socket event listeners
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });
  
    socket.on("previous_messages", (oldMessages) => {
      setMessages(oldMessages); // charger l'historique
    });
  
    socket.on("update_users", (userList) => {
      setUsers(userList);
      socket.on("update_users", (userList) => {
        // Create a Set from the userList to remove duplicates and convert it back to an array
        const uniqueUsers = Array.from(new Set(userList.map(user => user.username)))
        setUsers(uniqueUsers); // Update the state with the unique users
      });
    });
  
    socket.on("display_typing", (user) => {
      setTypingUser(user);
    });
  
    socket.on("hide_typing", () => {
      setTypingUser(null);
    });
  
    // Cleanup socket listeners when component unmounts
    return () => {
      socket.off("receive_message");
      socket.off("update_users");
      socket.off("display_typing");
      socket.off("hide_typing");
    };
  }, [room]); // Re-run the effect when the room changes
  

  const joinChat = () => {
    if (username.trim() && room.trim()) {
      socket.emit("join_chat", { username, room });
      
    // ➕ Charger les anciens messages
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
        <div className="flex flex-col items-center">
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
            className="border-2 p-2 rounded-md mt-2"
            value={room} 
            onChange={(e) => setRoom(e.target.value)} 
          />
          <button 
            className="bg-blue-500 text-white p-2 mt-4 rounded-md"
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
              {messages.map((msg, index) => (
                <div key={index} className={`p-2 rounded-md w-fit ${msg.user === username ? 'bg-green-300 ml-auto' : 'bg-gray-300'}`}>
                  <strong>{msg.user}</strong> <span className="text-xs text-gray-500">({msg.time})</span>
                  <p>{msg.message}</p>
                </div>
              ))}
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
            >
              Send
            </button>
          </div>
          <div className="mt-4 bg-gray-100 p-4 w-3/4 mx-auto rounded-md">
            <h2 className="text-lg font-bold">Online Users</h2>
            <ul>
              {users.map((user, index) => (
                <li key={index} className="p-1">{user.username}</li>
              ))}
            </ul>
          </div>
          {/* <button onClick={fetche}>fetch previous messages </button> */}
        </>
      )}
    </div>
  );
};

export default App;
