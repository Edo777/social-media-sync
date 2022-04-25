const express = require("express");
const router = express.Router();

// services
const { AdAccountWebhookController } = require("../services");

// routes
router.get("/", AdAccountWebhookController.webhookInit);

// Listen to events
router.post("/", AdAccountWebhookController.webhookReceiver);

module.exports = router;

//$2b$10$lxP3xA/iwpOsvSl70g6eTusuEf8A6lW9D124leKLnfHlEVAzNjsr6