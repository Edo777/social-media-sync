/** CLASS FUNCTIONALITY FOR (LOAD STATUSES OF ADS) */
const { GoogleCampaignDao, LocalCampaignDao, LocalAdDao } = require("../../../../daos");
const { getSdkByPlatform } = require("../../../../daos/remote/sdk");

class LogoutActions {
    constructor(userId, remoteUserId) {
        this.sdk = null;
        this.userId = userId;
        this.remoteUserId = remoteUserId;
    }

    /**
     * Set sdk params
     * @param {number} localCampaignId
     * @param {{
     *  userId: number
     *  clientCustomerId: number,
     *  loginCustomerId: number,
     * } | null} returnSdkFor
     */
    async setSdkParams(localCampaignId, returnSdkFor = null) {
        if (returnSdkFor) {
            const sdk = await getSdkByPlatform("google", returnSdkFor.userId);

            sdk.setClientCustomerId(returnSdkFor.clientCustomerId);
            sdk.setLoginCustomerId(returnSdkFor.loginCustomerId);

            return sdk;
        } else {
            this.sdk = await getSdkByPlatform("google", this.userId);
            await LocalCampaignDao.setGoogleSdkCustomerInfo(localCampaignId, this.sdk);
        }
    }

    // Pause all campaigns of user
    async pauseAllCampaigns() {
        const campaigns = await LocalCampaignDao.getGoogleCampaignsAffectedFromLogout(
            this.userId,
            this.remoteUserId,
            ["deletedAt"]
        );

        if (!campaigns.length) {
            return { status: "success", result: "not campaigns" };
        }

        const ads = [];
        campaigns.forEach((c) => {
            if (c.ads.length) {
                ads.push(...c.ads);
            }
        });

        if (!ads.length) {
            return { status: "success", result: "not ads" };
        }

        // Generate sdks
        const sdkList = {};
        for (let i = 0; i < ads.length; i++) {
            const {
                googleCampaignId,
                remoteAdId,
                googleAdgroupId,
                loginCustomerId,
                clientCustomerId,
                deletedAt,
            } = ads[i];

            if (
                !deletedAt &&
                googleCampaignId &&
                googleAdgroupId &&
                remoteAdId &&
                loginCustomerId &&
                clientCustomerId
            ) {
                const id = `${loginCustomerId}${clientCustomerId}`;

                if (!sdkList.hasOwnProperty(id)) {
                    sdkList[id] = {
                        sdk: null,
                        adsToPause: [],
                    };
                }

                if (!sdkList[id].sdk) {
                    sdkList[id].sdk = await this.setSdkParams(null, {
                        userId: this.userId,
                        clientCustomerId: clientCustomerId,
                        loginCustomerId: loginCustomerId,
                    });
                }

                sdkList[id].adsToPause.push({
                    campaignId: googleCampaignId.toString(),
                    adGroupId: googleAdgroupId.toString(),
                    adId: remoteAdId.toString(),
                });
            }
        }

        let resultOfPause = null;

        // Pause remotely
        if (Object.keys(sdkList)) {
            const promisesOfPause = [];
            Object.keys(sdkList).forEach((row) => {
                const { sdk, adsToPause } = sdkList[row];
                if (sdk && adsToPause.length) {
                    promisesOfPause.push(
                        GoogleCampaignDao.butchUpdateCampaignAdgroupAdStatus(
                            sdk,
                            adsToPause,
                            "PAUSED"
                        )
                    );
                }
            });

            // Execute update
            resultOfPause = await Promise.allSettled(promisesOfPause);
        }

        // set unactive ads
        await LocalAdDao._updateBySpecOptions(
            { isActive: false },
            {
                campaignId: campaigns.map((c) => c.id),
                provider: ["google-appinstall", "google-search", "google-display", "google-image"],
                isActive: true,
            },
            { paranoid: false }
        );

        // set unactive campaigns
        await LocalCampaignDao.updateCampaignByCondition(
            { id: campaigns.map((c) => c.id) },
            { googleIsActive: false },
            { paranoid: false }
        );

        return { status: "success", resultOfPause };
    }

    async execute() {
        // pause campaigns
        await this.pauseAllCampaigns();
    }
}

module.exports = LogoutActions;
