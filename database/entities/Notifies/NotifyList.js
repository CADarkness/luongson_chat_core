require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let notifyListSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    notiMessages: [{
        type: Schema.Types.ObjectId,
        ref: 'NotifyItems'
    }]
}, { versionKey: false });

module.exports = mongoose.model('NotifyList', notifyListSchema);
