from .....decorators.override_method import override_method
from .....abstraction.creators.criterion.base_campaign_criterion_creator import BaseCampaignCriterionCreator


class DevicePlatformCriterion(BaseCampaignCriterionCreator):
    # create operation instance
    def __create_operation(self, is_include, device_type):
        if device_type is None:
            return None

        item = self.create_campaign_criterion_operation(
            criterion_type=self.get_enum(
                enum_name="CriterionTypeEnum",
                enum_field="DEVICE",
            )
        )

        item.criterion.bid_modifier = 1
        item.criterion.device.type_ = device_type

        if(is_include != 1):
            item.criterion.bid_modifier = 0

        return item.criterion_operation

    # create geo criterion by country code
    def __create_device(self, is_include, device_type):
        return self.__create_operation(is_include, device_type)

    # start creation
    @override_method
    def start_creation(self):
        operations = []

        for device in self.creator_data:
            new_operation = self.__create_device(
                device["include"], device["value"])
            if new_operation is not None:
                operations.append(new_operation)

        return operations
