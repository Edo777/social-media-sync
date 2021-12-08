const rabbit = require("../../rabbit");

/**
 * Emit event to rabbit queue
 * @param {string} event 
 * @param {any} data 
 */
async function emitMQ(event, data) {
    const broker = await rabbit.getInstance()
    await broker.send(event, Buffer.from(JSON.stringify(data)));
}

module.exports = {
    emitMQ
}