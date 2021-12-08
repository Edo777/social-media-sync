const path = require("path");
const fs = require("fs");
const {generateRandomString} = require("./token");

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
const storageDestination = (options = null) => (req, file, cb) => {
    let _saveDir = "public";
    let _subSaveDir = "library";
    let _subDirIdentifier = "company";

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

    if (_subDirIdentifier === "company") {
        identifier = req.identity.company.id;
    }

    const saveDir = path.join(__dirname, '..', _saveDir);
    const libraryPath = path.join(saveDir, _subSaveDir);

    if (!fs.existsSync(libraryPath)) {
        fs.mkdirSync(libraryPath);
    }

    const finalLibraryPath = path.join(libraryPath, identifier.toString());
    if (!fs.existsSync(finalLibraryPath)) {
        fs.mkdirSync(finalLibraryPath);
    }

    req.body.libraryPath = finalLibraryPath;

    cb(null, finalLibraryPath);
};

/**
 * Detect file name. File save space.
 * @param req
 * @param file
 * @param cb
 */
const detectFileName = () => (req, file, cb) => {
    console.log(file);
    req.body.extention = file.originalname.slice(file.originalname.lastIndexOf("."));
    req.body.displayName = file.originalname.replace(/ /g, "");

    let saveName = generateRandomString(24) + req.body.extention;
    req.body.image = saveName;
    cb(null, saveName);
};

module.exports = (options = null) =>
    require("multer").diskStorage({
        filename: detectFileName(),
        destination: storageDestination(options),
    });
