import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'professor'], required: true },
    courses: [{ type: String }], // Courses taught (professor) or enrolled (student)
    profilePicture: { type: String, default: 'default-avatar.png' },
    online: { type: Boolean, default: false }
  });

const User = mongoose.model('User', userSchema);
export default User;
