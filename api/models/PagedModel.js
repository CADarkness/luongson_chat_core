
module.exports = class PagedModel {
    constructor(pageIndex, pageSize, totalPages, data, count=null) {
        this.pageIndex = pageIndex;
        this.pageSize = pageSize;
        this.totalPages = totalPages;
        this.data = data;
        this.count = count
    }
}