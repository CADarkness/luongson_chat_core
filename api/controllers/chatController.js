const Chats = require('../../database/entities/chat/Chats');
const ResponseModel = require('../models/ResponseModel');
const Rooms = require('../../database/entities/room/Rooms');
const PagedModel = require('../models/PagedModel');
const { chatTypes, httpCodes } = require('../../utilities/constants');
const { isValidObjectId, default: mongoose } = require('mongoose');
const { chatActions } = require('../../utilities/actions');
const PinedChats = require('../../database/entities/chat/PinedChats');
const RoomUsers = require('../../database/entities/room/RoomUsers');
const HTTP_CODES = require('../../utilities/httpCodes');
//body
// {
//     message: String,
//     room: ObjectId,
//     type: Number,
//     replyTo: ObjectId,
//     forwardedFrom: ObjectId,
//     file: ObjectId
// }
async function createChat(req, res) {
    if (req.actions.includes(chatActions.createChat) || req.isSuperAdmin) {

        try {
    
            let room = await Rooms.findById(req.body.room).populate({ path: "roomUsers" });
            if (!room) return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Phòng không hợp lệ", null))

            if (room.bannedUsers.map(item => item.toString()).includes(req.userId)) return res.status(200).json(new ResponseModel(HTTP_CODES.FORBIDDEN, "Bạn đã bị ban khỏi phòng này", null))

            room.unseenBy = room.unseenBy.concat(room.roomUsers.filter(item => item.user.toString() !== req.userId).map(item => item.user))
            await room.save()

            if (!room && !room.isActive) return res.status(200).json(new ResponseModel(
                HTTP_CODES.FORBIDDEN, "Phòng đã bị khóa, bạn không thể chat", null
            ))

                let chat = new Chats(req.body);
                chat.createdBy = req.userId;
                let now = Date.now();
                chat.createdTime = now
                chat.lastModified = now;

                let newChat = await chat.save();
                await Chats.populate(newChat, { path: 'createdBy', select: 'avatar fullName username' })

                if (newChat.forwardedFrom) {
                    await Chats.populate(newChat, { path: 'forwardedFrom', select: 'avatar fullName' })
                }

                await newChat.populate({ path: "room", select: "roomName roomIcon roomType" })

                if (newChat.replyTo) {
                    await Chats.populate(
                        newChat,
                        {
                            path: 'replyTo',
                            select: 'message isDeleted room type createdBy lastModified file',
                            populate: { path: 'createdBy', select: 'avatar fullName' }
                        }
                    )
                }

                //Update last message for this room
                room.lastMessage = newChat._id;
                await room.save();
                return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Gửi tin nhắn thành công!', newChat));

        } catch (error) {
            console.log(error)
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
        }

    }
    else {
        return res.status(200).json(new ResponseModel(HTTP_CODES.FORBIDDEN, "Không được phép", null))
    }
}

async function insertListOfChat(req, res) {
    if (req.actions.includes(chatActions.createChat)) {

        // let chat = new Chats(req.body);
        // chat.createdBy = req.userId;
        // let now = Date.now();
        // chat.createdTime = now
        // chat.lastModified = now;
    }
}

