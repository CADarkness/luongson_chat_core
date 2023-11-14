require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let chatSchema = new Schema({
    message: {
        type: String,
        default: ""
    },
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Rooms',
        required: true
    },
    type: { //0 - notification, 1 - message, 2 - image, 3 - file, 4 - link, 5 - gif
        type: Number
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    createdTime: {
        type: Date,
        default: Date.now()
    },
    lastModified: {
        type: Date,
        default: Date.now()
    },
    replyTo: {
        type: Schema.Types.ObjectId,
        ref: 'Chats'
    },
    forwardedFrom: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    file: {
        type: String,
    },
    reactions: [{
        type: Schema.Types.ObjectId,
        ref: 'Reactions'
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    tags: [{
        _id: Schema.Types.ObjectId,
        username: String,
    }]
}, { versionKey: false });

module.exports = mongoose.model('Chats', chatSchema)
