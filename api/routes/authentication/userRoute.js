const express = require('express');
const router = express.Router();
const userController = require('../../controllers/authentication/userController');
const { authorize } = require('../../middlewares/authorize');


router.post('/login', userController.login);
router.post('/register', userController.register);
router.post('/insert', authorize, userController.insertUser);
router.put('/update/:id', authorize, userController.updateUser);
router.delete('/delete/:id', authorize, userController.deleteUser);
router.get('/getById/:id', authorize, userController.getUserById);
router.get('/getByToken', authorize, userController.getUserByToken);
router.get('/getPaging', authorize, userController.getPagingUsers);
router.put('/updateUserByToken', authorize, userController.updateUserByToken)
router.get('/getSuperAdminIds', userController.getSuperAdminIds)
router.get('/getAllUser', authorize, userController.getAllUser)
router.get('/getListOfAdmin', authorize, userController.getListOfAdmin)
router.put('/changeBufaByToken', authorize, userController.changeBufaByToken)
module.exports = router;