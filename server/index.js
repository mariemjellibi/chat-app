import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

// 🔹 Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log("Connected to MongoDB");
}).catch((error) => {
    console.error("MongoDB connection error:", error);
});

const messageSchema = new mongoose.Schema({
    user: String,
    message: String,
    time: String,
    room: String
});
const Message = mongoose.model("Message", messageSchema);

let users = {}; // Store connected users

// 🔹 Handle Socket.IO connections
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // 🔹 User joins a chat room
    socket.on("join_chat", async ({ username, room }) => {
        if (!username || !room) return;
        
        users[socket.id] = { username, room };
        socket.join(room);
    
        io.to(room).emit("update_users", getUsersInRoom(room));
        console.log(`${username} joined room: ${room}`);
    
        // 🔹 Fetch previous messages immediately when user joins
        try {
            const messages = await Message.find({ room }).sort({ _id: 1 }).limit(50);
            socket.emit("previous_messages", messages);
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    });
    

    // 🔹 Load previous messages from MongoDB when user joins a room
    socket.on("load_messages", async (room) => {
        try {
            const messages = await Message.find({ room }).sort({ _id: 1 }).limit(50);
            socket.emit("previous_messages", messages);
            console.log("Loaded messages:", messages);
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    });
    

    // 🔹 Handle sending messages
    socket.on("send_message", async (data) => {
        const { user, message, room } = data;
        const messageData = {
            user, 
            message, 
            time: new Date().toLocaleTimeString(), 
            room
        };
    
        try {
            await new Message(messageData).save(); // Save message in MongoDB
            io.to(room).emit("receive_message", messageData); // Send to all users in room
        } catch (error) {
            console.error("Error saving message:", error);
        }
    });
    
    // 🔹 Typing Indicator
    socket.on("typing", (room) => {
        const username = users[socket.id]?.username || "Unknown";
        socket.broadcast.to(room).emit("display_typing", username);
    });

    socket.on("stop_typing", (room) => {
        socket.broadcast.to(room).emit("hide_typing");
    });

    // 🔹 Handle User Disconnect
    socket.on("disconnect", () => {
        const user = users[socket.id];
        if (user) {
            console.log(`${user.username} left room: ${user.room}`);
            delete users[socket.id];
            io.to(user.room).emit("update_users", getUsersInRoom(user.room));
        }
    });
});

// Helper function to get users in a room
const getUsersInRoom = (room) => {
    return Object.values(users).filter(user => user.room === room);
};

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});