//body
// {
//     message: String,
//     room: ObjectId,
//     type: Number,
//     replyTo: ObjectId,
//     forwardedFrom: ObjectId,
//     file: ObjectId
// }
async function updateChat(req, res) {

    if (req.actions.includes(chatActions.updateChat) || req.isSuperAdmin) {

        try {
            let chat = await Chats.findById(req.params.id);

            if (chat && chat.createdBy == req.userId) {
                chat.message = req.body.message || chat.message;
                chat.room = req.body.room || chat.room;
                chat.type = req.body.type || chat.type;
                chat.replyTo = req.body.replyTo || chat.replyTo;
                chat.forwardedFrom = req.body.forwardedFrom || chat.forwardedFrom;
                chat.file = req.body.file || chat.file;
                chat.lastModified = Date.now();
                let updatedChat = await chat.save()

                await updatedChat.populate({ path: "replyTo", populate: { path: "createdBy" } })

                await Chats.populate(updatedChat, { path: 'createdBy', select: 'avatar fullName' });

                return res.json(new ResponseModel(HTTP_CODES.OK, 'Chỉnh sửa tin nhắn thành công!', updatedChat));
            }
            else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.FORBIDDEN, 'Chỉ chủ sỡ hữu được phép sửa tin nhắn', null));
            }
        }
        catch (error) {
            console.log(error)
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Không tìm thấy tin nhắn này", error));
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

//body
// {
//     chatId: ObjectId,
//     roomId: ObjectId
// }
async function pinChat(req, res) {
    const session = await mongoose.startSession()
    await session.startTransaction()
    try {
        if (req.actions.includes(chatActions.pinChat) || req.isSuperAdmin) {
            if (isValidObjectId(req.body.roomId) && isValidObjectId(req.body.chatId)) {

                let room = await Rooms.findById(req.body.roomId)
                let chat = await Chats.findById(req.body.chatId)

                const existedPin = room.pinedChats.find(i => i._id.toString() === chat._id.toString())

                if (existedPin) {

                    // removed pin chat:

                    const newPinedChats = room.pinedChats.filter(i => i._id.toString() !== chat._id.toString())
                    room.pinedChats = newPinedChats

                    await room.save()

                    await session.commitTransaction();
                    return res.json(new ResponseModel(HTTP_CODES.OK, 'Gim đã bị hủy', { room }))
                }

                room.pinedChats.push(chat)

                await room.save()
                await session.commitTransaction();
                res.json(new ResponseModel(httpCodes.success, 'Gim tin nhắn thành công', { room, chat }))
            }
        } else return res.status(200).json(new ResponseModel(HTTP_CODES.FORBIDDEN, "Không được phép", null))
    } catch (err) {

    }
}

//params.id
async function deleteChat(req, res) {
    if (req.actions.includes(chatActions.deleteChat) || req.isSuperAdmin) {
        try {
            let chat = await Chats.findById(req.params.id);
            if (!chat) {
                res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'Không tìm thấy tin nhắn này', null));
            }
            else {
                if (chat.createdBy == req.userId || req.isSuperAdmin) {
                    chat.isDeleted = true;
                    let deletedChat = await chat.save();
                    res.json(new ResponseModel(httpCodes.success, 'Xóa tin nhắn thành công', deletedChat));
                }
                else {
                    return res.status(200).json(new ResponseModel(HTTP_CODES.FORBIDDEN, "Chỉ chủ sở hữu được phép xóa tin nhắn", null))
                }
            }
        } catch (error) {
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

// @method: POST, body: [id1, id2, id3]
async function deleteManyChat(req, res) {
    if (req.actions.includes(chatActions.deleteChat) || req.isSuperAdmin) {
        try {
            if (Array.isArray(req.body.ids)) {
                const filter = { _id: { $in: req.body.ids } }
                const updater = { $set: { isDeleted: true } }
                await Chats.updateMany(filter, updater)
                return res.status(200).json(new ResponseModel(200, "Success deleted", req.body.ids))
            } else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, "Can not deleted, your ids is not valid", req.body.ids))
            }
        } catch (err) {
            console.log(err)
            return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, "Can not deleted", req.body.ids))
        }
    } else {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
    }
}

