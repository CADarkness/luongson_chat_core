require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let actionSchema = new Schema({
    actionName: {
        type: String,
        required: true,
        unique: true
    },
    isRoomAction: {
        type: Boolean,
        default: false
    },
    defaultRoomAction: {
        type: Boolean,
        default: false
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    updatedTime: {
        type: Date
    }
}, { versionKey: false });

module.exports = mongoose.model('Actions', actionSchema)
