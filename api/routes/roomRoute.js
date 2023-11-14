const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authorize } = require('../middlewares/authorize');

router.get("/getRoomById/:id", authorize, roomController.getRoomById)
router.get('/getPaging', authorize, roomController.getPagingRooms);
router.get('/getByToken', authorize, roomController.getRoomsByToken);
router.post('/insert', authorize, roomController.createRoom);
router.delete('/delete/:id', authorize, roomController.deleteRoom);
router.put('/update/:id', authorize, roomController.updateRoom);
router.post('/getPersonalRoom/:userId', authorize, roomController.getPersonalRoom);
router.get('/findPrivateRoom/:key', authorize, roomController.findPrivateRoom)
router.get("/getAllRoom", authorize, roomController.getAllRoom)
router.put("/setSeenMessage/:roomId", authorize, roomController.setSeenMessage)
router.post("/createPrivateRoomWithBufa", authorize, roomController.createPrivateRoomWithBufa)
router.post("/insertUserToManyRoom", authorize, roomController.insertUserToManyRoom)
module.exports = router;