//params.id
async function forceDeleteChat(req, res) {
    if (req.actions.includes(chatActions.forceDeleteChat)) {
        try {
            if (isValidObjectId(req.params.id)) {
                let deletedChat = await Chats.findByIdAndDelete(req.params.id);
                if (!deletedChat) {
                    res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'No item found!', null));
                }
                else {
                    res.json(new ResponseModel(httpCodes.success, 'Delete chat success!', null));
                }
            }
            else {
                res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'Id is invalid', null))
            }
        } catch (error) {
            res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

//params.roomId
//query.oldLimit
//query.newLimit
//query.chatId
async function getChats(req, res) {

    try {
        if (isValidObjectId(req.params.roomId)) {
            const roomUser = await RoomUsers.findOne({ user: req.userId, room: req.params.roomId }).populate({ path: "actions", select: "actionName" })

            const roomActions = roomUser?.actions?.map(a => a.actionName)

            if (roomUser && roomActions.includes(chatActions.getChats)) {
                let totalRecords = (await Chats.find({ room: req.params.roomId, isDeleted: false })).length;
                const oldChatLimit = req.query.oldLimit || 200;
                const newChatLimit = req.query.newLimit || 200;
                if (req.query.chatId) {
                    if (isValidObjectId(req.query.chatId)) {
                        let chat = await Chats.findById(req.query.chatId)
                            .populate({ path: 'createdBy', select: 'avatar fullName' })
                            .populate({
                                path: 'replyTo', populate: {
                                    path: 'createdBy',
                                    select: 'avatar fullName'
                                }
                            })
                            .populate({ path: 'forwardedFrom', select: 'avatar fullName' });

                        if (chat) {
                            let date = new Date(chat.createdTime);

                            let newChats = await Chats.find({ room: req.params.roomId, isDeleted: false, createdTime: { $gt: date } })
                                .limit(newChatLimit)
                                .populate({ path: 'createdBy', select: 'avatar fullName' })
                                .populate({
                                    path: 'replyTo', populate: {
                                        path: 'createdBy',
                                        select: 'avatar fullName'
                                    }
                                })
                                .populate({ path: 'forwardedFrom', select: 'avatar fullName' })
                                .sort({ createdTime: 'desc' });

                            let oldChats = await Chats.find({ room: req.params.roomId, isDeleted: false, createdTime: { $lt: date } })
                                .limit(oldChatLimit)
                                .populate({ path: 'createdBy', select: 'avatar fullName' })
                                .populate({
                                    path: 'replyTo', populate: {
                                        path: 'createdBy',
                                        select: 'avatar fullName'
                                    }
                                })
                                .populate({ path: 'forwardedFrom', select: 'avatar fullName' })
                                .sort({ createdTime: 'desc' });

                            oldChats.push(chat);

                            let chats = oldChats.concat(newChats);
                            return res.status(200)
                                .json(new ResponseModel(HTTP_CODES.OK, "OK", { totalRecords: totalRecords, chats: chats }))
                        }
                        else {
                            let chats = await Chats.find({ room: req.params.roomId, isDeleted: false })
                                .populate({ path: 'createdBy', select: 'avatar fullName' })
                                .populate({
                                    path: 'replyTo', populate: {
                                        path: 'createdBy',
                                        select: 'avatar fullName'
                                    }
                                })
                                .populate({ path: 'forwardedFrom', select: 'avatar fullName' })
                                .sort({ createdTime: 'desc' });

                            return res.status(200)
                                .json(new ResponseModel(HTTP_CODES.OK, "OK", { totalRecords: totalRecords, chats: chats }))
                        }
                    }
                    else {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'ChatId is not ObjectId', null))
                    }
                }
                else {
                    let otherChats = await Chats.find({ room: req.params.roomId, isDeleted: false })
                        .populate({ path: 'createdBy', select: 'avatar fullName' })
                        .populate({
                            path: 'replyTo', populate: {
                                path: 'createdBy',
                                select: 'avatar fullName'
                            }
                        })
                        .populate({ path: 'forwardedFrom', select: 'avatar fullName' })
                        .sort({ createdTime: 'desc' });

                    return res.status(200)
                        .json(new ResponseModel(HTTP_CODES.OK, "OK", { totalRecords: totalRecords, chats: otherChats }))
                }
            }
            else {
                return res.status(200)
                    .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
            }
        }
        else {
            return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'RoomId is invalid!', null));
        }
    } catch (error) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
    }

}

//params.roomId
//query.limit
async function getBeforeChats(req, res) {
    if (req.actions.includes(chatActions.getBeforeChats)) {
        if (req.query.chatId && req.params.roomId) {
            if (isValidObjectId(req.params.roomId) && isValidObjectId(req.query.chatId)) {
                const limit = req.query.limit || 200;
                let chat = await Chats.findById(req.query.chatId);
                let date = new Date(chat.createdTime);
                let beforeChats = await Chats.find({ room: req.params.roomId, isDeleted: false, createdTime: { $lt: date } })
                    .limit(parseInt(limit))
                    .populate({ path: 'createdBy', select: 'avatar fullName' })
                    .populate({
                        path: 'replyTo', populate: {
                            path: 'createdBy',
                            select: 'avatar fullName'
                        }
                    })
                    .populate({ path: 'forwardedFrom', select: 'avatar fullName' })
                    .sort({ createdTime: 'desc' });
                return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", beforeChats))
            }
            else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'ChatId or roomId is not ObjectId', null));
            }
        }
        else {
            return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'ChatId or roomId is null or empty', null));
        }
    }
    else {
        return res.status(200).json(new ResponseModel(HTTP_CODES.FORBIDDEN, 'FORBIDDEN', null));
    }
}

