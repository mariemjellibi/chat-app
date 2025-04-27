import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true, // Ensure sender is required
  },
  receiver: {
    type: String,
    required: true, // Ensure receiver is required
  },
  content: {
    type: String,
    required: true, // Ensure message content is required
  },
  timestamp: {
    type: Date,
    default: Date.now, // Ensure timestamp is set to the current date/time
  },
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
