import re
import datetime

from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

from .campaign_creators.app_campaign_creator import AppCapaignCreator
from .campaign_creators.campaign_targeting_criterion_creator import CampaignTargetingCriterionCreator

# command: create_campaign


class ExecuteCommand(BaseCommand):
    def __create_campaign_fields(self, campaign_resource, criterion_data, creator_data, creator_instance):
        creator_instance.initiate(
            self, campaign_resource, criterion_data, creator_data)
        return creator_instance.start_creation()

    # create campaign budget
    def __create_budget(self, client):
        # Get fields which comes from node
        campaign_data = self.get_argument("campaign")
        budget_data = self.get_argument("budget")
        
        # Get service (Default version=v6)
        service = self.get_service("CampaignBudgetService")

        # Get operation type (Default version=v8)
        operation = self.get_type("CampaignBudgetOperation")

        # Set operation action
        campaign_budget = operation.create

        # Set oprtaion fields (go to ResourseService => and search mutates)
        campaign_budget.name = self.append_name(
            "Budget for campaign '%s'" % campaign_data["name"])
        campaign_budget.amount_micros = budget_data["amountMicros"]
        campaign_budget.explicitly_shared = budget_data["explicitlyShared"]
        campaign_budget.delivery_method = self.get_enum("BudgetDeliveryMethodEnum", budget_data["deliveryMethod"])

        campaign_budget.type_ = self.get_enum("BudgetTypeEnum", budget_data["type"])
        campaign_budget.status = self.get_enum("BudgetStatusEnum", budget_data["status"])
        campaign_budget.period = self.get_enum("BudgetPeriodEnum", budget_data["period"])

        # Create request instance
        request = self.create_request(
            request_name="MutateCampaignBudgetsRequest",
            operation =  operation
        )

        # MutateCampaignBudgets => mutate_campaign_budgets (search in services)
        response = service.mutate_campaign_budgets(request=request)
        return response.results[0].resource_name

    # create campaign bidding strategy
    def __create_bidding_strategy(self):
        client = self.get_google_ads_client()
        
        # Get data coming from node
        bidding_strategy_data = self.get_argument("biddingStrategy")
        if bidding_strategy_data is None:
            return None

        # Get data coming from node
        campaign_data = self.get_argument("campaign")

        service = self.get_service("BiddingStrategyService")
        operation = self.get_type("BiddingStrategyOperation")

        bidding_strategy = operation.create
        bidding_strategy.name = self.append_name(
            "Bs for campaign '%s'" % campaign_data["name"])

        # Set bidding strategy type
        bidding_strategy.type_ = self.get_enum(
            enum_name="BiddingStrategyTypeEnum", 
            enum_field=bidding_strategy_data["type"]
        )

        # when we need (maximize clicks) with bid limitation
        if "cpcBidCeilingMicros" in bidding_strategy_data:
            bidding_strategy.target_spend.cpc_bid_ceiling_micros = bidding_strategy_data[
                "cpcBidCeilingMicros"]
        
        # when we need (maximize clicks)
        if "targetSpendMicros" in bidding_strategy_data:
            bidding_strategy.target_spend.target_spend_micros=bidding_strategy_data["targetSpendMicros"]

        if "targetCpaMicros" in bidding_strategy_data:
            bidding_strategy.target_cpa.target_cpa_micros = bidding_strategy_data[
                "targetCpaMicros"]
            bidding_strategy.target_cpa.cpc_bid_ceiling_micros = bidding_strategy_data[
                "targetCpaMicros"]

        # Create request instance
        request = self.create_request(
            request_name="MutateBiddingStrategiesRequest",
            operation =  operation
        )

        # Execute request
        response = service.mutate_bidding_strategies(request=request)
        return response.results[0].resource_name

    # fill campaign data based on advertising channel type
    def __create_campaign_instance(self, campaign):
        # Now only for specific fields in campaign
        creators_list = {
            "appSettings": AppCapaignCreator,
        }

        for key in creators_list:
            creator_data = self.get_argument(key)
            if creator_data is None:
                continue

            creator_class = creators_list[key]
            creator_instance = creator_class()

            ##
            # The initiate function will copy configs from here to creator_instance
            # It will be doing in each command
            ##
            creator_instance.initiate(self, campaign, creator_data)
            creator_instance.start_creation()

    # create campaign with previously created budget
    def __create_campaign(self, budget_resource_name, bidding_strategy_resource):
        client = self.get_google_ads_client()

        campaign_data = self.get_argument("campaign")

        # Detect tart_time of campaign
        start_time = datetime.datetime.fromtimestamp(campaign_data["startDate"] / 1000)
        
        # continuesly
        if((not "endDate" in campaign_data) or (campaign_data["endDate"] == 0) or (not campaign_data["endDate"])):
            # set to end_date +16 years
            now = datetime.datetime.now()
            end_year = (now.year) + 16
            campaign_data["endDate"] = datetime.datetime(
                int(end_year), 12, 30).timestamp() * 1000

        # Detect end_date of campaign
        end_time = datetime.datetime.fromtimestamp(campaign_data["endDate"] / 1000)

        service = self.get_service("CampaignService")
        operation = self.get_type("CampaignOperation")

        # Start campaign creation
        campaign = operation.create
        campaign.campaign_budget = budget_resource_name

        if bidding_strategy_resource is not None:
            campaign.bidding_strategy = bidding_strategy_resource
        # else:
        #     # https://ads-developers.googleblog.com/2020/
        #     campaign.target_spend.target_spend_micros=0

        campaign.name = campaign_data["name"]
        
        # Set advertising Channel Type
        campaign.advertising_channel_type = self.get_enum(
            enum_name="AdvertisingChannelTypeEnum",
            enum_field=campaign_data["advertisingChannelType"]
        )

        # Set advertising Channel Sub Type
        if "advertisingChannelSubType" in campaign_data:
            campaign.advertising_channel_sub_type = self.get_enum(
                enum_name="AdvertisingChannelSubTypeEnum",
                enum_field=campaign_data["advertisingChannelSubType"]
            )

        # Set campaign status
        campaign.status = self.get_enum(
            enum_name="CampaignStatusEnum", 
            enum_field=campaign_data["status"]
        )

        # Set start_date and end_date
        campaign.start_date = datetime.date.strftime(start_time, "%Y%m%d")
        campaign.end_date = datetime.date.strftime(end_time, "%Y%m%d")

        # Get Criterion data
        criterion_data = self.get_argument("criterion")

        # Set geo targeting
        if "targeting" in criterion_data and "geo" in criterion_data["targeting"]:
            settings = campaign.geo_target_type_setting

            settings.positive_geo_target_type = self.get_enum(
                enum_name="PositiveGeoTargetTypeEnum",
                enum_field="PRESENCE_OR_INTEREST",
            )

            settings.negative_geo_target_type = self.get_enum(
                enum_name="NegativeGeoTargetTypeEnum",
                enum_field="PRESENCE",
            )

        # Create instance of campaign
        self.__create_campaign_instance(campaign)

        # Create campaign mutate request
        request = self.create_request(
            request_name="MutateCampaignsRequest",
            operation =  operation
        )

        # Execute request
        response = service.mutate_campaigns(request=request)
        return response.results[0].resource_name

    # create campaign criterion if required
    def __create_criterion(self, campaign_resource):
        criterion_data = self.get_argument("criterion")
        if criterion_data is None:
            return

        if "targeting" not in criterion_data:
            return

        if "targeting" in criterion_data:
            self.__create_campaign_fields(
                campaign_resource=campaign_resource,
                criterion_data=criterion_data,
                creator_data=criterion_data["targeting"],
                creator_instance=CampaignTargetingCriterionCreator(),
            )

    # start execution
    @override_method
    def start_execution(self):
        # Get google ads current client
        client = self.get_google_ads_client()

        # Create Budget resource for campaign
        budget_resource_name = self.__create_budget(client)
        bidding_strategy_resource_name = self.__create_bidding_strategy()

        campaign_resource_name = self.__create_campaign(
            budget_resource_name=budget_resource_name,
            bidding_strategy_resource=bidding_strategy_resource_name,
        )

        self.__create_criterion(campaign_resource_name)

        return {
            "id": self.get_id_from_resource("campaigns", campaign_resource_name)
        }
