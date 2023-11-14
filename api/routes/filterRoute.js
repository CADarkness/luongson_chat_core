const express = require('express');
const router = express.Router();
const filterController = require('../controllers/filterController');
const { authorize } = require('../middlewares/authorize');

router.get('/getAll', authorize, filterController.getAllFilters);
router.post('/insertMany', authorize, filterController.createFilters);
router.delete('/delete/:id', authorize, filterController.deleteFilter);

module.exports = router;