require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let fileSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Rooms'
    },
    filePath: {
        type: String,
        required: true,
        unique: true
    },
    fileType: { //0 - image, 1 - video, 2 - document, 3 - gif
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
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { versionKey: false });

module.exports = mongoose.model('Files', fileSchema)