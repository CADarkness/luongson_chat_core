require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let pinedChatSchema = new Schema({
    chat: {
        type: Schema.Types.ObjectId,
        ref: 'Chats'
    },
    room: { type: Schema.Types.ObjectId, ref: "Rooms" },
    pinedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    pinedTime: {
        type: Date,
        default: Date.now()
    }
}, { versionKey: false });

module.exports = mongoose.model('PinedChats', pinedChatSchema)
