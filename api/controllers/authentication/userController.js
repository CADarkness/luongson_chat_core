const crypto = require('crypto');
const ResponseModel = require('../../models/ResponseModel');
const PagedModel = require('../../models/PagedModel');
const jwt = require('jsonwebtoken');
const { isValidObjectId } = require('mongoose');
const Users = require('../../../database/entities/authentication/Users');
const Rooms = require('../../../database/entities/room/Rooms');
const RoomUsers = require('../../../database/entities/room/RoomUsers');
const SECRET_KEY = process.env.SECRET_KEY;
const mongoose = require('mongoose');
const NotifyList = require("../../../database/entities/Notifies/NotifyList")
const { roomTypes, roomRoles, userStatuses, httpCodes, roleNames } = require('../../../utilities/constants');
const Roles = require('../../../database/entities/authentication/Roles');
const { userActions, chatActions } = require('../../../utilities/actions');
const Actions = require('../../../database/entities/authentication/Actions');
const HTTP_CODES = require('../../../utilities/httpCodes');
const Chats = require('../../../database/entities/chat/Chats');
const bufaGenerator = require("../../../utilities/bufaGenerator")
require("dotenv").config();

//body
// {
//     username: String,
//     password: String
// }
async function login(req, res) {
    try {
        let user = await Users.findOne({ username: req.body.username }, { friends: 0, gifs: 0 }).populate({ path: 'role', select: 'roleName' });
        if (user) {
            user.lastLogin = Date.now()
            await user.save()
            if (user.status === 1) {
                if (user.password == crypto.createHash('sha256', SECRET_KEY).update(req.body.password).digest('hex')) {
                    user.password = '';
                    const token = await jwt.sign({ user, }, SECRET_KEY, { expiresIn: '240h' });
                    let expiredAt = new Date(new Date().setHours(new Date().getHours() + 240));
                    return res.status(200)
                        .json(new ResponseModel(HTTP_CODES.OK, 'Thành công!', { user: user, token: token, expiredAt: expiredAt }));
                }
                else {
                    return res.status(200)
                        .json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Mật khẩu đã sai, xin thử lại!', null));
                }
            }
            else {
                return res.status(200)
                    .json(new ResponseModel(HTTP_CODES.FORBIDDEN, 'Tài khoản đã bị khóa', null))
            }
        }
        else {
            return res.status(200)
                .json(new ResponseModel(HTTP_CODES.NOT_FOUND, 'Tài khoản không tồn tại', null))
        }
    } catch (error) {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error))
    }
}

