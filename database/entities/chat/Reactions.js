require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let reactionSchema = new Schema({
    chat: {
        type: Schema.Types.ObjectId,
        ref: 'Chats'
    },
    emoji: {
        type: String,
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    createdTime: {
        type: Date,
        default: Date.now()
    }
}, { versionKey: false });

module.exports = mongoose.model('Reactions', reactionSchema);
