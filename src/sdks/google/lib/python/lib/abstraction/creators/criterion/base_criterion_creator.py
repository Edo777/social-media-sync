import re
import os
from PIL import Image as PilImage, ImageOps as PilImageOps
from ...base_execution import BaseExecution
from ....decorators.abstract_class import abstract_class
from ....decorators.abstract_method import abstract_method
from .models.criterion_operation_item import CriterionOperationItem

@abstract_class
class BaseCriterionCreator(BaseExecution):
    # start ad creation (must be overriden in child class)
    @abstract_method
    def start_creation(seld):
        abstract_method.override_error("start_creation")

    # initiate values
    def initiate(self, source, parent_resource, criterion_data, creator_data):
        self.clone_configs_from(source)
        self.parent_resource = parent_resource
        self.criterion_data = criterion_data
        self.creator_data = creator_data

    # create campaign criterion operation instance
    def create_criterion_operation(self, operation_type, parent_type, status_enum, apply_criterion = None):
        operation = self.get_type(operation_type)
        criterion = operation.create

        setattr(criterion, parent_type, self.parent_resource)
        criterion.status = self.get_enum(
            enum_name = status_enum,
            enum_field = self.criterion_data["status"],
        )

        if "exclude" in self.criterion_data and self.criterion_data["exclude"]:
            criterion.negative = True

        if apply_criterion is not None and callable(apply_criterion):
            apply_criterion(criterion)

        return CriterionOperationItem(
            operation = operation,
            criterion = criterion,
        )
    
    # Detect request name from [mutation_call_name]
    # ex. mutate_campaign_criteria -> MutateCampaignCriteriaRequest
    def __detect_request_name_from_call(self, call_name):
        name_list = call_name.split("_")
        request_name = ""
        for i in range(len(name_list)):
            request_name += name_list[i][0].upper() + name_list[i][1:]

        request_name += "Request"

        return request_name

    # create campaign criterions via api.
    def create_operations(self, service_type, mutation_call_name, operations, operation_name):
        if operations is None or len(operations) == 0:
            return

        service = self.get_service(service_type)
        call = getattr(service, mutation_call_name)
        if call is None or not callable(call):
            return

        request = self.create_request(
            request_name=self.__detect_request_name_from_call(mutation_call_name),
            operation = operations
        )
        
        call(request)
