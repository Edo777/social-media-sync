from ....decorators.override_method import override_method
from ....abstraction.creators.criterion.base_ad_group_criterion_creator import BaseAdGroupCriterionCreator

class KeywordsCriterionCreator(BaseAdGroupCriterionCreator):
    # get unique values
    def __get_unique_values(self, arr):
        unique_values = []
        values = set(arr)

        for value in values:
            unique_values.append(value)

        return unique_values

    # unique and join keywords
    def __parse_keywords(self, keywords):
        unique_keywords = self.__get_unique_values(keywords)
        return " ".join(unique_keywords)

    def __set_keywords(self, criterion):
        criterion.keyword.text = self.__parse_keywords(
            keywords = self.creator_data["texts"],
        )

        criterion.keyword.match_type = self.get_enum(
            enum_name = "KeywordMatchTypeEnum",
            enum_field = self.creator_data["matchType"],
        )

    # start creation
    @override_method
    def start_creation(self):
        item = self.create_ad_group_criterion_operation()
        self.__set_keywords(item.criterion)

        service = self.get_service("AdGroupCriterionService")

        #Create request instance
        request = self.create_request(
            request_name="MutateAdGroupCriteriaRequest",
            operation =  item.criterion_operation
        )
        
        service.mutate_ad_group_criteria(request=request)
