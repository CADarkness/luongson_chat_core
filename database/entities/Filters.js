require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let filterSchema = new Schema({
    key: {
        type: String
    },
    createdTime: {
        type: Date,
        default: Date.now()
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    updatedTime: {
        type: Date
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    }
}, { versionKey: false });

module.exports = mongoose.model('Filters', filterSchema)
