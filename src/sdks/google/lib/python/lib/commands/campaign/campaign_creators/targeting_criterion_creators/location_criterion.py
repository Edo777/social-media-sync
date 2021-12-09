from .....decorators.override_method import override_method
from .....abstraction.creators.criterion.base_campaign_criterion_creator import BaseCampaignCriterionCreator

class LocationCriterion(BaseCampaignCriterionCreator):
    __TYPE_COUNTRIES = "location@countries"
    __TYPE_CITIES = "location@cities"

    __geo_service_instance = None

    @property
    def __service(self):
        if self.__geo_service_instance is None:
            self.__geo_service_instance = self.get_service("GeoTargetConstantService")
        
        return self.__geo_service_instance

    # create operation instance
    def __create_operation(self, location_id):
        if location_id is None:
            return None

        item = self.create_campaign_criterion_operation(
            criterion_type = self.get_enum(
                enum_name = "CriterionTypeEnum",
                enum_field = "LOCATION",
            )
        )

        geo_constant_path = self.__service.geo_target_constant_path(location_id)
        item.criterion.location.geo_target_constant = geo_constant_path
        
        return item.criterion_operation

    # search and get location id
    def __get_location_id(self, search_term, search_type):
        location_names = self.get_type("SuggestGeoTargetConstantsRequest").LocationNames()
        location_names.names.extend([search_term])

        if self.__TYPE_COUNTRIES == search_type:
             # Create request
            request = self.create_request(
                request_name="SuggestGeoTargetConstantsRequest",
                attributes = {
                    "locale":"en",
                    "location_names" : location_names,
                },
                set_customer_id = False
            )   

            results = self.__service.suggest_geo_target_constants(request=request)
            
            for suggestion in results.geo_target_constant_suggestions:
                geo_target_constant = suggestion.geo_target_constant
                if geo_target_constant.country_code == search_term:
                    return geo_target_constant.id

            return None

        if self.__TYPE_CITIES == search_type:
            # TODO: check cities
            return None

        return None

    # create geo criterion by country code
    def __create_country(self, country_code):
        location_id = self.__get_location_id(country_code, self.__TYPE_COUNTRIES)
        return self.__create_operation(location_id)

    # start creation
    @override_method
    def start_creation(self):
        operations = []

        if "countries" in self.creator_data:
            for country_code in self.creator_data["countries"]:
                new_operation = self.__create_country(country_code)
                if new_operation is not None:
                    operations.append(new_operation)

        # TODO: check cities

        return operations
