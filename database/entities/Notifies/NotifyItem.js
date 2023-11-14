require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let notifyItemsSchema = new Schema({
    type: { type: String },
    content: { type: String, require: true },
    user: { type: Schema.Types.ObjectId, ref: "Users" },
    isRead: { type: Boolean, default: false }
    // notifyList: {
    //     ref: 'NotifyList'
    // }
}, { versionKey: false, timestamps: true });

module.exports = mongoose.model('NotifyItems', notifyItemsSchema);
