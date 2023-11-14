var mongoose = require('mongoose');
const username = 'Admin789bet';
const password = 'admin789bet'
const server = '127.0.0.1:27017';
const database = 'chat-db';
class Database {
    constructor() {
        this._connect()
    }
    _connect() {
        //let mongodbURL = `mongodb://${username}:${password}@${server}/${database}`;
        let mongodbURL = process.env.MONGODB_URI ?? `mongodb://${server}/${database}`;
        mongoose.set('strictQuery', true);
        mongoose.connect(mongodbURL)
            .then(() => {
                console.log('Database connection successful')
            })
            .catch(err => {
                console.error('Database connection error')
            })
    }
}

module.exports = new Database();