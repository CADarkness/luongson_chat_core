const RoomUsers = require('../../database/entities/room/RoomUsers');
const Actions = require('../../database/entities/authentication/Actions');
const { roomUserActions } = require('../../utilities/actions');
const { httpCodes, roomRoles } = require('../../utilities/constants');
const PagedModel = require('../models/PagedModel');
const ResponseModel = require('../models/ResponseModel');
const JoinRoomRequests = require('../../database/entities/room/JoinRoomRequests')
const Rooms = require('../../database/entities/room/Rooms');
const { default: mongoose } = require('mongoose');
const PinedChats = require('../../database/entities/chat/PinedChats');
const Users = require('../../database/entities/authentication/Users');
const HTTP_CODES = require('../../utilities/httpCodes');
const { Request, Response } = require("express");
const NotifyItem = require('../../database/entities/Notifies/NotifyItem');

//body
// {
//     userId: ObjectId,
//     roomId: ObjectId
// }
async function createRoomUser(req, res) {
    if (req.actions.includes(roomUserActions.createRoomUser)) {
        const session = await mongoose.startSession();
        await session.startTransaction();

        try {
            let existed = await RoomUsers.findOne({ room: req.body.roomId, user: req.body.userId });
            if (existed) {
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Người dùng đã ở trong phòng này', null))
            }
            else {
                let roomUser = new RoomUsers({
                    user: req.body.userId,
                    room: req.body.roomId
                });

                roomUser.roomRole = roomRoles.member;
                roomUser.createdTime = Date.now();
                const roomActions = await Actions.find({ defaultRoomAction: true });

                roomUser.actions = roomActions.map(x => x._id);

                //update roomUsers for this room
                let room = await Rooms.findById(req.body.roomId);

                if (room) {
                    console.log(room)
                    room.roomUsers.push(roomUser._id);
                    await room.save();
                    await roomUser.save();

                    await session.commitTransaction();
                    return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Mời thành công', roomUser));
                } else {
                    return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, 'Mã phòng không tồn tại', null));
                }
            }
        } catch (error) {
            console.log(error)
            await session.abortTransaction();
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
        }
        finally {
            session.endSession();
        }
    }
    else {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
    }
}

// @method: post, body: { roomId }
async function createJoinRoomRequestByQRCode(req, res) {
    const session = await mongoose.startSession()
    await session.startTransaction()
    try {
        let existed = await RoomUsers.findOne({ room: req.body.roomId, user: req.userId })
        if (existed) {
            return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'You have joined this room', null))
        } else {
            const room = await Rooms.findById(req.body.roomId)
            if (!room) { return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, 'Mã phòng không tồn tại', null)) }
            const owner = room.roomOwner
            await NotifyItem.create({ 
                user: owner, 
                type: "request_join_room",
                content: JSON.stringify({ 
                    message: `Người dùng ${req.userId} đã xin vào phòng ${req.body.roomId}`,
                    userId: req.userId,
                    roomId: req.body.roomId,
                })
            })

            return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "Xin vào phòng thành công", "OK"))
        }
    } catch (error) {
        console.log(error)
        await session.abortTransaction()
        return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, error.message, error))
    } finally {
        await session.endSession()
    }
}

// @method: put, param: { joinRequestId }, body: { status }
async function updateJoinRoomRequest(req, res) {
    const session = await mongoose.startSession()
    await session.startTransaction()
    try {
        const joinRoomRequest = await JoinRoomRequests.findById(req.params.joinRequestId)
        if (joinRoomRequest.status === 2) {
            await session.commitTransaction()
            return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'This request had been approved', null))
        }
        if (joinRoomRequest.invitedFrom.toString() === req.userId) {
            joinRoomRequest.status = req.body.status
            if (req.body.status === 2) {
                let roomUser = new RoomUsers({
                    user: joinRoomRequest.createdBy,
                    room: joinRoomRequest.room
                })

                roomUser.roomRole = roomRoles.member
                roomUser.createdTime = Date.now()
                const roomActions = await Actions.find({ defaultRoomAction: true })
                roomUser.actions = roomActions.map(x => x._id)
                const newRoomUser = await roomUser.save()

                let room = await Rooms.findById(joinRoomRequest.room)
                room.roomUsers.push(newRoomUser._id)
                await room.save()
            }
            await joinRoomRequest.save()
        }

        await session.commitTransaction()
        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'OK', null))
    } catch (error) {
        1
        console.log(error)
        await session.abortTransaction()
        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'OK', null))
    } finally {
        await session.endSession()
    }
}

async function createRoomUserByList(req, res) {
    if (req.actions.includes(roomUserActions.createRoomUser)) {


    }
}

