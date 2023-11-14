const express = require('express');
const router = express.Router();
const roomUserController = require('../controllers/roomUserController');
const { authorize } = require('../middlewares/authorize');

router.get('/getPaging', authorize, roomUserController.getPagingRoomUsers);
router.get('/getById', authorize, roomUserController.getRoomUserById);
router.post('/insert', authorize, roomUserController.createRoomUser);
router.post('/delete', authorize, roomUserController.deleteRoomUser);
router.put('/update/:id', authorize, roomUserController.updateRoomUser);
router.put('/updateLastSeenMessage', authorize, roomUserController.updateLastSeenMessage);
router.get('/getRoomUserByRoomId/:roomId', authorize, roomUserController.getRoomUserByRoomId);
router.get('/getJoinedRoomByUserId/:userId', authorize, roomUserController.getJoinedRoomByUserId)
router.post('/createJoinRoomRequestByQRCode', authorize, roomUserController.createJoinRoomRequestByQRCode);
router.put('/updateJoinRoomRequest/:joinRequestId', authorize, roomUserController.updateJoinRoomRequest);
router.delete('/leaveRoom/:roomId', authorize, roomUserController.leaveRoom)
router.get('/findUsersByRoomIds', authorize, roomUserController.findUsersByRoomIds)
router.put(`/banChat`, authorize, roomUserController.banChat)
module.exports = router;