class Actions {
    constructor() {
        this.list = {
            roomActions: [
                {
                    name: "CREATE_ROOM",
                    description: "Cho phép tạo phòng",
                    isDefaultAction: false
                }, {
                    name: "UPDATE_ROOM",
                    description: "Cho phép chỉnh sửa thông tin phòng",
                    isDefaultAction: false
                }, {
                    name: "DELETE_ROOM",
                    description: "Cho phép xóa phòng"
                }
            ],
            chatActions: [
                {
                    name: "CREATE_CHAT",
                    description: "Cho phép gửi tin nhắn",
                    isDefaultAction: false
                }, {
                    name: "GET_CHAT",
                    description: "Cho phép lấy tin nhắn của phòng"
                }
            ]
        }
    }

    findByKey(category, key) {
        return this.list[category].find(action => action.name === key)
    }

    findByActionName(name) {
        let result = null
        for (let category in this.list) {
            const tryFind = this.list[category].find(item => item.name === name)
            if (tryFind) result = tryFind
            break
        }    
        return result
    }

    getAll(category = undefined) {
        if (category)  {
            return this.list[category]
        } else {
            const resullt = []
            for (let ca in this.list) {
                resullt.push(...this.list[ca])
            }
            return resullt
        }
    }

}