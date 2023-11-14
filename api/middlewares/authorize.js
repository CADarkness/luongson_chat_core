const jwt = require('jsonwebtoken');
const ResponseModel = require('../models/ResponseModel');
const Roles = require('../../database/entities/authentication/Roles.js');
const Actions = require('../../database/entities/authentication/Actions.js');
const { httpCodes, roleNames } = require('../../utilities/constants');
const HTTP_CODES = require('../../utilities/httpCodes');
const Users = require('../../database/entities/authentication/Users');
require("dotenv").config();
const secretKey = process.env.SECRET_KEY;

async function authorize(req, res, next) {
    try {
        const bearerHeader = req.headers['authorization'] ?? req.query.token
        if (typeof bearerHeader !== 'undefined') {
            let token = bearerHeader.split(' ')[1];

            if (req.query.token) { token = req.query.token }

            const authorizedData = await jwt.verify(token, secretKey);
            if (authorizedData.user.role) {
                if (authorizedData.user.role.roleName === roleNames.superAdmin) {
                    const actions = await Actions.find();
                    req.actions = actions?.map(x => x.actionName);
                }
                else {
                    const role = await Roles.findById(authorizedData.user.role._id).populate({ path: 'actions', select: 'actionName' });
                    req.actions = role.actions?.map(x => x.actionName);
                }

                req.isSuperAdmin = true

                const user = await Users.findById(authorizedData.user._id)

                if (!user) throw new Error("Tài khoản của bạn đã bị xóa hoặc bị ban")
                if (user.status === 0 || user.status === 2) throw new Error("Tài khoản của bạn đã bị xóa hoặc bị ban")

                req.userId = authorizedData.user._id;
                next();
            }
            else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.UNAUTHORIZED, "UNAUTHORIZED", null))
            }
        }
        else {
            return res.status(200).json(new ResponseModel(HTTP_CODES.UNAUTHORIZED, "UNAUTHORIZED", null))
        }
    } catch (error) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.UNAUTHORIZED, error.message, null))
    }
}

exports.authorize = authorize;