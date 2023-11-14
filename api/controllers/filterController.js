const Filters = require('../../database/entities/Filters');
const { filterActions } = require('../../utilities/actions');
const { httpCodes } = require('../../utilities/constants');
const ResponseModel = require('../models/ResponseModel');
const { isValidObjectId } = require('mongoose');

//body
// {
//     filterKeys: String
// }
async function createFilters(req, res) {
    if (req.actions.includes(filterActions.createFilters)) {
        try {
            let filterKeys = req.body.filterKeys;
            if (filterKeys) {
                let keys = filterKeys.split(',');
                if (keys.length > 0) {
                    let newFilters = [];
                    for (let i = 0; i < keys.length; i++) {
                        let existedFilters = await Filters.find({ key: keys[i].trim() });
                        if (!existedFilters.length > 0) {
                            let filter = new Filters({ createdBy: req.userId, key: keys[i].trim() });
                            newFilters.push(filter);
                        }
                    }
                    await Filters.insertMany(newFilters)
                    let response = new ResponseModel(httpCodes.success, 'Create filters success!', newFilters);
                    res.json(response);
                }
                else {
                    res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, "filterKeys param is null or empty", null));
                }
            }
            else {
                res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, "filterKeys param is null or empty", null));
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
async function deleteFilter(req, res) {
    if (req.actions.includes(filterActions.deleteFilter)) {
        if (isValidObjectId(req.params.id)) {
            try {
                const filter = await Filters.findByIdAndDelete(req.params.id);
                if (!filter) {
                    res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'No item found!', null));
                }
                else {
                    let response = new ResponseModel(httpCodes.success, 'Delete filter success!', null);
                    res.json(response);
                }
            } catch (error) {
                res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
            }
        }
        else {
            res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'FilterId is invalid!', null));
        }
    } else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

//query.key
async function getAllFilters(req, res) {
    if (req.actions.includes(filterActions.getAllFilters)) {
        try {
            let searchObj = {}
            if (req.query.key) {
                searchObj = {
                    key: { $regex: '.*' + req.query.key + '.*' }
                }
            }
            let filters = await Filters.find(searchObj).sort({ createdTime: 'desc' });
            res.json(filters);
        } catch (error) {
            res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
        }
    }
    else {
        res.sendStatus(httpCodes.unauthorized);
    }
}

exports.createFilters = createFilters;
exports.deleteFilter = deleteFilter;
exports.getAllFilters = getAllFilters;