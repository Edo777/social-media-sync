from ....decorators.override_method import override_method
from ....abstraction.creators.criterion.base_campaign_criterion_creator import BaseCampaignCriterionCreator

from .targeting_criterion_creators.location_criterion import LocationCriterion
from .targeting_criterion_creators.language_criterion import LanguageCriterion
from .targeting_criterion_creators.device_platform_criterion import DevicePlatformCriterion

class CampaignTargetingCriterionCreator(BaseCampaignCriterionCreator):
    def __make_creator(self, creator, creator_data):
        creator.initiate(
            source = self,
            parent_resource = self.parent_resource,
            criterion_data = self.criterion_data,
            creator_data = creator_data
        )

        return creator.start_creation()

    def __targeting_language(self, language_value):
        return self.__make_creator(
            creator = LanguageCriterion(),
            creator_data = language_value,
        )

    def __targeting_geographic(self, location_value):
        return self.__make_creator(
            creator = LocationCriterion(),
            creator_data = location_value,
        )
    
    def __targeting_device_platforms(self, device_value):
        return self.__make_creator(
            creator = DevicePlatformCriterion(),
            creator_data = device_value,
        )

    @property
    def __targeting_calls(self):
        return  {
            "locales": self.__targeting_language,
            "geo": self.__targeting_geographic,
            "devices": self.__targeting_device_platforms
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
            self.create_campaign_operations(new_operations, targeting_call_key)
