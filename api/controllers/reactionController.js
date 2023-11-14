const { default: mongoose } = require("mongoose");
const Reactions = require("../../database/entities/chat/Reactions");
const { reactionActions, chatActions } = require("../../utilities/actions");
const { httpCodes } = require("../../utilities/constants");
const ResponseModel = require("../models/ResponseModel");
const Chats = require("../../database/entities/chat/Chats");

//body
// {
//     chatId: ObjectId,
//     emoji: String
// }
async function createReaction(req, res) {

        const session = await mongoose.startSession();
        await session.startTransaction();
        try {

            const reacted = await Reactions.findOne({ createdBy: req.userId, chat: req.body.chatId })

            if (reacted) {
                // remove reacted:
                await reacted.remove()
                let chat = await Chats.findById(reacted.chat);
                chat.reactions = chat.reactions.filter(x => x.toString() !== reacted._id.toString());
                await chat.save();
                await chat
                    .populate({
                        path: "reactions",
                        select: "createdBy",
                        populate: { path: "createdBy", select: "username" }
                    })
                await session.commitTransaction();
                return res.json(new ResponseModel(httpCodes.success, 'Remove react success!', chat))
            } else {
                let reaction = new Reactions({
                    chat: req.body.chatId,
                    emoji: req.body.emoji
                });

                reaction.createdBy = req.userId;
                reaction.createdTime = Date.now();
                const newReaction = await reaction.save();

                //update react for this chat
                let chat = await Chats.findById(req.body.chatId);
                chat.reactions.push(newReaction._id);
                // await newReaction.populate({ path: "createdBy" })
                await chat
                    .populate({
                        path: "reactions",
                        select: "createdBy createdTime emoji",
                    })
                await chat.save();

                await session.commitTransaction();
                return res.json(new ResponseModel(httpCodes.success, 'Insert react success!', chat))
            }

        } catch (error) {
            await session.abortTransaction();
            res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
        } finally {
            session.endSession();
        }
}

//params.id
async function deleteReaction(req, res) {
        const session = await mongoose.startSession();
        await session.startTransaction();
        try {
            const deletedReaction = await Reactions.findByIdAndDelete(req.params.id);
            if (!deletedReaction) {
                res.status(httpCodes.badRequest).json(new ResponseModel(httpCodes.badRequest, 'No item found!', null))
            }
            else {
                //update reaction for this chat
                let chat = await Chats.findById(deletedReaction.chat);
                chat.reactions = chat.reactions.filter(x => x !== deletedReaction._id);
                await chat.save();

                await session.commitTransaction();
                res.json(new ResponseModel(httpCodes.success, 'Delete reaction success!', deletedReaction))
            }
        } catch (error) {
            await session.abortTransaction();
            res.status(httpCodes.notFound).json(new ResponseModel(httpCodes.notFound, error.message, error));
        }
        finally {
            session.endSession();
        }
}

exports.createReaction = createReaction
exports.deleteReaction = deleteReaction