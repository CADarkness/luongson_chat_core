
module.exports = class ResponseModel {
    constructor(status, message, data) {
        this.status = status;
        this.message = message;
        this.data = data;

        this.apiVersion = "1.0.3",
        this.lastApiUpdated = "02/11/2023"
    }
}