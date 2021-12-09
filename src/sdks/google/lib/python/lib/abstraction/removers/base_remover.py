from ..base_execution import BaseExecution
from ...decorators.abstract_class import abstract_class
from ...decorators.abstract_method import abstract_method


@abstract_class
class BaseRemover(BaseExecution):
    # start ad creation (must be overriden in child class)
    @abstract_method
    def start_creation(self):
        abstract_method.override_error("start_creation")

    # Initiate config for current self
    def initiate(self, source):
        self.clone_configs_from(source)

    # Detect mutation function
    def __detect_mutate_cb(self, service, resource_type):
        cb = None

        if(resource_type == "campaign"):
            cb = service.mutate_campaigns
        elif(resource_type == "ad_group"):
            cb = cb = service.mutate_ad_groups
        elif(resource_type == "ad_group_ad"):
            cb = service.mutate_ad_group_ads

        return cb

    # resource_type can be (ad, campaign, adgroup)
    def __detect_remove_resource(self, resource_type):
        resources = {
            "ad_group_ad": {
                "operation": "AdGroupAdOperation",
                "service": "AdGroupAdService",
                "request_name": "MutateAdGroupAdsRequest"
            },
            "ad_group": {
                "operation": "AdGroupOperation",
                "service": "AdGroupService",
                "request_name": "MutateAdGroupsRequest"
            },
            "campaign": {
                "operation": "CampaignOperation",
                "service": "CampaignService",
                "request_name": "MutateCampaignsRequest"
            }
        }

        resource = dict(resources[resource_type])

        service = self.get_service(resource["service"])
        operation = self.get_type(resource["operation"])
        request_name = resource["request_name"]

        mutation_cb = self.__detect_mutate_cb(service, resource_type)

        return {
            "service": service,
            "operation": operation,
            "mutate": mutation_cb,
            "request_name": request_name
        }

    def remove(self, resource_name, resource_type):
        # Detect operation, service and mutate function of remove resource
        resource_instance = self.__detect_remove_resource(resource_type)

        # Detect service and operation
        instance_service = resource_instance["service"]
        instance_operation = resource_instance["operation"]
        request_name = resource_instance["request_name"]

        # create remove operation
        instance_operation.remove = resource_name

        # Select mutate function
        mutate_fn = resource_instance["mutate"]

        # Create request instance
        request = self.create_request(
            request_name=request_name,
            operation =  instance_operation
        )

        # Mutate
        mutate_fn(request=request)

        return {"status": "success"}
