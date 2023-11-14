const Rooms = require('../../database/entities/room/Rooms');
const PagedModel = require('../models/PagedModel');
const ResponseModel = require('../models/ResponseModel');
const { roomRoles, httpCodes, roomTypes } = require('../../utilities/constants');
const { isValidObjectId, default: mongoose } = require('mongoose');
const { roomActions } = require('../../utilities/actions');
const RoomUsers = require('../../database/entities/room/RoomUsers');
const Actions = require('../../database/entities/authentication/Actions');
const HTTP_CODES = require('../../utilities/httpCodes');
const Chats = require('../../database/entities/chat/Chats');
const { uuid } = require('uuidv4');
const Users = require('../../database/entities/authentication/Users');

//body
// {
//     roomOwner: ObjectId,
//     roomName: String,
//     roomIcon: String,
//     roomType: Number,
//     roomUsers: [ObjectId]
// }
async function createRoom(req, res) {
    const session = await mongoose.startSession();
    await session.startTransaction();
    try {

        let room = new Rooms({ roomName: req.body.roomName, roomType: req.body.roomType });
        room.roomOwner = req.userId;
        if (req.body.key) {
            room.key = req.body.key
        } else {
            room.key = uuid()
        }
        if (req.body.roomIcon) {
            room.roomIcon = req.body.roomIcon
        }
        room.createdTime = Date.now();
        room.isActive = true;
        // let newRoom = await room.save();

        const actions = await Actions.find({ isRoomAction: true });

        await room.save()

        if (room) {
            const actionsList = actions.map(action => action._id.toString())
            let roomUser = await RoomUsers.create({
                user: req.userId,
                room: room._id,
                roomRole: roomRoles.owner,
                actions: actionsList,
                createdTime: Date.now()
            })
            await Users.findByIdAndUpdate(req.userId, {
                $push: {
                    rooms: room._id
                }
            })

            room.roomUsers.push(roomUser._id)
        }

        await room.populate({ path: "roomOwner" })

        const parsedRoomUsers = req.body.roomUsers ? JSON.parse(req.body.roomUsers) : null

        await room.save();

        if (parsedRoomUsers && parsedRoomUsers.length > 0) {
            // add hang loat members
            await Users.updateMany({
                _id: { $in: parsedRoomUsers }
            }, { $push: { rooms: room._id } })

            let roomMembers = []
            parsedRoomUsers.forEach(userId => {
                roomMembers.push({
                    room: room._id,
                    user: userId,
                    roomRole: roomRoles.member,
                    actions: [...actions].filter(i => i.defaultRoomAction).map(i => i._id)
                })
            })
            if (roomMembers.length > 0) {
                await RoomUsers.insertMany(roomMembers);
            }
        }

        const userrooms = await RoomUsers.find({ room: room._id })

        room.roomOwner.password = ""

        room.roomUsers = userrooms.map(i => i._id)

        console.log(room.roomUsers)

        const customRoomUsers = userrooms.map(i => i.user)

        await room.save()
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Tạo phòng thành công', { ...room._doc, users: customRoomUsers }));
    } catch (error) {
        console.log(error)
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
    } finally {
        session.endSession();
    }
}


async function updateRoom(req, res) {
    //check user have permission to update rooms in global
    if (req.actions.includes(roomActions.updateRoom) || req.isSuperAdmin) {
        try {

            if (req.isSuperAdmin) {
                let newRoom = {
                    ...req.body,
                    updatedTime: Date.now(),
                    updatedBy: req.userId
                }
                let updatedRoom = await Rooms.findByIdAndUpdate(req.params.id, newRoom);

                if (!updatedRoom) {
                    return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Không tìm thấy phòng', null));
                }
                else {
                    return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Thay đổi thông tin thành công', newRoom));
                }
            }

            let roomUser = await RoomUsers.findOne({ room: req.params.id, user: req.userId }).populate({ path: 'actions', select: 'actionName' });
            //check user have permission to update rooms in a room
            if (roomUser.roomRole === roomRoles.owner) {
                let newRoom = {
                    ...req.body,
                    updatedTime: Date.now(),
                    updatedBy: req.userId
                }
                let updatedRoom = await Rooms.findByIdAndUpdate(req.params.id, newRoom);
                if (!updatedRoom) {
                    return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, "Không tìm thấy phòng", null));
                }
                else {
                    return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Thay đổi thông tin thành công', newRoom));
                }
            } else {
                return res.status(200)
                    .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "Không được phép", null));
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

async function deleteRoom(req, res) {

    if (req.actions.includes(roomActions.deleteRoom || req.isSuperAdmin)) {
        try {
            let room = await Rooms.findById(req.params.id);

            if (!room) return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Không tìm thấy phòng", null));

            if (room.roomOwner == req.userId || req.isSuperAdmin) {

                await Chats.deleteMany({ room: room._id })

                let deletedRoom = await Rooms.findByIdAndDelete(room._id)

                if (!deletedRoom) {
                    return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, "Không tìm thấy phòng", null));
                }
                else {
                    //Delete all members in room
                    await RoomUsers.deleteMany({ room: req.params.id })
                    return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Xóa phòng thành công', null));
                }

            }
            else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.FORBIDDEN, "Chỉ chủ sở hữu được phép xóa phòng", null))
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

