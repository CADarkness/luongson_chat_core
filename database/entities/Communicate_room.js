const { Schema, model } = require("mongoose")

let communicateRoomSchema = new Schema({
    fullName: { type: String },
    email: { type: String },
    login: { type: String },
    password: { type: String },
    isOnline: { type: Boolean, default: false }

}, { versionKey: false, timestamps: true });

const CommunicateRoom = model('CommunicateRoom', communicateRoomSchema)

module.exports = CommunicateRoom