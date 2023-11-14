require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let roleSchema = new Schema({
    roleName: {
        type: String,
        required: true,
        unique: true
    },
    actions: [{
        type: Schema.Types.ObjectId,
        ref: 'Actions'
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    createdTime: {
        type: Date,
        default: Date.now()
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    updatedTime: {
        type: Date
    },
    default: {
        type: Boolean,
        default: false
    }
}, { versionKey: false });

module.exports = mongoose.model('Roles', roleSchema)
