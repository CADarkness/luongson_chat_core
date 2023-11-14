require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    lastLogin: { type: Date }, 
    avatar: {
        type: String,
        default: ""
    },
    fullName: {
        type: String,
        default: 'unknown'
    },
    email: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    createdTime: {
        type: Date,
        default: Date.now()
    },
    updatedTime: {
        type: Date
    },
    bufa: {
        type: String,
        unique: true
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: 'Roles'
    },
    status: { // 0 - deleted, 1 - active, 2 - locked
        type: Number,
        default: 1
    },
    bio: {
        type: String,
        unique: true
    },
    rooms: [{ type: Schema.Types.ObjectId, ref: 'Rooms' }],
    isOnline: { type: Boolean, default: false },
}, { versionKey: false });

module.exports = mongoose.model('Users', userSchema)
