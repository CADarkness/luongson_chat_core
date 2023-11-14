const express = require('express');
const router = express.Router();
const gifController = require('../controllers/gifController');
const { authorize } = require('../middlewares/authorize');

router.get('/getPaging', authorize, gifController.getPagingGifs);
router.post('/insert', authorize, gifController.createGif);
router.post('/insertDefault', authorize, gifController.createDefaultGif);
router.delete('/delete/:id', authorize, gifController.deleteGif);
router.delete('/deleteDefault/:id', authorize, gifController.deleteDefaultGif);

module.exports = router;