import re
import os
from PIL import Image as PilImage, ImageOps as PilImageOps
from .base_criterion_creator import BaseCriterionCreator
from ....decorators.abstract_class import abstract_class
from ....decorators.abstract_method import abstract_method
from .models.criterion_operation_item import CriterionOperationItem

@abstract_class
class BaseAdGroupCriterionCreator(BaseCriterionCreator):
    # create ad-group criterion operation instance
    def create_ad_group_criterion_operation(self):
        return self.create_criterion_operation(
            operation_type = "AdGroupCriterionOperation",
            parent_type = "ad_group",
            status_enum = "AdGroupCriterionStatusEnum",
        )

    # create ad-group criterions via api.
    def create_ad_group_operations(self, ad_group_criterion_operations, operation_name):
        self.create_operations(
            service_type = "AdGroupCriterionService",
            mutation_call_name = "mutate_ad_group_criteria",
            operations = ad_group_criterion_operations,
            operation_name = operation_name,
        )
