const express = require('express')
const { authorize } = require('../middlewares/authorize')
const { AccessToken } = require('livekit-server-sdk');
const ResponseModel = require('../models/ResponseModel');
const HTTP_CODES = require('../../utilities/httpCodes');
const CommunicateRoom = require('../../database/entities/Communicate_room');
const router = express.Router();

function createSessionToken({ roomName, userName }) {
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_SECRET_KEY, {
        identity: userName,
    })
    at.addGrant({ roomJoin: true, room: roomName })
    return at.toJwt()
}

router.get('/getSession', authorize, (req, res) => {
    const { roomName, userName } = req.query
    if (roomName && userName) {
        return res.send(createSessionToken({ roomName, userName }))
    } else {
        return
    }
})

router.get("/communicateRooms/:fullName", authorize, async (req, res) => {
    try {

        const { fullName } = req.params
        const target = await CommunicateRoom.findOne({ fullName })
        if (!target) return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Không tìm thấy phòng này", null))
        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", target))
    } catch (error) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, error.message, null))
    }
})

router.get("/communicateRooms", authorize, async (req, res) => {
    try {
        const communicateRooms = await CommunicateRoom.find()
        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", communicateRooms))
    } catch (error) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, error.message, null))
    }
})

router.put("/setOnline/:fullName", authorize, async (req, res) => {
    try {
        const { fullName } = req.params
        const target = await CommunicateRoom.findOne({ fullName })
        if (!target) return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Không tìm thấy phòng này", null))
        target.isOnline = !target.isOnline
        await target.save()

        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, `Set trạng thái online sang ${target.isOnline} thành công`, target))
    } catch (err) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, error.message, null))
    }
})

router.post("/create-communicate-room", async (req, res) => {
    try {
        const { fullName, email, login, password } = req.body
        await CommunicateRoom.create({ fullName, email, login, password })
        return res.status(200).json({ fullName, email, login, password })
    } catch(err) {
        console.log(err)
        return res.status(500).json(err.message)
    }
})

module.exports = router;