const path = require("path");
const fs = require("fs");

const modulesPath = path.join(__dirname, "..", "..", "modules");

const builtinModules = ["app"];
const externalModules = fs
    .readdirSync(modulesPath, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .filter((item) => !builtinModules.includes(item));

module.exports = {
    all: [...builtinModules, ...externalModules],
    builtin: builtinModules,
    external: externalModules,
};
