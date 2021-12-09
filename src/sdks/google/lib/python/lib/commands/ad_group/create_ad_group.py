from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

from .ad_group_criterion_creators.ad_group_targeting_criterion_creator import AdGroupTargetingCriterionCreator
from .ad_group_criterion_creators.keywords_criterion_creator import KeywordsCriterionCreator

# command: create_ad_group


class ExecuteCommand(BaseCommand):
    def __create_ad_group_fields(self, ad_group_resource, criterion_data, creator_data, creator_instance):
        creator_instance.initiate(
            self, ad_group_resource, criterion_data, creator_data)
        creator_instance.start_creation()

    # create ad-group
    def __create_ad_group(self):
        service = self.get_service("AdGroupService")
        operation = self.get_type("AdGroupOperation")

        ad_group_data = self.get_argument("adGroup")

        ad_group = operation.create
        ad_group.name = ad_group_data["name"]
        ad_group.campaign = self.get_resource_by_id(
            "campaigns", ad_group_data["campaignId"])
        ad_group.status = self.get_enum(
            enum_name="AdGroupStatusEnum",
            enum_field=ad_group_data["status"],
        )

        if "type" in ad_group_data:
             ad_group.type_ = self.get_enum(
                enum_name="AdGroupTypeEnum",
                enum_field=ad_group_data["type"],
            )
           
        request = self.create_request(
            request_name="MutateAdGroupsRequest",
            operation =  operation
        )

        response = service.mutate_ad_groups(request=request)
        return response.results[0].resource_name

    # create ad-group criterion if required
    def __create_criterion(self, ad_group_resource):
        criterion_data = self.get_argument("criterion")

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

    # start execution
    @override_method
    def start_execution(self):
        ad_group_resource = self.__create_ad_group()
        self.__create_criterion(ad_group_resource)

        return {
            "id": self.get_id_from_resource("adGroups", ad_group_resource)
        }
