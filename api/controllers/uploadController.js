const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ResponseModel = require('../models/ResponseModel');
const { httpCodes } = require('../../utilities/constants');
const HTTP_CODES = require('../../utilities/httpCodes')
const { uploadActions } = require('../../utilities/actions');
const { getDate } = require('../../utilities/getDate');
const { uuidv4 } = require('uuidv4')
const imageFolder = '/assets/uploads/images';
const videoFolder = '/assets/uploads/videos';
const documentFolder = '/assets/uploads/documents';


//Storages
const imageStorage = multer.diskStorage({
    destination: `.${imageFolder}/${getDate('year')}/${getDate('month')}`,
    filename: function (req, file, callBack) {
        callBack(null, 'img-' + Date.now() + path.extname(file.originalname));
    }
});

const videoStorage = multer.diskStorage({
    destination: `.${videoFolder}/${getDate('year')}/${getDate('month')}`,
    filename: function (req, file, callBack) {
        callBack(null, 'video-' + Date.now() + path.extname(file.originalname));
    }
});

const documentStorage = multer.diskStorage({
    destination: `.${documentFolder}/${getDate('year')}/${getDate('month')}`,
    filename: function (req, file, callBack) {
        callBack(null, 'doc-' + Date.now() + path.extname(file.originalname));
    }
});

//Check file type
function checkImageType(file, callBack) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return callBack(null, true);
    } else {
        callBack('Error: Images Only!');
    }
}

function checkVideoType(file, callBack) {
    const filetypes = /mp4|mov|wmv|webm|avi/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return callBack(null, true);
    } else {
        callBack('Error: Videos Only!');
    }
}

function checkDocumentType(file, callBack) {
    const filetypes = /doc|docx|pdf|xls|xlsx|ppt|pptx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return callBack(null, true);
    } else {
        callBack('Error: Documents Only!');
    }
}

//Multer upload
const multerUploadImage = multer({
    storage: imageStorage,
    limits: { fileSize: 2000000 }, //2M
    fileFilter: function (req, file, callBack) {

        console.log("File object", file)

        checkImageType(file, callBack);
    }
}).single('image');

const multerUploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 10000000 }, //10M
    fileFilter: function (req, file, callBack) {
        checkVideoType(file, callBack);
    }
}).single('video');

const multerUploadDocument = multer({
    storage: documentStorage,
    limits: { fileSize: 10000000 }, //10M
    fileFilter: function (req, file, callBack) {
        checkDocumentType(file, callBack);
    }
}).single('doc');

function uploadImage(req, res) {
    try {
        if (req.actions.includes(uploadActions.uploadImage)) {
            multerUploadImage(req, res, (error) => {

                if (error) {
                    return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
                }
                else {
                    if (!req.file) {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'No file selected!', null))
                    } else {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Image uploaded!', `${imageFolder}/${getDate('year')}/${getDate('month')}/${req.file.filename}`))
                    }
                }
            })
        }
        else {
            return res.status(200)
                .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
        }
    } catch (err) {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", null));
    }
}

function uploadVideo(req, res) {
    try {
        if (req.actions.includes(uploadActions.uploadVideo)) {
            multerUploadVideo(req, res, (error) => {
                if (error) {
                    return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
                }
                else {
                    if (!req.file) {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'No file selected!', null))
                    } else {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Video uploaded!', `${videoFolder}/${getDate('year')}/${getDate('month')}/${req.file.filename}`))
                    }
                }
            })
        }
        else {
            return res.status(200)
                .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
        }
    } catch (err) {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", null));
    }
}

function uploadDocument(req, res) {
    try {
        if (req.actions.includes(uploadActions.uploadDocument)) {
            multerUploadDocument(req, res, (error) => {
                if (error) {
                    return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
                }
                else {
                    if (!req.file) {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'No file selected!', null))
                    } else {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Document uploaded!', `${documentFolder}/${getDate('year')}/${getDate('month')}/${req.file.filename}`))
                    }
                }
            })
        } else {
            return res.status(200)
                .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
        }
    } catch (err) {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", null));
    }
}

function deleteImage(req, res) {
    try {
        if (req.actions.includes(uploadActions.deleteImage)) {
            if (req.params.fileName) {
                let fileName = req.params.fileName;
                let path = `.${imageFolder}/${fileName}`;
                fs.unlink(path, (error) => {
                    if (error) {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
                    }
                    else {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Image removed', fileName));
                    }
                });
            } else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'FileName is null or empty!', null))
            }
        }
        else {
            return res.status(200)
                .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
        }
    } catch (err) {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", null));
    }
}

function deleteVideo(req, res) {
    try {
        if (req.actions.includes(uploadActions.deleteVideo)) {
            if (req.params.fileName) {
                let fileName = req.params.fileName;
                let path = `.${videoFolder}/${fileName}`;
                fs.unlink(path, (error) => {
                    if (error) {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
                    }
                    else {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Video removed', fileName));
                    }
                });
            } else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'FileName is null or empty!', null))
            }
        }
        else {
            return res.status(200)
                .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
        }
    } catch (err) {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", null));
    }
}

function deleteDocument(req, res) {
    try {
        if (req.actions.includes(uploadActions.deleteDocument)) {
            if (req.params.fileName) {
                let fileName = req.params.fileName;
                let path = `.${documentFolder}/${fileName}`;
                fs.unlink(path, (error) => {
                    if (error) {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.NOT_FOUND, error.message, error));
                    }
                    else {
                        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, 'Document removed', fileName));
                    }
                });
            } else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, 'FileName is null or empty!', null))
            }
        }
        else {
            return res.status(200)
                .json(new ResponseModel(HTTP_CODES.FORBIDDEN, "FORBIDDEN", null));
        }
    } catch (err) {
        return res.status(200)
            .json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", null));
    }
}

async function imageUploader(req, res) {
    try {
        const base64String = req.body.base64;
        const generateRandomString = (length = 16) => Math.random().toString(20).substr(2, length);
        const filename = generateRandomString()
        let filePath = `.${imageFolder}/${req.userId}`;

        const buffer = Buffer.from(base64String, 'base64')

        if (!fs.existsSync(`${filePath}`)) {
            fs.mkdirSync(`${filePath}`)
        }

        fs.writeFile(`${filePath}/${filename}`, buffer, (err) => {
            if (err) {
                console.log(err)
                return res.status(200).json(new ResponseModel(HTTP_CODES.BAD_REQUEST, err, null))
            } else {
                return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "Tải ảnh lên thành công", `${filePath}/${filename}`.replace(".", "")))
            }
        });
    } catch (error) {
        return res.status(200).json(new ResponseModel(HTTP_CODES.INTERNAL_SERVER_ERROR, error.message, null))
    }
}

async function getListOfFilesByUser(req, res) {
    try {
        let filePath = `.${imageFolder}/${req.userId}`
        const files = await fs.promises.readdir(filePath)

        const listOfFileWithPath = files.map(fileName => ({
            filePath: (filePath + "/" + fileName).replace(".", "")
        }))

        return res.status(200).json(new ResponseModel(HTTP_CODES.OK, "OK", listOfFileWithPath))
    } catch(error) {
        return res.status(200).json(new ResponseModel(404, "Danh sách file của bạn rỗng", null))
    }
}

exports.imageUploader = imageUploader
exports.uploadImage = uploadImage;
exports.uploadVideo = uploadVideo;
exports.uploadDocument = uploadDocument;
exports.deleteImage = deleteImage;
exports.deleteVideo = deleteVideo;
exports.deleteDocument = deleteDocument;
exports.getListOfFilesByUser = getListOfFilesByUser