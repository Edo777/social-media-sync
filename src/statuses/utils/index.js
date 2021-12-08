const eventEmitters = require("./event-emitter");
const password = require("./password");
const token = require("./token");
const uploadStorage = require("./upload-file");
const fsActions = require("./fs-actions");

module.exports = {
    ...eventEmitters,
    password,
    token,
    uploadStorage,
    fsActions
}