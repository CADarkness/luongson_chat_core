const Actions = require("../../../database/entities/authentication/Actions");
const { actionActions } = require("../../../utilities/actions");
const { httpCodes } = require("../../../utilities/constants");
const ResponseModel = require("../../models/ResponseModel");

async function insertAction(req, res) {
    const newAction = await Actions(req.body);
    const savedAction = await newAction.save();
    res.json(savedAction)
}

// @method get; params: null; query: null
async function getActions(req, res) {
    try {
        const actions = await Actions.find({})
        return res.status(200).json(actions)
    } catch (error) {
        console.log(error)
        return res.status(404).json("Can not get actions")
    }
}

//body
// {
//     actionName: String,
//     isRoomAction: Boolean
// }
async function updateAction(req, res) {
    try {
        if (req.actions.includes(actionActions.updateAction)) {
            if (req.body.actionName) {
                const newAction = {
                    ...req.body,
                    updatedBy: req.userId,
                    updatedTime: Date.now()
                }
                const updatedAction = await Actions.findByIdAndUpdate(req.params.id, newAction);
                if (!updatedAction) {
                    res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'No item found!', null));
                }
                else {
                    res.json(new ResponseModel(httpCodes.success, 'Update action success!', newAction))
                }
            }
            else {
                res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'ActionName is null!', null))
            }
        }
        else {
            res.sendStatus(httpCodes.unauthorized);
        }
    } catch(err) {
        res.status(500)
    }
}

exports.insertAction = insertAction;
exports.updateAction = updateAction;
exports.getActions = getActions;