//body
// {
//     username: String,
//     password: String,
//     fullName: String,
//     role: ObjectId,
//     roomId: ObjectId (optional)
// }
async function insertUser(req, res) {
    if (req.actions.includes(userActions.insertUser || req.isSuperAdmin)) {
        const session = await mongoose.startSession();
        await session.startTransaction();
        try {

            if (req.body.username.length < 6) return res.status(200).json(new ResponseModel(400, "Tên tài khoản phải nhiều hơn 6 ký tự"))
            if (req.body.password.length < 6) return res.status(200).json(new ResponseModel(400, "Mật khẩu phải nhiều hơn 6 ký tự"))
            if (req.body.fullName.length < 6) return res.status(200).json(new ResponseModel(400, "Tên đầy đủ phải nhiều hơn 6 ký tự"))
            const phoneRegex = /^(0|\+84)(9|3|5|7|8){1}[0-9]{8}$/;
            if (req.body.phoneNumber) {
                if (!phoneRegex.test(req.body.phoneNumber)) {
                    return res.status(200).json(new ResponseModel(400, "Số điện thoại không hợp lệ", null))
                }
            }

            if (req.body.username !== 'admin') {
                let existedUser = await Users.findOne({ username: req.body.username });
                if (existedUser) {
                    res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'Tài khoản đã tồn tại', null))
                }
                else {
                    let user = new Users(req.body);
                    user.createdTime = Date.now();
                    user.password = crypto.createHash('sha256', SECRET_KEY).update(user.password).digest('hex');
                    user.bio = req.body.username
                    user.bufa = bufaGenerator(6)
                    let newUser = await user.save();
                    newUser.password = '';

                    await newUser.populate({ path: "role" })

                    await NotifyList.create({ user: user._id })

                    if (req.body.roomId) {
                        //Insert this account to specific room
                        let specificRoom = {
                            room: req.body.roomId,
                            user: newUser._id,
                            roomRole: roomRoles.member,

                        }
                        let newSpecificRoom = new RoomUsers(specificRoom);
                        let room = await Rooms.findById(req.body.roomId)
                        await newSpecificRoom.save();
                        if (room) {
                            room.roomUsers.push(newSpecificRoom._id)
                            await room.save()
                        }
                    }

                    await session.commitTransaction();
                    return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Create user success!', newUser));
                }
            }
            else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Username can not be admin!', null));
            }
        } catch (error) {
            await session.abortTransaction();
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
        } finally {
            session.endSession();
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

//body
// {
//     username: String,
//     password: String,
//     fullName: String,
//     phoneNumber: String
// }
async function register(req, res) {
    const session = await mongoose.startSession();
    await session.startTransaction();
    try {
        if (req.body.username.length < 6) return res.status(200).json(new ResponseModel(400, "Tên tài khoản phải nhiều hơn 6 ký tự"))
        if (req.body.password.length < 6) return res.status(200).json(new ResponseModel(400, "Mật khẩu phải nhiều hơn 6 ký tự"))
        if (req.body.fullName.length < 6) return res.status(200).json(new ResponseModel(400, "Tên đầy đủ phải nhiều hơn 6 ký tự"))

        const phoneRegex = /^(0|\+84)(9|3|5|7|8){1}[0-9]{8}$/;
        if (req.body.phoneNumber) {
            if (!phoneRegex.test(req.body.phoneNumber)) {
                return res.status(200).json(new ResponseModel(400, "Số điện thoại không hợp lệ", null))
            }
        }

        if (req.body.username !== 'admin') {
            let existedUser = await Users.findOne({ username: req.body.username });
            if (existedUser) {
                return res.status(200)
                    .json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Tài khoản đã tồn tại', null))
            }
            else {
                const defaultRole = await Roles.findOne({ default: true });
                let user = new Users(req.body);
                user.createdTime = Date.now();
                user.password = crypto.createHash('sha256', SECRET_KEY).update(user.password).digest('hex');
                user.role = defaultRole._id;
                user.status = 1;
                user.lastLogin = Date.now()
                user.bufa = bufaGenerator(6)
                user.bio = req.body.username
                let newUser = await user.save();
                newUser.password = '';

                await NotifyList.create({ user: user._id })

                const actions = await Actions.find({ isRoomAction: true })

                await newUser.populate({ path: "role", select: "roleName" })

                if (req.body.roomId) {
                    //Insert this account to specific room
                    let specificRoom = {
                        room: req.body.roomId,
                        user: newUser._id,
                        roomRole: roomRoles.member,
                        actions: actions.map(i => i._id)
                    }

                    let newSpecificRoom = new RoomUsers(specificRoom);
                    await newSpecificRoom.save();
                }

                const token = await jwt.sign({ user }, SECRET_KEY, { expiresIn: '240h' });
                let expiredAt = new Date(new Date().setHours(new Date().getHours() + 240));

                await session.commitTransaction();
                return res.status(200)
                    .json(new ResponseModel(HTTP_CODES.OK, 'Tạo tài khoản thành công!', {
                        user: newUser, token, expiredAt
                    }))
            }
        }
        else {
            return res.status(200)
                .json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Không thể là admin!', null));
        }
    } catch (error) {
        console.log(error)
        await session.abortTransaction();
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
    } finally {
        session.endSession();
    }
}

// @GET > query: { pageSize, pageIndex, username, fullName, phoneNumber, email, isAdmin }
async function getPagingUsers(req, res) {
    try {
        if (req.actions.includes(userActions.getPagingUsers)) {
            let pageSize = req.query.pageSize || 10;
            let pageIndex = req.query.pageIndex || 1;

            let searchObj = {}

            if (req.query.username) {
                searchObj = {
                    $and: [
                        { ...searchObj },
                        { username: { $regex: ".*" + req.query.username + ".*" } }
                    ]
                }
            }
            if (req.query.fullName) {
                searchObj = {
                    ...searchObj,
                    fullName: { $regex: ".*" + req.query.fullName + ".*" }
                }
            }


            if (req.query.isAdmin == 1) {
                searchObj = {
                    ...searchObj,
                    role: await Roles.findOne({ roleName: 'SUPERADMIN' })
                }
            }
            if (req.query.isAdmin == 0) {
                searchObj = {
                    ...searchObj,
                    role: await Roles.findOne({ roleName: 'USER' })
                }
            }

            if (req.query.phoneNumber) {
                searchObj = {
                    ...searchObj,
                    phoneNumber: { $regex: '.*' + req.query.phoneNumber + '.*' }
                }
            }
            if (req.query.email) {
                searchObj = {
                    ...searchObj,
                    email: { $regex: '.*' + req.query.email + '.*' }
                };
            }

            let users = await Users.find(searchObj, { password: 0 })
                .skip(pageSize * pageIndex - pageSize)
                .limit(parseInt(pageSize))
                .populate({ path: 'role', select: 'roleName' })
                .sort({
                    createdTime: "desc",
                });

            let count = await Users.find(searchObj).countDocuments()
            let totalPages = Math.ceil(count / pageSize)
            let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, users, count)
            return res.status(200).json(pagedModel)

        } else {
            let pageSize = req.query.pageSize || 10;
            let pageIndex = req.query.pageIndex || 1;

            let searchObj = {}

            if (req.query.username) {
                searchObj = {
                    $and: [
                        { ...searchObj },
                        { username: { $regex: ".*" + req.query.username + ".*" } }
                    ]
                }
            }

            if (req.query.fullName) {
                searchObj = {
                    ...searchObj,
                    fullName: { $regex: ".*" + req.query.fullName + ".*" }
                }
            }

            if (req.query.phoneNumber) {
                searchObj = {
                    ...searchObj,
                    phoneNumber: { $regex: '.*' + req.query.phoneNumber + '.*' }
                }
            }
            if (req.query.email) {
                searchObj = {
                    ...searchObj,
                    email: { $regex: '.*' + req.query.email + '.*' }
                };
            }

            searchObj = {
                ...searchObj,
                role: await Roles.findOne({ roleName: 'SUPERADMIN' })
            }

            let users = await Users.find(searchObj, { password: 0 })
                .skip(pageSize * pageIndex - pageSize)
                .limit(parseInt(pageSize))
                .populate({ path: 'role', select: 'roleName' })
                .sort({
                    createdTime: "desc",
                });

            let count = await Users.find(searchObj).countDocuments()
            let totalPages = Math.ceil(count / pageSize)
            let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, users, count)
            return res.status(200).json(pagedModel)
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json(new ResponseModel(404, err.message, null))
    }
}

