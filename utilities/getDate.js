function getDate(type) {
    const date = new Date();
    if (type === 'day') {
        let day = date.getDate();
        if (day < 10) {
            day = '0' + day;
        }
        return day;
    }
    if (type === 'month') {
        let month = date.getMonth() + 1;
        if (month < 10) {
            month = '0' + month;
        }
        return month;
    }
    if (type === 'year') {
        let year = date.getFullYear();
        return year;
    }
    if (type === 'date') {
        return `${day}${month}${year}`
    }
}

exports.getDate = getDate;