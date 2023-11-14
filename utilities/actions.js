exports.actionActions = {
    updateAction: 'updateAction'
}

exports.roleActions = {
    createRole: 'createRole',
    updateRole: 'updateRole',
    deleteRole: 'deleteRole',
    getPagingRoles: 'getPagingRoles',
    getRoleById: 'getRoleById'
}

exports.userActions = {
    insertUser: 'insertUser',
    getPagingUsers: 'getPagingUsers',
    getUserById: 'getUserById',
    deleteUser: 'deleteUser',
    updateUser: 'updateUser'
}

exports.chatActions = {
    createChat: 'createChat', //defaultRoomAction
    updateChat: 'updateChat', //defaultRoomAction
    pinChat: 'pinChat', //RoomAction
    deleteChat: 'deleteChat', //defaultRoomAction
    forceDeleteChat: 'forceDeleteChat',
    getChats: 'getChats', //defaultRoomAction
    getBeforeChats: 'getBeforeChats', //defaultRoomAction
    getAfterChats: 'getAfterChats', //defaultRoomAction
    searchChats: 'searchChats', //defaultRoomAction
    getChatById: 'getChatById', //defaultRoomAction
    getPagingChats: 'getPagingChats',
}

exports.fileActions = {
    createFile: 'createFile', //defaultRoomAction
    deleteFile: 'deleteFile',
    getPagingFiles: 'getPagingFiles'
}

exports.filterActions = {
    createFilters: 'createFilters',
    deleteFilter: 'deleteFilter',
    getAllFilters: 'getAllFilters'
}

exports.gifActions = {
    createGif: 'createGif',
    createDefaultGif: 'createDefaultGif',
    deleteGif: 'deleteGif',
    deleteDefaultGif: 'deleteDefaultGif',
    getPagingGifs: 'getPagingGifs'
}

exports.roomActions = {
    createRoom: 'createRoom',
    updateRoom: 'updateRoom',
    deleteRoom: 'deleteRoom',
    getPagingRooms: 'getPagingRooms',
    getPersonalRoom: 'getPersonalRoom',
    getRoomById: 'getRoomById'
}

exports.roomUserActions = {
    createRoomUser: 'createRoomUser',
    updateRoomUser: 'updateRoomUser',
    deleteRoomUser: 'deleteRoomUser',
    updateLastSeenMessage: 'updateLastSeenMessage', //defaultRoomAction
    getPagingRoomUsers: 'getPagingRoomUsers', //defaultRoomAction
    getRoomUserById: 'getRoomUserById' //defaultRoomAction
}

exports.uploadActions = {
    uploadImage: 'uploadImage', //defaultRoomAction
    uploadVideo: 'uploadVideo', //defaultRoomAction
    uploadDocument: 'uploadDocument', //defaultRoomAction
    deleteImage: 'deleteImage', //defaultRoomAction
    deleteVideo: 'deleteVideo', //defaultRoomAction
    deleteDocument: 'deleteDocument' //defaultRoomAction
}

exports.reactionActions = {
    createReaction: 'createReaction', //defaultRoomAction
    deleteReaction: 'deleteReaction' //defaultRoomAction
}