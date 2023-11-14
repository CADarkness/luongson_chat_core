const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authorize } = require('../middlewares/authorize');

router.post('/uploadImage', authorize, uploadController.uploadImage);
router.post('/uploadVideo', authorize, uploadController.uploadVideo);
router.post('/uploadDocument', authorize, uploadController.uploadDocument);
router.delete('/deleteImage/:fileName', authorize, uploadController.deleteImage);
router.delete('/deleteVideo/:fileName', authorize, uploadController.deleteVideo);
router.delete('/deleteDocument/:fileName', authorize, uploadController.deleteDocument);
router.post('/imageUploader', authorize, uploadController.imageUploader)
router.get('/listOfFiles', authorize, uploadController.getListOfFilesByUser)

module.exports = router;