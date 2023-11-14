const { isValidObjectId } = require('mongoose');
const Files = require('../../database/entities/Files');
const { fileActions } = require('../../utilities/actions');
const HTTP_CODES = require('../../utilities/httpCodes');
const PagedModel = require('../models/PagedModel');
const ResponseModel = require('../models/ResponseModel');

//body
// {
//     room: ObjectId,
//     filePath: String,
//     fileType: Number
// }
async function createFile(req, res) {
    if (req.actions.includes(fileActions.createFile)) {
        try {
            if (req.body.filePath) {
                let file = new Files(req.body);
                file.createdBy = req.userId;
                let newFile = await file.save();
                return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Create file success!', newFile));
            }
            else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'filePath is null or empty!', null))
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

//params.id
async function deleteFile(req, res) {
    if (req.actions.includes(fileActions.deleteFile)) {
        try {
            if (req.params.id) {
                if (isValidObjectId(req.params.id)) {
                    let file = await Files.findOne({ _id: req.params.id, isDeleted: false });
                    if (!file) {
                        res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'No item found!', null));
                    }
                    else {
                        file.isDeleted = true;
                        await file.save();
                        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Delete file success!', file));
                    }
                }
                else {
                    return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Id is not ObjectId', null))
                }
            }
            else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'Id is null', null))
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

//query.pageIndex
//query.pageSize
//query.fileType
//query.room
//query.user
async function getPagingFiles(req, res) {
    if (req.actions.includes(fileActions.getPagingFiles)) {
        let pageSize = req.query.pageSize || 100;
        let pageIndex = req.query.pageIndex || 1;

        let searchObj = {
            isDeleted: false
        }
        if (req.query.fileType) {
            searchObj = {
                ...searchObj,
                fileType: req.query.fileType
            }
        }
        if (req.query.room) {
            searchObj = {
                ...searchObj,
                room: req.query.room
            }
        }
        if (req.query.user) {
            searchObj = {
                ...searchObj,
                createdBy: req.query.user
            }
        }
        try {
            let files = await Files
                .find(searchObj)
                .skip((pageSize * pageIndex) - pageSize)
                .limit(parseInt(pageSize))
                .sort({
                    createdTime: 'desc'
                });
            let count = await Files.find(searchObj).countDocuments();
            let totalPages = Math.ceil(count / pageSize);
            return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", new PagedModel(pageIndex, pageSize, totalPages, files)));
        } catch (error) {
            console.log(error)
            return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
        }
    }
    else {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
    }
}

exports.createFile = createFile;
exports.deleteFile = deleteFile;
exports.getPagingFiles = getPagingFiles;