// body
// {
//     roomId: ObjectId,
//     createdTime: Date,
//     chatId: ObjectId for lastSeenMessage
// }
async function updateLastSeenMessage(req, res) {
    if (req.actions.includes('updateLastSeenMessage')) {
        try {
            let old = await RoomUsers.findOne({
                user: req.userId,
                room: req.body.roomId
            }).populate({ path: 'lastSeenMessage', select: 'createdTime' });

            if (old?.lastSeenMessage) {
                let oldDate = new Date(old.lastSeenMessage.createdTime);
                let newDate = new Date(req.body.createdTime);

                if (oldDate < newDate) {
                    old.lastSeenMessage = req.body.chatId;
                    let updatedRoomUser = await old.save();
                    return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Update SeenMessage success!', updatedRoomUser));
                }
                else {
                    return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'CreatedTime is old!', null));
                }
            }
            else {
                old.lastSeenMessage = req.body.chatId;
                let updatedRoomUser = await old.save();
                return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Update LastSeenMessage success!', updatedRoomUser));
            }
        } catch (error) {
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
        }
    }
    else {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
    }
}

//body
// {
//     title: String,
//     roomRole: Number,
//     actions: [ObjectId]
// }
async function updateRoomUser(req, res) {
    if (req.actions.includes(roomUserActions.updateRoomUser)) {
        try {
            if (req.body.roomId && req.body.userId) {
                const requestUser = await RoomUsers.findOne({ user: req.userId, room: req.body.roomId })
                    .populate({ path: 'actions', select: 'actionName' });

                if (requestUser.actions.map(x => x.actionName).includes(roomUserActions.updateRoomUser)) {
                    let newRoomUser = {
                        ...req.body,
                        updatedBy: req.userId,
                        updatedTime: Date.now()
                    }
                    let updatedRoomUser = await RoomUsers.findOneAndUpdate(
                        { user: req.body.userId, room: req.body.roomId }, newRoomUser
                    );

                    if (!updatedRoomUser) {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Không tìm thấy người dùng này', updatedRoomUser))
                    }
                    else {
                        let response = new ResponseModel(HTTP_CODES.OK, 'Chỉnh sửa thông tin thành công', updatedRoomUser)
                        return res.json(response);
                    }
                }
                else {
                    return res.status(200)
                        .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "Không được phép", null));
                }
            }
            else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'RoomId hoặc UserId không hợp lệ', null))
            }
        }
        catch (error) {
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
        }
    }
    else {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
    }
}

// body
// {
//     userId: ObjectId,
//     roomId: ObjectId
// }
async function deleteRoomUser(req, res) {

    if (req.actions.includes(roomUserActions.deleteRoomUser) || req.isSuperAdmin) {
        const session = await mongoose.startSession();
        await session.startTransaction();
        try {
            const requestUser = await RoomUsers.findOne({ user: req.body.userId, room: req.body.roomId })
                .populate({ path: 'actions', select: 'actionName' });

            if (!requestUser) {
                return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Không tìm thấy người dùng này", null));
            }

            if (requestUser.actions.map(x => x.actionName).includes(roomUserActions.deleteRoomUser) || req.isSuperAdmin) {
                
                let deletedUsersRooms = await RoomUsers.findOneAndDelete({
                    user: req.body.userId, room: req.body.roomId
                });

                if (!deletedUsersRooms) {
                    return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, "Không tìm thấy người dùng này", null));
                }
                else {
                    //update roomUser for this room
                    let room = await Rooms.findById(req.body.roomId);
                    room.roomUsers = room.roomUsers.filter(x => x.toString() !== deletedUsersRooms._id.toString());
                    await room.save();

                    await session.commitTransaction();
                    return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "Xóa người dùng thành công", deletedUsersRooms));
                }
            }
            else {
                return res.status(200)
                    .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
            }
        } catch (error) {
            await session.abortTransaction();
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
        }
        finally {
            session.endSession();
        }
    }
    else {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
    }
}

/**
 * @param {Request} req 
 * @param {Response} res
 * @input req.params.roomId
 */
async function leaveRoom(req, res) {
    const session = await mongoose.startSession();
    await session.startTransaction();
    try {
        const requestUser = await RoomUsers.findOne({ user: req.userId, room: req.params.roomId })
        if (!requestUser) {
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Không tìm thấy", null));
        }

        const deletedUsersRooms = await RoomUsers.findOneAndDelete({ room: req.params.roomId, user: req.userId })

        //update roomUser for this room
        let room = await Rooms.findById(req.params.roomId);
        room.roomUsers = room.roomUsers.filter(x => x.toString() !== deletedUsersRooms._id.toString());
        await room.save();

        await session.commitTransaction();
        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Đã ra khỏi phòng', { _id: deletedUsersRooms._id, room: deletedUsersRooms.room }));
    } catch (err) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, err.message, err));
    }
}

