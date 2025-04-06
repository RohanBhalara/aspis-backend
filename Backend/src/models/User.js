import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        index: true,
        unique: true
    },
    password: String
});

const User = mongoose.model('User', userSchema);

export default User;