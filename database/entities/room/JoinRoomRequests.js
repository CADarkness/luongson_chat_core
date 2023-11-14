require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let joinRoomRequestSchema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    invitedFrom: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    status: {
        type: Number, // 0 - removed, 1 - pending, 2 - approved
        required: true,
    },
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Rooms',
        required: true
    }
}, { versionKey: false, timestamps: true });

module.exports = mongoose.model('JoinRoomRequests', joinRoomRequestSchema)
