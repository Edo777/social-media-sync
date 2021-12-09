import re
import os
from PIL import Image as PilImage, ImageOps as PilImageOps
from .base_criterion_creator import BaseCriterionCreator
from ....decorators.abstract_class import abstract_class
from ....decorators.abstract_method import abstract_method
from .models.criterion_operation_item import CriterionOperationItem

@abstract_class
class BaseCampaignCriterionCreator(BaseCriterionCreator):
    def __apply_criterion(self, criterion_type):
        def __set(criterion):
            criterion.type_ = criterion_type

        return __set

    # create campaign criterion operation instance
    def create_campaign_criterion_operation(self, criterion_type):
        return self.create_criterion_operation(
            operation_type = "CampaignCriterionOperation",
            parent_type = "campaign",
            status_enum = "CampaignCriterionStatusEnum",
            apply_criterion = self.__apply_criterion(criterion_type),
        )

    # create campaign criterions via api.
    def create_campaign_operations(self, campaign_criterion_operations, operation_name):
        self.create_operations(
            service_type = "CampaignCriterionService",
            mutation_call_name = "mutate_campaign_criteria",
            operations = campaign_criterion_operations,
            operation_name = operation_name,
        )
