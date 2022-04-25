const express = require("express");
const router = express.Router();

// services
const { UserWebhookController } = require("../services");

// routes
router.get("/", UserWebhookController.webhookInit);

// Listen to events
router.post("/", UserWebhookController.webhookReceiver);

module.exports = router;

//$2b$10$lxP3xA/iwpOsvSl70g6eTusuEf8A6lW9D124leKLnfHlEVAzNjsr6