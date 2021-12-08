module.exports = function (errorName, errorMessage) {
    const error = new Error();
    error.name = errorName;
    error.message = errorMessage;
    throw error;
};