async function getAllRoom(req, res) {
    try {
        if (req.actions.includes(roomActions.getPagingRooms) || req.isSuperAdmin) {

            let searchObj = {}

            if (req.query.user) {
                searchObj = {
                    ...searchObj,
                    roomUsers: { $in: req.query.user }
                }
            }

            if (req.query.roomName) {
                searchObj = {
                    ...searchObj,
                    roomName: { $regex: '.*' + req.query.roomName + '.*' }
                }
            }

            if (req.query.roomType) {
                searchObj = {
                    ...searchObj,
                    roomType: req.query.roomType
                }
            }
            let rooms = await Rooms
                .find(searchObj)
                .populate({
                    path: 'roomUsers lastMessage',
                    select: 'user isDeleted username message type createdBy createdTime lastModified',
                }).populate({
                    path: 'roomOwner',
                    select: '-password -rooms'
                })
                .sort({
                    createdTime: 'desc'
                })

            return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", rooms));
        } else res.status(200).json(new ResponseModel(HTTP_CODES.FORBIDDEN, "Không có quyền", null))
    } catch (error) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, null));
    }
}

async function getPagingRooms(req, res) {
    if (req.actions.includes(roomActions.getPagingRooms) || req.isSuperAdmin) {
        let pageSize = req.query.pageSize || 10;
        let pageIndex = req.query.pageIndex || 1;

        let searchObj = {}

        if (req.query.user) {
            searchObj = {
                ...searchObj,
                roomUsers: { $in: req.query.user }
            }
        }

        if (req.query.roomName) {
            searchObj = {
                ...searchObj,
                roomName: { $regex: '.*' + req.query.roomName + '.*' }
            }
        }

        if (req.query.roomType) {
            searchObj = {
                ...searchObj,
                roomType: req.query.roomType
            }
        }

        try {
            let rooms = await Rooms
                .find(searchObj)
                .skip((pageSize * pageIndex) - pageSize)
                .limit(parseInt(pageSize))
                .populate({
                    path: 'roomOwner', select: '-password -rooms -createdTime -updatedTime'
                }).populate({ path: "lastMessage", populate: { path: "createdBy", select: "-password" } })
                .populate({
                    path: 'roomUsers', select: '-room -actions -roomRole -createdTime', populate: {
                        path: 'user', select: '-status -role -phoneNumber -isOnline -bio -lastLogin -bufa -password -rooms -lastLogin -updatedTime -createdTime'
                    }
                })
                .sort({
                    createdTime: 'desc'
                });
            let count = await Rooms.find(searchObj).countDocuments();
            let totalPages = Math.ceil(count / pageSize);
            let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, rooms, count);
            return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", { ...pagedModel }));
        } catch (error) {
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
        }
    }
    else {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
    }
}

async function getPersonalRoom(req, res) {
    if (req.actions.includes(roomActions.getPersonalRoom) || req.isSuperAdmin) {
        if (req.params.userId) {
            if (isValidObjectId(req.params.userId)) {
                try {
                    const personalRoom = await Rooms.findOne({
                        roomUsers: { $all: [req.params.userId, req.userId] },
                        roomType: roomTypes.personal
                    });

                    if (personalRoom) {
                        res.json(personalRoom);
                    }
                    else {
                        const newRoom = new Rooms({
                            roomOwner: req.userId,
                            roomName: 'personal room',
                            roomType: roomTypes.personal,
                            createdTime: Date.now(),
                            roomUsers: [req.params.userId, req.userId]
                        });
                        const savedRoom = await newRoom.save();
                        res.json(savedRoom);
                    }
                } catch (error) {
                    res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
                }
            }
            else {
                res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'UserId is not ObjectId', null))
            }
        }
        else {
            res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'UserId is null', null))
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

async function getRoomById(req, res) {
    try {
        if (req.params.id) {
            if (isValidObjectId(req.params.id)) {
                let room = await Rooms.findById(req.params.id).populate({
                    path: 'roomUsers',
                    select: 'user roomRole',
                    populate: {
                        path: 'user',
                        select: 'avatar fullName'
                    }
                });
                return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "Lấy dữ liệu thành công", room))
            }
            else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Mã phòng không hợp lệ', null))
            }
        }
        else {
            return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Chưa truyền lên mã phòng', null));
        }
    } catch(error) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, error.message, null));
    }

}

