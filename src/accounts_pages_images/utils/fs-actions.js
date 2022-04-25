const rimraf = require("rimraf");
const path = require("path");
const fs = require("fs");

/** Delete directory by path */
async function deleteDirectory(_path) {
    return new Promise((resolve, reject) => {
        rimraf(path.join(_path), (err, deleted) => {
            if (err) {
                return reject(err);
            }

            return resolve(deleted);
        });
    });
}

/** Delete file by path */
async function deleteFile(_path) {
    return new Promise((resolve, reject) => {
        fs.unlink(_path, (err) => {
            if (err) {
                return reject(err);
            }

            return resolve(true);
        });
    });
}

/** copy file by path */
async function copyFile(_path, to) {
    return new Promise((resolve, reject) => {
        fs.copyFile(_path, to, (err) => {
            if (err) {
                return reject(err);
            }

            return resolve(true);
        });
    });
}
/**
 * Delete multiple files
 * @param {Array<string>} files paths of sources
 * @param {Function} callback
 */
function deleteFiles(files, callback) {
    if (files.length == 0) {
        callback(null);
    } else {
        var f = files.pop();
        fs.unlink(f, function (err) {
            if (err) {
                callback(err);
            } else {
                console.log(f + " deleted.");
                deleteFiles(files, callback);
            }
        });
    }
}

module.exports = {
    deleteFile,
    deleteFiles,
    deleteDirectory,
    copyFile,
};
