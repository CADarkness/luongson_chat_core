require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let gifSchema = new Schema({
    file: {
        type: Schema.Types.ObjectId,
        ref: "Files"
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    createdTime: {
        type: Date,
        default: Date.now()
    },
    default: {
        type: Boolean,
        default: false
    }
}, { versionKey: false });

module.exports = mongoose.model('Gifs', gifSchema);