//get list joined room by user's token
async function getRoomsByToken(req, res) {
    try {

        let pageSize = req.query.pageSize || 10;
        let pageIndex = req.query.pageIndex || 1;

        let searchObj = {
            user: req.userId
        }

        if (req.query.roomName) {
            searchObj = {
                ...searchObj,
                room: await Rooms.findOne({ roomName: { $regex: ".*" + req.query.roomName + ".*" } })
            }
        }

        if (req.query.roomType) {
            searchObj = {
                ...searchObj,
                room: await Rooms.findOne({ roomType: Number(req.query.roomType) })
            }
        }

        const joinedRooms = await RoomUsers.find(searchObj).populate({
            path: 'room',
            select: 'roomOwner._id roomName roomIcon roomType lastMessage',
            populate: {
                path: 'lastMessage',
                select: 'username message isDeleted lastModified chat createdBy file',
                populate: {
                    path: 'createdBy', select: "-password"
                }
            }
        })
        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", joinedRooms.map(x => x.room)));
    } catch (error) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error))
    }
}

async function setSeenMessage(req, res) {
    try {
        const room = await Rooms.findById(req.params.roomId)
        if (!room) return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Không tìm thấy phòng này", null))
        room.unseenBy = room.unseenBy.filter(id => id.toString() !== req.userId)
        await room.save()

        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", null))
    } catch (err) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Không tìm thấy phòng này", null))
    }
}

async function findPrivateRoom(req, res) {
    try {
        const room = await Rooms.findOne({ key: req.params.key })
        if (room) {
            // room is existed

            await room.populate({
                path: 'lastMessage',
                select: 'username message isDeleted lastModified chat createdBy',
                populate: {
                    path: 'createdBy',
                    select: '_id username'
                }
            })

            return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", room))
        } else {
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Not existed", null))
        }
    } catch (error) {

    }
}

// @method: post; body: { bufa: string }
async function createPrivateRoomWithBufa(req, res) {
    try {
        const userWithBufa = await Users.findOne({ bufa: req.body.bufa })
        if (!userWithBufa) return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Mã bufa không hợp lệ", null))
        const privateKeyA = `${req.userId}-${userWithBufa._id.toString()}`
        const privateKeyB = `${userWithBufa._id.toString()}-${req.userId}`

        const findRoomByPrivateKeyA = await Rooms.findOne({ key: privateKeyA })
        const findRoomByPrivateKeyB = await Rooms.findOne({ key: privateKeyB })

        if (!findRoomByPrivateKeyA && !findRoomByPrivateKeyB) {
            const newRoom = await Rooms.create({
                roomName: `Chat với ${userWithBufa.fullName}`,
                roomType: 0,
                key: privateKeyA,
                roomOwner: req.userId
            })
            // create room users
            const roomUserA = await RoomUsers.create({ user: req.userId, room: newRoom._id })
            const roomUserB = await RoomUsers.create({ user: userWithBufa._id, room: newRoom._id })
            newRoom.roomUsers = [roomUserA._id, roomUserB._id]
            await newRoom.save()
            return res.status(200).json(new ResponseModel(200, "Tạo thành công", newRoom))
        } else {
            return res.status(200).json(new ResponseModel(200, "Không thể tạo vì bạn đã kết nối với người dùng này", findRoomByPrivateKeyA ?? findRoomByPrivateKeyB))
        }

    } catch (error) {
        return res.status(200).json(new ResponseModel(404, error.message, null))
    }
}

// @method: post; body: { userId, roomIds }
async function insertUserToManyRoom(req, res) {
    try {
        const actions = await Actions.find({ isRoomAction: true })
        const user = await Users.findById(req.body.userId)

        if (!user) throw new Error("Không tìm thấy user")

        const roomIds = req.body.roomIds // JSON.parse(req.body.roomIds)

        const existed = await RoomUsers.find({ room: { $in: roomIds } })
        const existedMapped = existed.map(i => i.user)

        if (existedMapped.includes(req.body.userId)) {
            return res.status(200).json(new ResponseModel(200, "Người dùng đã tồn tại ở 1 trong các phòng này", existed))
        }

        const roomUserCreator = roomIds.map(item => ({
            user: req.body.userId,
            room: item,
            actions: actions.map(item => item._id)
        }))
        await RoomUsers.insertMany(roomUserCreator)

        const roomUserFound = await RoomUsers.find({ user: req.body.userId })

        for (let x = 0; x < roomUserFound.length; x++) {
            await Rooms.findByIdAndUpdate(roomUserFound[x].room, {
                $push: {
                    roomUsers: roomUserFound[x]._id.toString()
                }
            })
        }

        const roomUserMap = await RoomUsers.find({ room: { $in: roomIds } })

        return res.status(200).json(new ResponseModel(200, "Thanh cong", roomUserMap))
    } catch (error) {
        return res.status(200).json(new ResponseModel(404, error.message, error))
    }
}

exports.createRoom = createRoom;
exports.updateRoom = updateRoom;
exports.deleteRoom = deleteRoom;
exports.getPagingRooms = getPagingRooms;
exports.getRoomById = getRoomById;
exports.getPersonalRoom = getPersonalRoom;
exports.getRoomsByToken = getRoomsByToken;
exports.findPrivateRoom = findPrivateRoom;
exports.getAllRoom = getAllRoom
exports.setSeenMessage = setSeenMessage
exports.createPrivateRoomWithBufa = createPrivateRoomWithBufa
exports.insertUserToManyRoom = insertUserToManyRoom