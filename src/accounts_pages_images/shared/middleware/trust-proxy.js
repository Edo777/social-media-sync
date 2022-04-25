module.exports = function (app) {
    app.set("trust proxy", 1); // trust first proxy
    // app.set("trust proxy", "127.0.0.1");
};
