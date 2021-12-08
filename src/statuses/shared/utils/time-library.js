const moment = require("moment-timezone");
const zerofill = require("./zerofill");

/**
 * Zerofill number.
 * @param {Number} value
 * @returns {String}
 */
function zf(value) {
    return zerofill(value, 2);
}

/**
 *
 * @param {*} date FORMAT Y-M-D hh:mm:ss
 * @param {*} timezone
 * @returns DATE UTC0 WITH CHANGED TIMEZONE
 */
function setDateTimezone(date, timezone) {
    const dateFormatted = (function (d) {
        let [_d, _t] = d.split(" ");

        _d = _d
            .split("-")
            .map((i) => zf(parseInt(i)))
            .join("-");

        _t = _t
            .split(":")
            .map((i) => zf(parseInt(i)))
            .join(":");

        return [_d, _t].join(" ");
    })(date);

    const dateResult = moment.tz(dateFormatted, timezone).utcOffset(0, false);

    return dateResult;
}

/**
 * Detect offset of the timezone
 * @param {string} timzonename name of timezone EX. Asia/Yerevan
 */
function detectTimezoneOffsetNumber(timzonename) {
    return moment.tz(new Date(), timzonename)._offset;
}

/**
 * Change utc0 to original date in timezone
 * @param {*} date
 * @param {*} timezone
 */
function changeUtc0ToDate(date, timezone) {
    /** re change date to utc 0 */
    const dateToUtc0WithoutChange = moment(date).utcOffset(0, false).format();

    const offset = detectTimezoneOffsetNumber(timezone);
    const originalDate = moment(dateToUtc0WithoutChange).utcOffset(offset, false);

    return originalDate;
}

/**
 * Get only utc0 now in taken timezone
 * @param {string} timezone
 * @returns {moment}
 */
function getNowUTC0(timezone) {
    const offset = detectTimezoneOffsetNumber(timezone);
    const dateNow = moment(Date.now()).utcOffset(offset, false).utcOffset(0);

    return dateNow;
}

/**
 * Set T and Z in date
 * @param {*} date
 */
function TZformat(date) {
    try {
        date.replace(date.indexOf(" "), "T");
        date[date.length - 1] = "Z";

        return date;
    } catch (e) {
        console.handleError(e);
        throw e;
    }
}

module.exports = {
    detectTimezoneOffsetNumber,
    setDateTimezone,
    changeUtc0ToDate,
    TZformat,
    getNowUTC0,
    zf,
};
