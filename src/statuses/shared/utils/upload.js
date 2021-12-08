const path = require("path");
const fs = require("fs");
const randomString = require("./random-string");

const getUploadByModule = function (moduleName) {
    const saveDirInit = path.join(process.appDirs.root, "modules", moduleName, "upload.js");
    if (fs.existsSync(saveDirInit)) {
        return require(saveDirInit);
    }

    return false;
};

/**
 * Storage generator
 * @param {{
 *  saveDir: string,
 *  subSaveDir: string,
 *  subDirIdentifier: "user" | "workspace" | string
 * }} options
 * @param req
 * @param file
 * @param cb
 */
const storageDestination = (moduleName, options = null) => (req, file, cb) => {
    let _saveDir = "public";
    let _subSaveDir = "library";
    let _subDirIdentifier = "user";

    if (options) {
        if (options.saveDir) {
            _saveDir = options.saveDir;
        }

        if (options.subSaveDir) {
            _subSaveDir = options.subSaveDir;
        }

        if (options.subDirIdentifier) {
            _subDirIdentifier = options.subDirIdentifier;
        }
    }

    let identifier = _subDirIdentifier;

    if (_subDirIdentifier === "user") {
        identifier = req.identity.user.id;
    } else if (_subDirIdentifier === "workspace") {
        identifier = req.identity.user.workspace.id;
    }

    const saveDir = path.join(process.appDirs.root, "modules", moduleName, _saveDir);

    const libraryPath = path.join(saveDir, _subSaveDir);
    if (!fs.existsSync(libraryPath)) {
        fs.mkdirSync(libraryPath);
    }

    const finalLibraryPath = path.join(libraryPath, identifier.toString());
    if (!fs.existsSync(finalLibraryPath)) {
        fs.mkdirSync(finalLibraryPath);
    }

    const before = getUploadByModule(moduleName);
    if (before && before.storageDestination) {
        const result = before.storageDestination(finalLibraryPath, saveDir, req, file);
        if ("string" == typeof result) {
            return cb(result, null);
        }
    }

    cb(null, finalLibraryPath);
};

/**
 * Detect file name. File save space.
 * @param req
 * @param file
 * @param cb
 */
const detectFileName = (moduleName) => (req, file, cb) => {
    req.body.extention = file.originalname.slice(file.originalname.lastIndexOf("."));
    req.body.displayName = file.originalname.replace(/ /g, "");

    let saveName = randomString(24, "nlu") + req.body.extention;

    const before = getUploadByModule(moduleName);
    if (before && before.detectFileName) {
        const result = before.detectFileName(req, file);
        if ("string" == typeof result) {
            saveName = result;
        }
    }

    cb(null, saveName);
};

module.exports = (moduleName, options = null) =>
    require("multer").diskStorage({
        filename: detectFileName(moduleName),
        destination: storageDestination(moduleName, options),
    });
