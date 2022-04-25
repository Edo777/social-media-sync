const express = require("express");
const router = express.Router();

// routes
router.use("/ad-accounts", require("./ad-accounts"));
router.use("/users", require("./users"));

module.exports = {
    prefix: "/webhooks",
    router: router,
};