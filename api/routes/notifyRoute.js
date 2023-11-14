const express = require('express');
const router = express.Router();
const { authorize } = require('../middlewares/authorize');
const NotifyController = require('../controllers/notifyController');

router.post('/insertByListOfUser', NotifyController.insertNotifyByListOfUser)
router.get('/getListOfNotify', authorize, NotifyController.getListOfNotify)
router.put('/setNotifyIsReadStatus/:notiId', authorize, NotifyController.setNotifyIsReadStatus)

module.exports = router;