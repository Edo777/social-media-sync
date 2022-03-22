const { StatusSyncApiCalls } = require("../../shared/database/models");

/**
 * Create api call
 * @param {string} providerUserId 
 * @param {{
 * provider: "facebook" | "google" | "tiktok" | "..."
 * description: string
 * count: number
 * }} data 
 */
async function createApiCall(providerUserId, data) {
    const [instance, isNewRecord] = await StatusSyncApiCalls.findOrCreate({
        where: { providerUserId },
        defaults: {
            providerUserId,
            ...data
        },
    });

    if(!isNewRecord) {
        await instance.update({ count: data.count + instance.count });
    }

    return instance
}

module.exports = {
    createApiCall,
};
