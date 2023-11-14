const express = require('express');
const router = express.Router();
const { authorize } = require('../../middlewares/authorize');
const actionController = require('../../controllers/authentication/actionController');
const Actions = require('../../../database/entities/authentication/Actions');

router.post('/insert', actionController.insertAction);
router.put('/update/:id', authorize, actionController.updateAction);
router.get('/getActions', actionController.getActions)
router.get('/seedActions', async (req, res) => {
    try {
        const { actionName, isRoomAction, defaultRoomAction } = req.body
        await Actions.create({ actionName, isRoomAction, defaultRoomAction })
        return res.status(200).json("Tao thanh cong")
    } catch(err) {
        console.log(err)
        res.status(500).json("That bai")
    }
})

module.exports = router;