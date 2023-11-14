const { isValidObjectId, default: mongoose } = require('mongoose');
const Roles = require('../../../database/entities/authentication/Roles');
const PagedModel = require('../../models/PagedModel');
const ResponseModel = require('../../models/ResponseModel');
const { httpCodes } = require('../../../utilities/constants');
const { roleActions } = require('../../../utilities/actions');

//body
// {
//     roleName: String,
//     actions: [ObjectId],
//     default: Boolean
// }
async function createRole(req, res) {
    if (req.actions.includes(roleActions.createRole)) {
        try {
            let role = new Roles(req.body);
            role.createdTime = Date.now();
            role.createdBy = req.userId;
            if (!req.body.default) {
                role.default = false;
            }
            const newRole = await role.save();
            res.json(new ResponseModel(httpCodes.success, 'Create role success!', newRole));
        } catch (error) {
            res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

//body
// {
//     roleName: String,
//     actions: [ObjectId],
//     default: Boolean
// }
async function updateRole(req, res) {
    if (req.actions.includes(roleActions.updateRole)) {
        const session = await mongoose.startSession();
        await session.startTransaction();
        try {
            let newRole = {
                ...req.body,
                updatedTime: Date.now(),
                updatedBy: req.userId
            };
            
            if (newRole.default) {
                await Roles.updateMany({}, { default: false });
            }
            let updatedRole = await Roles.findByIdAndUpdate(req.params.id, newRole);
            if (!updatedRole) {
                res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'No item found!', null));
            }
            else {
                await session.commitTransaction();
                res.json(new ResponseModel(httpCodes.success, 'Update role success!', newRole));
            }
        }
        catch (error) {
            await session.abortTransaction();
            res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
        }
        finally {
            session.endSession();
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

//params.id
async function deleteRole(req, res) {
    if (req.actions.includes(roleActions.deleteRole)) {
        if (isValidObjectId(req.params.id)) {
            try {
                const role = await Roles.findByIdAndDelete(req.params.id);
                if (!role) {
                    res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'No item found!', null));
                }
                else {
                    res.json(new ResponseModel(httpCodes.success, 'Delete role success!', null));
                }
            } catch (error) {
                res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
            }
        }
        else {
            res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'RoleId is not valid!', null));
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

// query.pageIndex
// query.pageSize
// query.roleName
async function getPagingRoles(req, res) {
    if (req.actions.includes(roleActions.getPagingRoles)) {
        let pageSize = req.query.pageSize || 10;
        let pageIndex = req.query.pageIndex || 1;

        let searchObj = {}
        if (req.query.roleName) {
            searchObj = { roleName: { $regex: '.*' + req.query.roleName + '.*' } }
        }
        try {
            let roles = await Roles
                .find(searchObj)
                .skip((pageSize * pageIndex) - pageSize)
                .limit(parseInt(pageSize))
                .sort({
                    createdTime: 'desc'
                })
            let count = await Roles.find(searchObj).countDocuments();
            let totalPages = Math.ceil(count / pageSize);
            let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, roles);
            res.json(pagedModel);
        } catch (error) {
            res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
        }
    } else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

//params.id
async function getRoleById(req, res) {
    if (req.actions.includes(roleActions.getRoleById)) {
        if (isValidObjectId(req.params.id)) {
            try {
                let role = await Roles.findById(req.params.id);
                res.json(role);
            } catch (error) {
                res.status(httpCodes.notFound).json(httpCodes.notFound, error.message, error);
            }
        }
        else {
            res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'RoleId is not valid!', null));
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

exports.createRole = createRole;
exports.deleteRole = deleteRole;
exports.getPagingRoles = getPagingRoles;
exports.getRoleById = getRoleById;
exports.updateRole = updateRole;