async function getAllUser(req, res) {
    try {
        if (req.actions.includes(userActions.getPagingUsers)) {
            let users = await Users.find()
            // let count = await Users.find().countDocuments()
            return res.status(200).json(users)
        } else {
            return res.status(403)
        }
    } catch (error) {
        return res.status(500)
    }
}

// @GET > 
async function getListOfAdmin(req, res) {
    try {
        const admins = await Users.find({
            role: await Roles.findOne({ roleName: "SUPERADMIN" })
        }, { password: 0 })
        return res.status(200).json(new ResponseModel(200, "OK", admins))
    } catch (error) {
        console.log(error)
        return res.status(200).json(new ResponseModel(404, "Không tìm thấy", null))
    }
}

// params.id
async function getUserById(req, res) {

    try {
        let user = await Users.findOne({ _id: req.params.id, status: { $ne: userStatuses.deleted } })
            .populate({
                path: 'role', populate: {
                    path: "actions"
                }
            });

        if (!user) return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "Tài khoản đã bị khóa", null));

        user.password = '';
        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", user));
    } catch (error) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
    }
}

async function getUserByToken(req, res) {

    try {
        if (req.userId) {
            let user = await Users.findById(req.userId).populate({
                path: 'role',
                select: 'roleName',
                populate: {
                    path: "actions"
                }
            });
            if (user) {
                delete user.password
                console.log(user)
                return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", user))
            }
            else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, 'Tài khoản đã bị khóa hoặc không tìm thấy', null))
            }

        }
        else {
            res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Token không hợp lệ', error));
        }
    } catch (error) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
    }
}

