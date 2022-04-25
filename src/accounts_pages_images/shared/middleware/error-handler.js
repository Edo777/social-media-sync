const handle = function (err, res, callFrom) {
    console.log(err, "+++++++++++++++++++++++++++", `${__filename}:${2}`);
    console.log({ callFrom });

    let statusCode = 500;
    const sendData = {
        message: err.message,
        name: err.name,
    };

    if (err.name === "UnauthorizedError") {
        statusCode = 401;
    } else if (err.name === "CUSTOM_ERROR") {
        statusCode = 400;
    } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        statusCode = 403;
    } else if (err.name === "SequelizeValidationError") {
        statusCode = 400;
    } else if (err.name === "MyValidationError") {
        statusCode = 400;
        sendData.errors = err.errors;
    }

    res.status(statusCode).send(sendData);
};

const handleGlobal = function (err, req, res, next) {
    return handle(err, res, "global");
};

const handleFirst = function (req, res, next) {
    try {
        return next();
    } catch (e) {
        return handle(e, res, "first");
    }
};

module.exports = {
    global: handleGlobal,
    first: handleFirst,
};
