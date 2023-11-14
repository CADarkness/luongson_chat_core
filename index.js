const express = require('express');
const bodyParser = require('body-parser');
require("dotenv").config();
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(morgan('combined'));
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://cms.luongson.me', 'https://cms-bufa.luongson.me']
}));

//import routes
const port = process.env.PORT;
const actionRoute = require('./api/routes/authentication/actionRoute')
const userRoute = require('./api/routes/authentication/userRoute');
const roleRoute = require('./api/routes/authentication/roleRoute');
const roomRoute = require('./api/routes/roomRoute');
const chatRoute = require('./api/routes/chatRoute');
const reactionRoute = require('./api/routes/reactionRoute');
const roomUserRoute = require('./api/routes/roomUserRoute');
const uploadRoute = require('./api/routes/uploadRoute');
const fileRoute = require('./api/routes/fileRoute');
const gifRoute = require('./api/routes/gifRoute');
const filterRoute = require('./api/routes/filterRoute');
const communicateRoute = require('./api/routes/communicateRoute')
const notifyRoute = require('./api/routes/notifyRoute')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api/action', actionRoute);
app.use('/api/user', userRoute);
app.use('/api/role', roleRoute);
app.use('/api/room', roomRoute);
app.use('/api/chat', chatRoute);
app.use('/api/reaction', reactionRoute);
app.use('/api/usersrooms', roomUserRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/file', fileRoute);
app.use('/api/gif', gifRoute);
app.use('/api/filter', filterRoute);
app.use('/api/communicate', communicateRoute)
app.use('/api/notify', notifyRoute)
// Public Folder
app.use('/assets', express.static(path.join(__dirname, '/assets')));

app.listen(port, (req, res) => {
    console.log('server listening on port ' + port);
});