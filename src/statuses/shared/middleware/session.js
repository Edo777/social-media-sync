// const os = require("os");
// const path = require("path");
const fs = require("fs");
const session = require("express-session");
const { hash } = require("../utils");

// session configs
const sessionCreateStore = function () {
    // const SessionMemcachedStore = require("connect-memcached")(session);
    // return new SessionMemcachedStore({
    //     hosts: ["127.0.0.1:11211"],
    // });

    const SessionFileStore = require("session-file-store")(session);
    const folderPath = process.appDirs.clientSession;

    if (!fs.existsSync(folderPath)) {
        const folderMode = "777";
        fs.mkdirSync(folderPath, {
            mode: folderMode,
            recursive: true,
        });

        fs.chmodSync(folderPath, folderMode);
    }

    return new SessionFileStore({
        path: folderPath,
        fileExtension: ".adroot_sess",
    });
};

const sessionCreateCookie = function () {
    return {
        secure: false,
        httpOnly: true,
        sameSite: "none",
        path: "/",
        maxAge: 365 * 24 * 60 * 60 * 1000,
    };
};

const sessionOptions = {
    secret: "keyboard cat",
    key: "user_sid",
    genid: function (req) {
        // return hash(req.ip, "md5") + "_" + hash(req.ip, "sha256");
        return hash(req.ip, "md5") + "_" + hash(req.ip, "md4");
    },
    saveUninitialized: false,
    resave: false,
    cookie: sessionCreateCookie(),
    store: sessionCreateStore(),
};

module.exports = session(sessionOptions);
