require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let roomUserSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Rooms'
    },
    title: {
        type: String
    },
    roomRole: { //0 - owner, 1 - admin, 2 - member
        type: Number
    },
    actions: [{
        type: Schema.Types.ObjectId,
        ref: 'Actions'
    }],
    lastSeenMessage: {
        type: Schema.Types.ObjectId,
        ref: 'Chats'
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
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
    }
}, { versionKey: false });

module.exports = mongoose.model('RoomUsers', roomUserSchema)
