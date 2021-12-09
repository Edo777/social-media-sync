from .....decorators.override_method import override_method
from .....abstraction.creators.criterion.base_ad_group_criterion_creator import BaseAdGroupCriterionCreator

class AgeRangeCriterion(BaseAdGroupCriterionCreator):
    # get type
    def __get_type(self):
        return self.get_enum(
            enum_name = "AgeRangeTypeEnum",
            enum_field = self.creator_data,
        )

    # start creation
    @override_method
    def start_creation(self):
        item = self.create_ad_group_criterion_operation()
        item.criterion.age_range.type_ = self.__get_type()
        return [item.criterion_operation]