// params.id
async function deleteUser(req, res) {
    if (req.actions.includes(userActions.deleteUser) || req.isSuperAdmin) {
        if (isValidObjectId(req.params.id)) {
            try {
                await Users.findByIdAndDelete(req.params.id)
                const roomUsers = await RoomUsers.find({ user: req.params.id }).populate({ path: "room" })
                await Rooms.deleteMany({ roomOwner: req.params.id })
                await Chats.deleteMany({ createdBy: req.params.id })

                const roomIds = roomUsers.map(item => ({ _id: item._id, room: item.room._id, roomUsers: item.room.roomUsers }))

                const request = []
                for (let x = 0; x < roomIds.length; x++) {

                    console.log(roomIds[x].roomUsers)

                    request.push(Rooms.findByIdAndUpdate(
                        roomIds[x].room._id, {
                        roomUsers: roomIds[x].roomUsers.filter(o => o.toString() !== roomIds[x]._id.toString())
                    }))
                }

                // remove all personal room

                await Promise.all(request)

                const isOk = await RoomUsers.deleteMany({ user: req.params.id })
                console.log(isOk)

                return res.json(new ResponseModel(httpCodes.success, 'Thành công xóa người dùng!', null));

            } catch (error) {
                return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
            }
        }
        else {
            res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Tài khoản không tồn tại!', null));
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

//body
// {
//     password: String,
//     fullName: String,
//     phoneNumber: String,
//     status: Number,
//     role: ObjectId
// }
async function updateUser(req, res) {
    if (req.actions.includes(userActions.updateUser) || req.userId === req.params.id) {
        try {
            let newUser = { updatedTime: Date.now(), ...req.body }

            if (req.body.bufa) {
                if (req.body.bufa.length !== 6) {
                    return res.status(200).json(new ResponseModel(400, "Mã BUFA phải là 6 ký tự"))
                }
            }

            if (req?.body?.username?.length < 6) return res.status(200).json(new ResponseModel(400, "Tên tài khoản phải nhiều hơn 6 ký tự"))

            if (req?.body?.password?.length < 6) return res.status(200).json(new ResponseModel(400, "Mật khẩu phải nhiều hơn 6 ký tự"))

            if (req?.body?.fullName?.length < 6) return res.status(200).json(new ResponseModel(400, "Tên đầy đủ phải nhiều hơn 6 ký tự"))

            const phoneRegex = /^(0|\+84)(9|3|5|7|8){1}[0-9]{8}$/;

            if (req.body.phoneNumber) {
                if (!phoneRegex.test(req.body.phoneNumber)) {
                    return res.status(200).json(new ResponseModel(400, "Số điện thoại không hợp lệ", null))
                }
            }

            if (newUser.password) {
                newUser.password = crypto.createHash('sha256', SECRET_KEY).update(newUser.password).digest('hex');
            }
            let updatedUser = await Users.findOneAndUpdate({ _id: req.params.id }, newUser).populate({ path: 'role', select: 'roleName' });
            if (!updatedUser) {
                return res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, "Không tìm thấy", null));
            }
            else {
                updatedUser.password = '';
                return res.json(new ResponseModel(httpCodes.success, 'Update user success!', { _id: updatedUser._id, ...newUser }));
            }
        }
        catch (error) {
            res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

async function updateUserByToken(req, res) {
    try {

        const updateUser = await Users.findById(req.userId)

        updateUser.avatar = req.body.avatar || updateUser.avatar
        updateUser.fullName = req.body.fullName || updateUser.fullName
        updateUser.email = req.body.email || updateUser.email
        updateUser.phoneNumber = req.body.phoneNumber || updateUser.phoneNumber
        updateUser.password = updateUser.password
        updateUser.updatedTime = Date.now()
        updateUser.isOnline = req.body.isOnline || updateUser.isOnline

        if (req.body.bio) updateUser.bio = req.body.bio

        if (req.body.password) {
            updateUser.password = crypto.createHash('sha256', SECRET_KEY).update(newUser.password).digest('hex')
        }

        await updateUser.save()

        updateUser.password = ""

        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Thay đổi thông tin thành công!', updateUser))

    }
    catch (error) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error))
    }
}

// socket supporter
async function getSuperAdminIds(req, res) {
    try {
        const SUPERADMIN = await Roles.findOne({ roleName: "SUPERADMIN" })
        const admins = await Users.find({ role: SUPERADMIN._id })
        return res.json(admins.map(user => user._id))
    } catch (err) {
        console.log(err)
    }
}

async function changeBufaByToken(req, res) {
    try {
        const user = await Users.findById(req.query.userId ?? req.userId)
        if (!user) {
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "không tìm thấy người dùng", null))
        }
        const newBufa = bufaGenerator(6)
        user.bufa = newBufa
        await user.save()
        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "Thay đỗi mã bufa thành công", newBufa))
    } catch (error) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, "NOT_FOUND", null))
    }
}

exports.login = login;
exports.insertUser = insertUser;
exports.getPagingUsers = getPagingUsers;
exports.getUserById = getUserById;
exports.getUserByToken = getUserByToken;
exports.register = register;
exports.deleteUser = deleteUser;
exports.updateUser = updateUser;
exports.updateUserByToken = updateUserByToken
exports.getSuperAdminIds = getSuperAdminIds
exports.getAllUser = getAllUser
exports.getListOfAdmin = getListOfAdmin
exports.changeBufaByToken = changeBufaByToken