const express = require('express');
const router = express.Router();
const { authorize } = require('../middlewares/authorize');
const fileController = require('../controllers/fileController');

router.get('/getPaging', authorize, fileController.getPagingFiles);
router.post('/insert', authorize, fileController.createFile);
router.delete('/delete/:id', authorize, fileController.deleteFile);

module.exports = router;