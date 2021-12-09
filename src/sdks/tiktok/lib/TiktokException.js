/**
 * TiktokException constructor.
 * @param {Error} error
 */
const TiktokException = function (error) {
    this.name = "TiktokException";
    this.message = error.message || "An unknown error occurred";
    this.previous = error;
};

TiktokException.prototype = Error.prototype;

module.exports = TiktokException;
