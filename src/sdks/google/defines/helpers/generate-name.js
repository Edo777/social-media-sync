const zerofill = function (value, length) {
    let str = "" + value;
    while (str.length < length) {
        str = "0" + str;
    }
    return str;
};

module.exports = function (name) {
    const date = new Date();

    const year = date.getFullYear();
    const month = zerofill(date.getMonth() + 1, 2);
    const day = zerofill(date.getDate(), 2);
    const hour = zerofill(date.getHours(), 2);
    const minute = zerofill(date.getMinutes(), 2);
    const second = zerofill(date.getSeconds(), 2);
    const millisecond = zerofill(date.getMilliseconds(), 3);

    const offset = date.getTimezoneOffset();
    const timezone =
        "GTM" +
        (offset < 0 ? "+" : "-") +
        zerofill(parseInt(Math.abs(offset / 60)), 2) +
        ":" +
        zerofill(Math.abs(offset % 60), 2);

    const suffixDate = `${month}/${day}/${year}`;
    const suffixTime = `${hour}:${minute}:${second}.${millisecond}`;

    const suffix = `${suffixDate} ${suffixTime} ${timezone}`;

    return `${name} [${suffix}]`;
};
