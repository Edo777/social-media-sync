const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const fs = require("fs");
const path = require("path");

const projectRootDir = path.join(__dirname, "..", "..");
const dotenvConfigs = dotenv.config({
    path: path.join(projectRootDir, ".env"),
});

dotenvExpand(dotenvConfigs);

process.env.TZ = process.env.TZ || "Europe/London";
process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.NODE_END = process.env.NODE_END || "development";

process.isProd = function () {
    const values = [process.env.NODE_ENV, process.env.NODE_END];

    const keys = ["prod", "production", "release"];

    for (let i = 0; i < values.length; ++i) {
        if (keys.includes(values[i])) {
            return true;
        }
    }

    return false;
};

const appDirsRoot = path.join(projectRootDir, ".app-dirs");
if (!fs.existsSync(appDirsRoot)) {
    fs.mkdirSync(appDirsRoot);
    fs.chmodSync(appDirsRoot, "777");
}

process.appDirs = {
    root: path.join(projectRootDir),
};

const moduleDirs = path.join(__dirname, "..", ".." , "dirs.js");
if (fs.existsSync(moduleDirs)) {
    const register = require(moduleDirs);
    process.appDirs = {
        ...process.appDirs,
        ...register(appDirsRoot),
    };
}


Object.values(process.appDirs).forEach(function (folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
        fs.chmodSync(folder, "777");
    }
});