//params.roomId
//query.limit
async function getAfterChats(req, res) {
    if (req.actions.includes(chatActions.getAfterChats)) {
        if (req.query.chatId && req.params.roomId) {
            if (ObjectId.isValid(req.params.roomId) && ObjectId.isValid(req.query.chatId)) {
                const limit = req.query.limit || 200;
                let chat = await Chats.findById(req.query.chatId);
                let date = new Date(chat.createdTime);
                let afterChats = await Chats.find({ room: req.params.roomId, isDeleted: false, createdTime: { $gt: date } })
                    .limit(parseInt(req.query.limit))
                    .populate({ path: 'createdBy', select: 'avatar fullName' })
                    .populate({
                        path: 'replyTo', populate: {
                            path: 'createdBy',
                            select: 'avatar fullName'
                        }
                    })
                    .populate({ path: 'forwardedFrom', select: 'avatar fullName' })
                    .sort({ createdTime: 'desc' });
                return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", afterChats))
            }
            else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'ChatId or roomId is not ObjectId', null));
            }
        }
        else {
            return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'ChatId or roomId is not ObjectId', null));
        }
    }
    else {
        return res.status(200).json(new ResponseModel(HTTP_CODES.FORBIDDEN, 'FORBIDDEN', null));
    }
}

//query.message
//query.roomId
async function searchChats(req, res) {
    if (req.actions.includes(chatActions.searchChats) || req.isSuperAdmin) {
        if (req.query.message && req.query.roomId) {
            let chats = await Chats.find({
                message: { $regex: '.*' + req.query.message + '.*' },
                room: req.query.roomId,
                isDeleted: false
            })
                .populate({ path: 'createdBy', select: 'avatar fullName' })
                .populate({
                    path: 'replyTo', populate: {
                        path: 'createdBy',
                        select: 'avatar fullName'
                    }
                })
                .populate({ path: 'forwardedFrom', select: 'avatar fullName' })
                .sort({ createdTime: 'desc' });
            return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", chats));
        } else {
            return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Message or roomId is null or empty', null));
        }
    } else {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
    }
}

//params.id
async function getChatById(req, res) {

    try {
        if (req.actions.includes(chatActions.getChatById) || req.isSuperAdmin) {
            if (isValidObjectId(req.params.id)) {
                let chat = await Chats.findById(req.params.id);
                if (!chat) return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, 'Chat Is Not Found', null));
                return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", chat))
            }
            else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Id is invalid', null));
            }
        }
        else {
            return res.status(200)
                .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
        }
    } catch (error) {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", null));
    }
}

//query.pageIndex
//query.pageSize
//query.room
//query.message
//query.orderBy
async function getPagingChats(req, res) {
    //if (req.actions.includes(chatActions.getPagingChats)) {
    let pageSize = req.query.pageSize || 100;
    let pageIndex = req.query.pageIndex || 1;

    let searchObj = {}

    if (req.query.room) {
        searchObj = {
            room: req.query.room
        }
    }

    if (req.query.message) {
        searchObj = {
            ...searchObj,
            message: { $regex: '.*' + req.query.message + '.*' }
        }
    }

    if (req.query.room) {
        // const room = await Rooms.findById(req.query.room)
        // if (!room) return res.status(404)
        // room.unseenBy = room.unseenBy.filter(i => i.toString() !== req.userId)
        // await room.save()
    }

    try {
        let chats = await Chats
            .find(searchObj)
            .skip((pageSize * pageIndex) - pageSize)
            .limit(parseInt(pageSize))
            .sort({
                createdTime: req.query.orderBy ?? 'desc'
            })
            .populate({ path: 'createdBy', select: 'avatar fullName' })
            .populate({
                path: 'replyTo', populate: {
                    path: 'createdBy',
                    select: 'avatar fullName'
                }
            })
            .populate({ path: 'reactions', select: "createdBy createdTime emoji", populate: { path: "createdBy", select: "_id username fullName" } })
            .populate({ path: 'forwardedFrom', select: 'avatar fullName' });
        let count = await Chats.find(searchObj).countDocuments();
        let totalPages = Math.ceil(count / pageSize);
        let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, chats, count);
        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", { ...pagedModel }));
    } catch (error) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
    }
    //} else {
    //    return res.status(200)
    //        .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
    //}
}

exports.createChat = createChat;
exports.updateChat = updateChat;
exports.pinChat = pinChat;
exports.deleteChat = deleteChat;
exports.forceDeleteChat = forceDeleteChat;
exports.getChatById = getChatById;
exports.getChats = getChats;
exports.getBeforeChats = getBeforeChats;
exports.getAfterChats = getAfterChats;
exports.searchChats = searchChats;
exports.getPagingChats = getPagingChats;
exports.deleteManyChat = deleteManyChat;