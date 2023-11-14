const express = require('express');
const router = express.Router();
const reactionController = require('../controllers/reactionController');
const { authorize } = require('../middlewares/authorize');

router.post('/insert', authorize, reactionController.createReaction);
router.delete('/delete/:id', authorize, reactionController.deleteReaction);

module.exports = router;