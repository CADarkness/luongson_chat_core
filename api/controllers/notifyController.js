const NotifyItem = require('../../database/entities/Notifies/NotifyItem');
const HTTP_CODES = require('../../utilities/httpCodes');
const ResponseModel = require('../models/ResponseModel');

class NotifyController {
    static async insertNotifyByListOfUser (req, res) {
        try {

            let listOfNotifyToInsert = []

            req.body.listOfUser.forEach(item => {
                listOfNotifyToInsert.push({ user: item, content: req.body.content, ...(!!req.body.type && { type: req.body.type }) })
            })

            const notifyCreator = await NotifyItem.insertMany(listOfNotifyToInsert)
            
            return res.status(200).json(notifyCreator)

        } catch(error) {
            console.log(error)
            return res.status(500).json(error.message)
        }
    }

    static async getListOfNotify (req, res) {
        const notifies = await NotifyItem.find({ user: req.userId }).sort({ createdAt: -1 }).limit(100)
        res.status(200).json(notifies)
    }

    // @method: PUT; param: { notifyId }
    static async setNotifyIsReadStatus(req, res) {
        try {
            const notify = await NotifyItem.findById(req.params.notiId)
            if (!notify) return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Notify is not found",  null))

            console.log(notify.user, req.userId)

            if (notify.user.toString() !== req.userId) return res.status(200).json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null))

            notify.isRead = true
            await notify.save()

            return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", notify))
        } catch(error) {
            return res.status(200).json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", null))
        }
    }
}

module.exports = NotifyController