const express = require('express');
const router = express.Router();
const { authorize } = require('../../middlewares/authorize');
const roleController = require('../../controllers/authentication/roleController');

router.post('/insert', authorize, roleController.createRole);
router.put('/update/:id', authorize, roleController.updateRole);
router.delete('/delete/:id', authorize, roleController.deleteRole);
router.get('/getPaging', authorize, roleController.getPagingRoles);
router.get('/getById/:id', authorize, roleController.getRoleById);
module.exports = router;