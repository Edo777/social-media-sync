from ....decorators.override_method import override_method
from ....abstraction.creators.base_campaign_creator import BaseCampaignCreator

class AppCapaignCreator(BaseCampaignCreator):
    # set target cpa info
    def __set_target_cpa_info(self):
        if("targetCpa" in self.campaign_data):
            target_cpa = self.campaign_data["targetCpa"]

            if "targetCpaMicros" in target_cpa:
                self.campaign.target_cpa.target_cpa_micros = target_cpa["targetCpaMicros"]

            if "cpcBidCeilingMicros" in target_cpa:
                self.campaign.target_cpa.cpc_bid_ceiling_micros = target_cpa["cpcBidCeilingMicros"]

            if "cpcBidFloorMicros" in target_cpa:
                self.campaign.target_cpa.cpc_bid_floor_micros = target_cpa["cpcBidFloorMicros"]

    #set app campaign specfic info
    def __set_app_settings(self):
        settings = self.campaign.app_campaign_setting

        if("appId" in self.campaign_data):
            settings.app_id = self.campaign_data["appId"]

        if("biddingStrategyGoalType" in self.campaign_data):
            settings.bidding_strategy_goal_type = self.get_enum(
                enum_name = "AppCampaignBiddingStrategyGoalTypeEnum",
                enum_field = self.campaign_data["biddingStrategyGoalType"],
            )

        if("appStore" in self.campaign_data):
            settings.app_store = self.get_enum(
                enum_name = "AppCampaignAppStoreEnum",
                enum_field = self.campaign_data["appStore"],
            )

    # start creation
    @override_method
    def start_creation(self):
        self.__set_target_cpa_info()
        self.__set_app_settings()
