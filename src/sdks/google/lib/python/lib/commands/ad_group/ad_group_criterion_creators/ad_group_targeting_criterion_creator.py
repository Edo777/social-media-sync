from ....decorators.override_method import override_method
from ....abstraction.creators.criterion.base_ad_group_criterion_creator import BaseAdGroupCriterionCreator

from .targeting_criterion_creators.age_range_criterion import AgeRangeCriterion
from .targeting_criterion_creators.geder_criterion import GenderCriterion

class AdGroupTargetingCriterionCreator(BaseAdGroupCriterionCreator):
    def __make_creator(self, creator, creator_data):
        creator.initiate(
            source = self,
            parent_resource = self.parent_resource,
            criterion_data = self.criterion_data,
            creator_data = creator_data
        )

        return creator.start_creation()

    def __targeting_age_range(self, age_range_value):
        return self.__make_creator(
            creator = AgeRangeCriterion(),
            creator_data = age_range_value,
        )

    def __targeting_gender(self, gender_value):
        return self.__make_creator(
            creator = GenderCriterion(),
            creator_data = gender_value,
        )

    @property
    def __targeting_calls(self):
        return  {
            "ageRange": self.__targeting_age_range,
            "gender": self.__targeting_gender,
        }

    # call targeting action
    def __call_targeting_action(self, targeting_call_key):
        targeting_call = self.__targeting_calls[targeting_call_key]
        targeting_data = self.creator_data[targeting_call_key]

        return targeting_call(targeting_data)
        
    # start creation
    @override_method
    def start_creation(self):
        for targeting_call_key in self.__targeting_calls:
            if targeting_call_key not in self.creator_data:
                continue

            new_operations = self.__call_targeting_action(targeting_call_key)
            self.create_ad_group_operations(new_operations, targeting_call_key)
