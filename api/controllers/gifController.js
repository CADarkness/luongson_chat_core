const Gifs = require('../../database/entities/Gifs');
const { gifActions } = require('../../utilities/actions');
const { httpCodes } = require('../../utilities/constants');
const PagedModel = require('../models/PagedModel');
const ResponseModel = require('../models/ResponseModel');
const { isValidObjectId } = require('mongoose');

//body
// {
//     file: ObjectId
// }
async function createGif(req, res) {
    if (req.actions.includes(gifActions.createGif)) {
        try {
            if (isValidObjectId(req.body.file)) {
                let existedGif = await Gifs.findOne({ createdBy: req.userId, file: req.body.file, default: false });
                if (existedGif) {
                    res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'Gif was existed!', null));
                }
                else {
                    const obj = { ...req.body, default: false, createdBy: req.userId, createdTime: Date.now() };
                    let gif = new Gifs(obj);
                    let newGif = await gif.save();
                    await Gifs.populate(newGif, { path: 'file', select: 'filePath fileType' });
                    await Gifs.populate(newGif, { path: 'createdBy', select: 'avatar fullName' });
                    res.json(new ResponseModel(httpCodes.success, 'Create gif success!', newGif));
                }
            }
            else {
                res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'File is invalid', null));
            }
        } catch (error) {
            res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
        }
    }
    else {
        res.sendStatus(401);
    }
}

//body
// {
//     file: ObjectId,
//     default: Boolean
// }
async function createDefaultGif(req, res) {
    if (req.actions.includes(gifActions.createDefaultGif)) {
        try {
            if (isValidObjectId(req.body.file)) {
                let existedGif = await Gifs.findOne({ file: req.body.file, default: true });
                if (existedGif) {
                    res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'Default gif was existed!', null));
                }
                else {
                    const obj = { ...req.body, default: true, createdBy: req.userId, createdTime: Date.now() };
                    let gif = new Gifs(obj);
                    let newGif = await gif.save();
                    await Gifs.populate(newGif, { path: 'file', select: 'filePath fileType' });
                    await Gifs.populate(newGif, { path: 'createdBy', select: 'avatar fullName' });
                    res.json(new ResponseModel(httpCodes.success, 'Create default gif success!', newGif));
                }
            }
            else {
                res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'File is invalid', null));
            }
        } catch (error) {
            res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
        }
    }
    else {
        res.sendStatus(401);
    }
}

//params.id
async function deleteGif(req, res) {
    if (req.actions.includes(gifActions.deleteGif)) {
        try {
            if (req.params.id) {
                if (isValidObjectId(req.params.id)) {
                    let deletedGif = await Gifs.findOneAndDelete({ _id: req.params.id, default: false });
                    if (!deletedGif) {
                        res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'No item found!', null));
                    }
                    else {
                        res.json(new ResponseModel(httpCodes.success, 'Delete gif success!', deletedGif));
                    }
                }
                else {
                    res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'Id is not ObjectId', null))
                }
            }
            else {
                res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'Id is null', null))
            }
        } catch (error) {
            res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

//params.id
async function deleteDefaultGif(req, res) {
    if (req.actions.includes(gifActions.deleteDefaultGif)) {
        try {
            if (req.params.id) {
                if (isValidObjectId(req.params.id)) {
                    let deletedGif = await Gifs.findOneAndDelete({ _id: req.params.id, default: true });
                    if (!deletedGif) {
                        res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'No item found!', null));
                    }
                    else {
                        res.json(new ResponseModel(httpCodes.success, 'Delete default gif success!', deletedGif));
                    }
                }
                else {
                    res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'Id is not ObjectId', null))
                }
            }
            else {
                res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'Id is null', null))
            }
        } catch (error) {
            res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

//query.pageIndex
//query.pageSize
async function getPagingGifs(req, res) {
    if (req.actions.includes(gifActions.getPagingGifs)) {
        let pageSize = req.query.pageSize || 10;
        let pageIndex = req.query.pageIndex || 1;

        let searchObj = {
            default: false
        };

        try {
            let users = await Gifs.find(searchObj)
                .skip(pageSize * pageIndex - pageSize)
                .limit(parseInt(pageSize))
                .populate({ path: 'file', select: 'filePath fileType' })
                .populate({ path: 'createdBy', select: 'avatar fullName' })
                .sort({
                    createdTime: "desc",
                });
            let count = await Gifs.find(searchObj).countDocuments();
            let totalPages = Math.ceil(count / pageSize);
            let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, users);
            res.json(pagedModel);
        } catch (error) {
            res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

exports.createGif = createGif;
exports.createDefaultGif = createDefaultGif;
exports.deleteGif = deleteGif;
exports.deleteDefaultGif = deleteDefaultGif;
exports.getPagingGifs = getPagingGifs;