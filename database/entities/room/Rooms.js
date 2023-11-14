require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let roomSchema = new Schema({
    roomOwner: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    roomName: {
        type: String,
        required: true
    },
    key: { type: String, unique: true, index: true },
    isActive: { type: Boolean, default: true },
    roomIcon: {
        type: String,
        default: ""
    },
    roomType: { //0 - personal, 1 - private, 2 - public, 3 - global
        type: Number
    },
    createdTime: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    updatedTime: {
        type: Date
    },
    lastMessage:{
        type: Schema.Types.ObjectId,
        ref: 'Chats'
    },
    roomUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'RoomUsers'
    }],
    pinedChats: [{
        type: Object
    }],
    bannedUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'Users',
        default: []
    }],
    unseenBy: [{
        type: Schema.Types.ObjectId,
        ref: 'Users',
        default: []
    }]
}, { versionKey: false });

module.exports = mongoose.model('Rooms', roomSchema)
