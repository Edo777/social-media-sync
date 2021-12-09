from .....decorators.override_method import override_method
from .....abstraction.creators.criterion.base_campaign_criterion_creator import BaseCampaignCriterionCreator

class LanguageCriterion(BaseCampaignCriterionCreator):
    __language_service_instance = None

    @property
    def __service(self):
        if self.__language_service_instance is None:
            self.__language_service_instance = self.get_service("LanguageConstantService")
        
        return self.__language_service_instance

    # create operation instance
    def __create_operation(self, language_id):
        if language_id is None:
            return None

        item = self.create_campaign_criterion_operation(
            criterion_type = self.get_enum(
                enum_name = "CriterionTypeEnum",
                enum_field = "LANGUAGE",
            )
        )

        language_constant_path = self.__service.language_constant_path(language_id)
        item.criterion.language.language_constant = language_constant_path

        return item.criterion_operation

    # get language id by language code
    def __get_language_id(self, language_code):
        query = """
            SELECT
                language_constant.id
            FROM
                language_constant
            WHERE
                language_constant.targetable = true
                AND
                language_constant.code LIKE '%%:language_code%%'
        """

        responses = self.run_query(query, {
            "language_code": language_code,
        })

        results = self.loop_result(
            responses = responses,
            callback = lambda row: row.language_constant.id
        )

        if len(results) == 0:
            return None

        return results[0]

    def __create_language(self, language_code):
        language_id = self.__get_language_id(language_code)
        if language_id is None:
            return None

        return self.__create_operation(language_id)

    # start creation
    @override_method
    def start_creation(self):
        operations = []
        
        for language_code in self.creator_data:
            new_operation = self.__create_language(language_code)
            if new_operation is None:
                continue

            operations.append(new_operation)

        return operations
