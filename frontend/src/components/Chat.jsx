import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';

const socket = io("http://localhost:3000");

const Chat = ({ username }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  
  useEffect(() => {
    socket.emit("join_chat", username);

    socket.on("chat_history", (history) => {
      setMessages(history);
    });

    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("update_users", (userList) => {
      setUsers(userList);
    });

    socket.on("user_typing", ({ user, isTyping }) => {
      setTypingUser(isTyping ? user : null);
    });

    return () => {
      socket.off("receive_message");
      socket.off("update_users");
      socket.off("user_typing");
    };
  }, []);

  return (
    <div className="w-3/4 mx-auto">
      <h2 className="text-xl font-bold text-center">Chat Room</h2>
      <MessageList messages={messages} typingUser={typingUser} username={username} />
      <MessageInput socket={socket} username={username} />
      <UserList users={users} />
    </div>
  );
};

export default Chat;
