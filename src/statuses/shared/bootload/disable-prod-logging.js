const handler = function (error) {
    // error/exception handled.

    console.log();
    console.error(error);
    console.log();
};

global.console.handleError = handler;
global.console.errorHandle = handler;
global.console.errorCatch = handler;
global.console.catchError = handler;
