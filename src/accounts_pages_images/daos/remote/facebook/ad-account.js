const { getSdkByRemoteUser } = require("../../global/sdk");

/**
 * Set taked result to accounts
 * @param {[{ id: string, ownerId: string }]} accounts
 * @param {object} result  => {[adAccountOwnerId] : "logo" | "error"}
 * @returns {[{ id: string, ownerId: string , logo: string }]}
 */
function setResultToAccounts(accounts, result) {
    if (!Object.keys(result).length) {
        return;
    }

    accounts.forEach((account) => {
        const owner = account["adAccountOwnerId"];
        if (result[owner]) {
            account["adAccountIcon"] = result[ownerId];
        }
    });

    return accounts;
}

/**
 * Batch Load pictures of accounts
 * @param {[{ id: string, ownerId }]} adAccounts
 * @param {any} sdk
 * @returns {{ownerId: "logo" | "error"} | [{ id: string, ownerId, logo: string }]}
 */
 async function getAccountsPicturesBatch(adAccounts, sdk, setResultToAccountsCB = null) {
    const groupedAdAccounts = _.groupBy(adAccounts, "adAccountOwnerId");

    const picturePromises = [];
    const adAccountsOwners = [];
    const result = {};

    Object.keys(groupedAdAccounts).forEach((owner) => {
        adAccountsOwners.push(owner);
        result[owner] = "error";
        picturePromises.push(sdk.getPicture(owner));
    });

    // Get pictures of accounts
    if (picturePromises.length) {
        const promiseResults = await Promise.allSettled(picturePromises);

        // Set result depending from promise status
        promiseResults.forEach((res, i) => {
            const owner = adAccountsOwners[i];
            if (result[owner] === "error" && res.status === "fulfilled") {
                result[owner] = res.value;
            }
        });
    }

    if (setResultToAccountsCB) {
        setResultToAccountsCB(adAccounts, result);
    }

    return result;
}

/**
 * Set adAccountIcon in ad Accounts
 * @param {[{ id: string, remoteId: string, ownerId: string, platformUserId: string }]} adAccounts
 * @param {FacebookSDK} sdk
 */
 async function setAdAccountsPictures(adAccounts, sdk = null) {
    if (!adAccounts || !adAccounts.length) {
        return;
    }

    if (sdk && sdk.authData && sdk.authData.facebookAccessToken) {
        return await getAccountsPicturesBatch(adAccounts, sdk, setResultToAccounts);
    }

    // Group accounts by remote user
    const groupedAdAccounts = _.groupBy(adAccounts, "platformUserId");

    for (const remoteUserId in groupedAdAccounts) {
        // Get sdk for remote user
        const sdk = await getSdkByRemoteUser("facebook", remoteUserId);

        if (sdk && sdk.authData && sdk.authData.facebookAccessToken) {
            // Get pictures result
            const result = await getAccountsPicturesBatch(groupedAdAccounts[remoteUserId], sdk);

            // Set that result to adAccounts original array
            setResultToAccounts(adAccounts, result);
        }
    }
}

module.exports = {
    setAdAccountsPictures
};


