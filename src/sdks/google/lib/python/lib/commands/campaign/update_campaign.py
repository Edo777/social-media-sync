import datetime

from google.api_core import protobuf_helpers
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

    # Get initial campaign
    def __get_initial_campaign(self):
        __query = """
            SELECT
                campaign.id,
                campaign.campaign_budget
            FROM
                campaign
            WHERE 
                campaign.id=:id"""
        # map result row

        def __map_result_row(row):
            return self.serialize(row.campaign)

        # convert response to serialized campaigns list
        def __response_to_campaigns(responses):
            return self.loop_result(
                responses=responses,
                callback=lambda row: __map_result_row(row)
            )

        responses = self.run_query(__query, {
            "id": self.get_argument("campaignId")
        })

        campaign = __response_to_campaigns(responses=responses)
        return campaign[0]

    # Here will be updated the campaign fields
    # [name, status, start_date, end_date]
    def __update_campaign_fields(self, campaign, update_data):
        # update name
        if("name" in update_data):
            campaign.name = update_data["name"]

        # update status to  -> paused, removed, enabled
        if("status" in update_data):
            campaign.status = self.get_enum(
                "CampaignStatusEnum", update_data["status"])

        # update start_date
        if("startDate" in update_data):
            start_time = datetime.datetime.fromtimestamp(
                update_data["startDate"] / 1000)
            campaign.start_date = datetime.date.strftime(start_time, "%Y%m%d")

        # update end_date
        if("endDate" in update_data):
            if(update_data["endDate"] == 0):
                # set to end_date +16 years
                now = datetime.datetime.now()
                end_year = (now.year) + 16
                update_data["endDate"] = datetime.datetime(
                    int(end_year), 12, 30).timestamp() * 1000

            end_time = datetime.datetime.fromtimestamp(
                update_data["endDate"] / 1000)
            campaign.end_date = datetime.date.strftime(end_time, "%Y%m%d")

    # Here will be updated the campaign's budget fields
    # [period, amount_micros]
    def __update_campaign_budget_fields(self, budget, update_data):
        if("amountMicros" in update_data):
            budget.amount_micros = update_data["amountMicros"]

        if("period" in update_data):
            budget.period = self.get_enum(
                "BudgetPeriodEnum", update_data["period"])

    # Get location and language criterions for current campaign
    def __get_initial_criterions(self, campaign_resource, criterion_types=['LOCATION', 'LANGUAGE', 'DEVICE']):
        __query = """
                SELECT
                    campaign_criterion.resource_name,
                    campaign_criterion.type
                FROM
                    campaign_criterion
                WHERE 
                    campaign_criterion.type IN :criterion_types and
                    campaign_criterion.campaign=':campaign_resource'"""

        # map result row
        def __map_result_row(row):
            return self.serialize(row.campaign_criterion)

        # create tuple of fields
        def __create_type_condition_fields(criterion_types):
            fields = '('
            for t in criterion_types:
                fields += t

                if(t != criterion_types[-1]):
                    fields += ','

            return fields + ')'

        # convert response to serialized campaigns list

        def __response_to_campaigns(responses):
            return self.loop_result(
                responses=responses,
                callback=lambda row: __map_result_row(row)
            )

        responses = self.run_query(
            __query, {
                "campaign_resource": campaign_resource,
                "criterion_types": __create_type_condition_fields(criterion_types)
            })

        criterions = __response_to_campaigns(responses=responses)
        return criterions
    
    # Remove the current campaign's selected criterions
    def remove_campaign_criterions(self, criterions, campaign_criterion_service, campaign_criterion_operation):
        if(len(criterions) > 0):
            # campaign criterion remove operation
            for c in range(len(criterions)):
                campaign_criterion_operation.remove = criterions[c]["resourceName"]

                request = self.create_request(
                    request_name="MutateCampaignCriteriaRequest",
                    operation =  campaign_criterion_operation
                )

                campaign_criterion_service.mutate_campaign_criteria(request=request)

    # Remove Bid modifiers
    def remove_campaign_bid_modifiers(self, device_criterions, campaign_bid_mod_service, campaign_bid_mod_operation):
        if(len(device_criterions) > 0):
            # campaign criterion remove operation
            for c in range(len(device_criterions)):

                campaign_bid_mod_operation.remove = device_criterions[c].resource_name

                request = self.create_request(
                    request_name="MutateCampaignBidModifiersRequest",
                    operation =  campaign_bid_mod_operation
                )

                campaign_bid_mod_service.mutate_campaign_bid_modifiers(request=request)

    # Check what fields will be affected
    def __detect_criterions_fields(self, targeting):
        detectedFields = []

        # check location existing
        if("geo" in targeting and "countries" in targeting["geo"] and isinstance(targeting["geo"]["countries"], list)):
            detectedFields.append('LOCATION')

        # check language existing
        if("locales" in targeting):
            detectedFields.append('LANGUAGE')

        # Check device targeting
        if("devices" in targeting):
            detectedFields.append('DEVICE')

        return detectedFields

    # Filter and return only criterions which type isn't DEVICE
    def __detect_criterions(self, criterions):
        detected_criterions = []
        for c in range(len(criterions)):
            # device_enum = self.get_enum(enum_name="CriterionTypeEnum", enum_field="DEVICE")
            if(criterions[c]["type"] != "DEVICE"):
                detected_criterions.append(criterions[c])
        return detected_criterions

    # Main update of campaign and it's properties
    def __update_campaign(self):
        update_data = self.get_argument("data")

        # Get resource of updated campaign -> customers/{customer_id}/campaigns/{campain_id}
        campaign_resource = self.get_resource_by_id(
            "campaigns", self.get_argument("campaignId"))

        initial_campaign = self.__get_initial_campaign()

        # get campaign service and campaign operations
        campaign_service = self.get_service("CampaignService")
        campaign_operation = self.get_type("CampaignOperation")
        campaign = campaign_operation.update

        # campaign update operation
        campaign.resource_name = campaign_resource

        # can only update campain's ->
        # [name, status, start_date, end_date] fields
        if("campaign" in update_data):
            self.__update_campaign_fields(
                campaign=campaign,
                update_data=update_data["campaign"]
            )

        # Here will be updated the campaign's budget fields ->
        # [period, amount_micros]
        if("budget" in update_data):
            # get campaign budget service
            campaign_budget_service = self.get_service("CampaignBudgetService")

            # get campaign budget operation
            campaign_budget_operation = self.get_type(
                "CampaignBudgetOperation")

            # campaign budget update operation
            budget = campaign_budget_operation.update

            # select budget resource_name from initial campaign
            budget.resource_name = initial_campaign["campaignBudget"] 

            # update budget fields
            self.__update_campaign_budget_fields(
                budget=budget,
                update_data=update_data["budget"]
            )

            # create mask
            field_mask = protobuf_helpers.field_mask(None, budget._pb)
            campaign_budget_operation.update_mask.CopyFrom(field_mask)

            #Create request instance
            request = self.create_request(
                request_name="MutateCampaignBudgetsRequest",
                operation =  campaign_budget_operation
            )

            # execute budget update
            campaign_budget_service.mutate_campaign_budgets(request=request)

        # Update criterions
        # 1. Get initial criterion of that campaign
        # 2. remove criterions
        # 3. Create new
        if(("criterion" in update_data) and ("targeting" in update_data["criterion"])):
            # get campaign criterion service
            campaign_criterion_service = self.get_service(
                "CampaignCriterionService")

            # Get campaign criterion operations
            campaign_criterion_operation = self.get_type(
                "CampaignCriterionOperation")

            # Get criterion types fields to past in query
            criterion_types = self.__detect_criterions_fields(
                targeting=update_data["criterion"]["targeting"])

            # We need to remove old criterions and create new
            criterions = self.__get_initial_criterions(
                campaign_resource, criterion_types)

            # Detect only campaign's level criterions
            campaign_criterions = self.__detect_criterions(criterions)
            # device_criterions = self.__detect_modifiers(criterions)

            if(len(campaign_criterions) != 0):
                self.remove_campaign_criterions(
                    campaign_criterions,
                    campaign_criterion_service,
                    campaign_criterion_operation
                )

            # if(len(device_criterions) != 0):
            #     campaign_bid_mod_service = self.get_service(
            #         "CampaignBidModifierService")

            #     campaign_bid_mod_operation = self.get_type(
            #         "CampaignBidModifierOperation")

            #     self.remove_campaign_bid_modifiers(
            #         device_criterions,
            #         campaign_bid_mod_service,
            #         campaign_bid_mod_operation
            #     )

            self.__create_campaign_fields(
                campaign_resource=campaign_resource,
                criterion_data=update_data["criterion"],
                creator_data=update_data["criterion"]["targeting"],
                creator_instance=CampaignTargetingCriterionCreator(),
            )

        # Update campaign app settings
        # NOW WE CAN'T UPDATE THAT SECTION
        if("appSettings" in update_data):
            # Now only for specific fields in campaign
            creators_list = {
                "appSettings": AppCapaignCreator,
            }

            for key in creators_list:
                updator_data = update_data[key]
                if updator_data is None:
                    continue

                creator_class = creators_list[key]
                creator_instance = creator_class()

                ##
                # The initiate function will copy configs from here to creator_instance
                # It will be doing in each command
                ##
                creator_instance.initiate(self, campaign, updator_data)
                creator_instance.start_creation()

        # save campaign
        field_mask = protobuf_helpers.field_mask(None, campaign._pb)
        campaign_operation.update_mask.CopyFrom(field_mask)

        #Create request instance
        request = self.create_request(
            request_name="MutateCampaignsRequest",
            operation =  campaign_operation
        )

        campaign_service.mutate_campaigns(request=request)

        return {"status": "success"}

    # start execution
    @override_method
    def start_execution(self):
        info = self.__update_campaign()
        return info
