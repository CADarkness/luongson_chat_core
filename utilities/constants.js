exports.httpCodes = {
    success: 200,
    notFound: 404,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403
}

exports.userStatuses = {
    deleted: 0,
    active: 1,
    locked: 2
}

exports.roleNames = {
    superAdmin: 'SUPERADMIN',
    admin: 'ADMIN',
    user: 'USER'
}

exports.chatTypes = {
    notification: 0,
    message: 1,
    image: 2,
    file: 3,
    link: 4,
    gif: 5
}

exports.fileTypes = {
    image: 0,
    video: 1,
    document: 2
}

exports.roomTypes = {
    personal: 0,
    private: 1,
    public: 2,
    global: 3
}

exports.roomRoles = {
    owner: 0,
    admin: 1,
    member: 2
}

exports.gifGroupTypes = {
    default: 0,
    public: 1,
    private: 2
}
