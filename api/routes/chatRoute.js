const express = require('express');
const router = express.Router();
const { authorize } = require('../middlewares/authorize');
const chatController = require('../controllers/chatController');

router.get('/getById/:id', authorize, chatController.getChatById);
router.get('/getChats/:roomId', authorize, chatController.getChats);
router.get('/getBefore/:roomId', authorize, chatController.getBeforeChats);
router.get('/getAfter/:roomId', authorize, chatController.getAfterChats);
router.get('/search', authorize, chatController.searchChats);
router.get('/getPaging', authorize, chatController.getPagingChats);
router.post('/insert', authorize, chatController.createChat);
router.delete('/delete/:id', authorize, chatController.deleteChat);
router.put('/update/:id', authorize, chatController.updateChat);
router.post('/pin', authorize, chatController.pinChat);
router.post('/deleteManyChat', authorize, chatController.deleteManyChat)

module.exports = router;