// query
// roomId: ObjectId
async function getPagingRoomUsers(req, res) {
    // if (req.actions.includes(roomUserActions.getPagingRoomUsers)) {
        let pageSize = req.query.pageSize || 10;
        let pageIndex = req.query.pageIndex || 1;

        let searchObj = {}

        if (req.query.roomId) {
            searchObj = {
                room: req.query.roomId
            }
        }

        try {
            let usersRooms = await RoomUsers
                .find(searchObj)
                .skip((pageSize * pageIndex) - pageSize)
                .limit(parseInt(pageSize))
                .sort({
                    createdTime: 'desc'
                }).populate({ path: "user", select: "-password" })
            
            let count = await RoomUsers.find(searchObj).countDocuments();
            let totalPages = Math.ceil(count / pageSize);
            let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, usersRooms);
            return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", pagedModel));
        } catch (error) {
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
        }
    //}
    // else {
    //     return res.status(200)
    //         .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
    // }
}

// @method: GET; param: { userId }
async function getJoinedRoomByUserId(req, res) {

    try {
        const userRooms = await RoomUsers.find({ user: req.params.userId }).populate("room")

        return res.status(200).json(userRooms)
    } catch (err) {
        console.log(err)
        res.status(500)
    }
}

//params.id
async function getRoomUserById(req, res) {

    try {
        if (req.actions.includes(roomUserActions.getRoomUserById) || req.isSuperAdmin) {
            let roomUser = await RoomUsers.findById(req.params.id);
            return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", roomUser));
        }
        else {
            return res.status(200)
                .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
        }
    } catch (error) {
        console.log(error)
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.BAD_GATEWAY, "BAD_GATEWAY", null)); F
    }
}

//check whether user has joined room
async function getRoomUserByRoomId(req, res) {
    try {
        const roomUsers = await RoomUsers.findOne({ room: req.params.roomId, user: req.userId })
            .populate({ path: "room actions", select: "roomName pinedChats roomType lastMessage actionName" })

        if (roomUsers) {

            // const pinnedChats = await PinedChats.find({ '_id': { $in: roomUsers.room.pinedChats } }).populate({ path: "chat", select: "message" })
            // roomUsers.room.pinedChats = pinnedChats

            return res.status(200)
                .json(
                    new ResponseModel(
                        HTTP_CODES.OK,
                        'This is room data which you joined',
                        { room: roomUsers.room, actions: roomUsers.actions.map(action => action.actionName) }
                    )
                );
        } else {
            return res.status(200)
                .json(
                    new ResponseModel(
                        HTTP_CODES.BAD_REQUEST,
                        'Không thể lấy dữ liệu khi chưa vào phòng',
                        null
                    )
                );
        }
    } catch (error) {
        return res.status(200)
            .json(
                new ResponseModel(
                    HTTP_CODES.NOT_FOUND,
                    error.message,
                    null
                )
            );
    }
}

// @PUT body: { userId, roomId }
async function banChat(req, res) {
    try {
        const { userId, roomId } = req.body
        const room = await Rooms.findById(roomId)

        if (!room) return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Phòng không hợp lệ", null))

        if (room.bannedUsers.map(i=> i.toString()).includes(userId)) {
            // un ban
            room.bannedUsers = room.bannedUsers.filter(i => i.toString() !== userId)
            await room.save()
            return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "Hủy cấm thành viên này thành công", room.bannedUsers))
        } else {
            room.bannedUsers.push(userId)
            await room.save()
            return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "Cấm thành viên này thành công", room.bannedUsers))
        }
    } catch(error) {
        console.log(error)
        return res.status(200).json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", null))
    }
}

async function findUsersByRoomIds(req, res) {
    try {
        const roomIds = req.query.roomIds.split(",").map(item => item.trim())
        const found = await RoomUsers.find({ room: { $in: roomIds } }).populate({
            path: "user"
        })
        return res.status(200).json(found)
    } catch(error) {

    }
}

exports.banChat = banChat;
exports.createRoomUser = createRoomUser;
exports.updateRoomUser = updateRoomUser;
exports.updateLastSeenMessage = updateLastSeenMessage;
exports.deleteRoomUser = deleteRoomUser;
exports.getPagingRoomUsers = getPagingRoomUsers;
exports.getRoomUserById = getRoomUserById;
exports.getJoinedRoomByUserId = getJoinedRoomByUserId;
exports.getRoomUserByRoomId = getRoomUserByRoomId;
exports.createJoinRoomRequestByQRCode = createJoinRoomRequestByQRCode
exports.updateJoinRoomRequest = updateJoinRoomRequest
exports.leaveRoom = leaveRoom
exports.findUsersByRoomIds = findUsersByRoomIds