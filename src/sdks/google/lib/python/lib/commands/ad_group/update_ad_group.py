from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand


from google.api_core import protobuf_helpers
from .ad_group_criterion_creators.ad_group_targeting_criterion_creator import AdGroupTargetingCriterionCreator
from .ad_group_criterion_creators.keywords_criterion_creator import KeywordsCriterionCreator

# command: update_ad_group


class ExecuteCommand(BaseCommand):
    def __create_ad_group_fields(self, ad_group_resource, criterion_data, creator_data, creator_instance):
        creator_instance.initiate(
            self, ad_group_resource, criterion_data, creator_data)
        creator_instance.start_creation()

        # Get location and language criterions for current campaign

    # Get adgroup initial criterions
    def __get_initial_criterions(self, ad_group_resource, criterion_types=["AGE_RANGE", "KEYWORD", "GENDER"]):

        __query = """
                SELECT
                    ad_group_criterion.resource_name
                FROM
                    ad_group_criterion
                WHERE 
                    ad_group_criterion.type IN :criterion_types and
                    ad_group_criterion.ad_group=':ad_group_resource'"""

        # ad_group_criterion.type IN ('LOCATION', 'LANGUAGE') and
        # map result row
        def __map_result_row(row):            
            return self.serialize(row.ad_group_criterion)

        # get unique criterion types
        def __set_unique_criterion_types(criterion_types):
            unique_values = []
            values = set(criterion_types)

            for value in values:
                unique_values.append(value)

            return unique_values

        # create tuple of fields
        def __create_type_condition_fields(criterion_types):
            # Filter unique criterion types
            criterion_types = __set_unique_criterion_types(criterion_types)

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
        
        # request
        responses = self.run_query(
            __query, {
                "ad_group_resource": ad_group_resource,
                "criterion_types": __create_type_condition_fields(criterion_types)
            })

        criterions = __response_to_campaigns(responses=responses)
        return criterions

    # Here will be updated the adgroup fields
    # [name, status]
    def __update_adgroup_fields(self, ad_group, update_data):
        # update name
        if("name" in update_data):
            ad_group.name = update_data["name"]

        # update status to  -> paused, removed, enabled
        if("status" in update_data):
            ad_group.status = self.get_enum(
                "AdGroupStatusEnum", update_data["status"]
            )

    # Remove the current adgroup's selected criterions
    def remove_ad_group_criterions(self, criterions, ad_group_criterion_service, ad_group_criterion_operation):
        if(len(criterions) > 0):
            # adgroup criterion remove operation
            for c in range(len(criterions)):
                for criterion_resource in criterions[c]:
                    ad_group_criterion_operation.remove = criterions[c][criterion_resource]

                    #Create request instance
                    request = self.create_request(
                        request_name="MutateAdGroupCriteriaRequest",
                        operation =  ad_group_criterion_operation
                    )

                    ad_group_criterion_service.mutate_ad_group_criteria(request=request)

    # create ad-group criterion if required
    def __create_criterion(self, criterion_data, ad_group_resource):

        # When criterion dont passed or doesn't array
        if (criterion_data is None) or (not isinstance(criterion_data, list)):
            return

        # Criterion can be array of criterions depending from ages
        for criterion in criterion_data:
            if "targeting" not in criterion and "keywords" not in criterion:
                continue

            # Targeting initiate
            if "targeting" in criterion:
                self.__create_ad_group_fields(
                    ad_group_resource=ad_group_resource,
                    criterion_data=criterion,
                    creator_data=criterion["targeting"],
                    creator_instance=AdGroupTargetingCriterionCreator(),
                )

            # Keywords initiate
            if "keywords" in criterion:
                self.__create_ad_group_fields(
                    ad_group_resource=ad_group_resource,
                    criterion_data=criterion,
                    creator_data=criterion["keywords"],
                    creator_instance=KeywordsCriterionCreator(),
                )

    # Loop in criterions and check what fields will be affected
    def __detect_criterions_fields(self, criterions_to_update):

        detectedFields = []

        for criterion in criterions_to_update:
            # check GENDER and AGE_RANGE existing
            if("targeting" in criterion):
                targeting = criterion["targeting"]

                # When gender key not detected but it exists in targeting
                if((not "GENDER" in detectedFields) and ("gender" in targeting)):
                    detectedFields.append("GENDER")

                # When ageRange key not detected but it exists in targeting
                if((not "AGE_RANGE" in detectedFields) and ("ageRange" in targeting)):
                    detectedFields.append("AGE_RANGE")

            # check KEYWORD existing
            if("keywords" in criterion):
                detectedFields.append("KEYWORD")

            # Break when all keys find
            if("AGE_RANGE" in detectedFields and "GENDER" in detectedFields and "KEYWORD" in detectedFields):
                break

        return detectedFields

    # Main update of adgroup and it's properties
    def __update_ad_group(self):
        ad_group_service = self.get_service("AdGroupService")
        ad_group_operation = self.get_type("AdGroupOperation")

        update_data = self.get_argument("data")

        # Get resource of updated campaign -> customers/{customer_id}/adGroups/{ad_group_id}
        ad_group_resource = self.get_resource_by_id(
            "adGroups", self.get_argument("adGroupId"))

        if("adGroup" in update_data):
            ad_group = ad_group_operation.update
            ad_group.resource_name = ad_group_resource

            # set new fields in operation
            # Can be modified only status and name
            self.__update_adgroup_fields(
                ad_group=ad_group,
                update_data=update_data["adGroup"]
            )

            # create mask
            field_mask = protobuf_helpers.field_mask(None, ad_group._pb)
            ad_group_operation.update_mask.CopyFrom(field_mask)

            #Create request instance
            request = self.create_request(
                request_name="MutateAdGroupsRequest",
                operation =  ad_group_operation
            )

            # Mutate the update adgroup
            ad_group_service.mutate_ad_groups(request=request)

        # When criterion dont passed or doesn't array
        if ("criterion" in update_data) and isinstance(update_data["criterion"], list):
            # get adgroup criterion service
            ad_group_criterion_service = self.get_service(
                "AdGroupCriterionService")

            # Get adgroup criterion operations
            ad_group_criterion_operation = self.get_type(
                "AdGroupCriterionOperation")

            # Get criterion types fields to past in query
            criterion_types = self.__detect_criterions_fields(update_data["criterion"])
        
            # We need to remove old criterions and create new
            initial_criterions = self.__get_initial_criterions(ad_group_resource, criterion_types)

            # Remove old criterions
            self.remove_ad_group_criterions(
                initial_criterions,
                ad_group_criterion_service,
                ad_group_criterion_operation
            )

            # Create new criterions
            self.__create_criterion(
                update_data["criterion"], ad_group_resource)

        return {"status": "success"}

    # start execution
    @override_method
    def start_execution(self):
        result = self.__update_ad_group()

        return result
