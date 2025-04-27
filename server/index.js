// imports
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js'; 
import Message from './models/Message.js';

dotenv.config();

// express and socket
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"],
    },
});

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("MongoDB connection error:", error));

let users = {};

// Socket.IO handling
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join_chat", async ({ username, room }) => {
        if (!username || !room) return;

        users[socket.id] = { username, room };
        socket.join(room);

        io.to(room).emit("update_users", getUsersInRoom(room));
        console.log(`${username} joined room: ${room}`);

        try {
            // Fetch previous messages for this room
            const messages = await Message.find({ receiver: room })
                .sort({ timestamp: 1 })
                .limit(50);

            socket.emit("previous_messages", messages.map(msg => ({
                user: msg.sender,
                message: msg.content,
                time: msg.timestamp.toLocaleTimeString()
            })));
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    });

    socket.on("send_message", async ({ user, message, room }) => {
        if (!user || !message || !room) return;
    
        const newMessage = new Message({
            sender: user,
            receiver: room,
            content: message,
          });
          
          try {
            const savedMessage = await newMessage.save();
            io.to(room).emit("receive_message", {
              user: savedMessage.sender,
              message: savedMessage.content,
              time: savedMessage.timestamp.toLocaleTimeString(),
            });
          } catch (error) {
            console.error("Error saving message:", error);
            socket.emit("error_message", "Message could not be saved");
          }
          
    });
    

    socket.on("typing", (room) => {
        const username = users[socket.id]?.username || "Unknown";
        socket.broadcast.to(room).emit("display_typing", username);
    });

    socket.on("stop_typing", (room) => {
        socket.broadcast.to(room).emit("hide_typing");
    });

    socket.on("disconnect", () => {
        const user = users[socket.id];
        if (user) {
            console.log(`${user.username} left room: ${user.room}`);
            delete users[socket.id];
            io.to(user.room).emit("update_users", getUsersInRoom(user.room));
        }
    });
});

// Route
app.get('/api/professors', async (req, res) => {
    try {
        const professors = await User.find({ role: 'professor' }).select('-password');
        res.json(professors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch professors' });
    }
});

// Helper
const getUsersInRoom = (room) => {
    return Object.values(users).filter(user => user.room === room);
};

// Start server
server.listen(3000, () => {
    console.log("Server is running on port 3000");
});
