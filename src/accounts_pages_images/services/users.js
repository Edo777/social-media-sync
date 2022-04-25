const { Users } = require("../daos");
const {FACEBOOK_WEBHOOK_VERIFY_TOKEN} = process.env;

/**
 * Init the facebook webhook
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
async function webhookInit(req, res, next) {
    try {
        
        const hubMode = req.query["hub.mode"];
        const challenge = req.query["hub.challenge"];
        const verifyToken = req.query["hub.verify_token"];
        
        if(hubMode !== "subscribe" || FACEBOOK_WEBHOOK_VERIFY_TOKEN !== verifyToken) {
            return res.status(400).send("");
        }
        
        return res.status(200).send(challenge);
    } catch (error) {
        next(error);
    }
}

/**
 * Listen to ad account webhook
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
async function webhookReceiver(req, res, next) {
    try {
        
        console.log(JSON.stringify(req.body, null, 2));

        const result = await Users.processData(req.body);

        res.status(200).send("ok");
    } catch (error) {
        next(error);
    }
}

module.exports = {
    webhookInit,
    webhookReceiver
}