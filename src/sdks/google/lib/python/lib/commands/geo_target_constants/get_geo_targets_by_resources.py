from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

class ExecuteCommand(BaseCommand):
    __geo_service_instance = None

    @property
    def __service(self):
        if self.__geo_service_instance is None:
            self.__geo_service_instance = self.get_service("GeoTargetConstantService")
        
        return self.__geo_service_instance
    
    # search and get locations
    def __get_locations(self, resources):
        location_geo_targets = self.get_type("SuggestGeoTargetConstantsRequest").GeoTargets()
        location_geo_targets.geo_target_constants.extend(resources)

        # Create request
        request = self.create_request(
            request_name = "SuggestGeoTargetConstantsRequest",
            set_customer_id =  False,
            attributes =  {
                "locale":"en",
                "geo_targets" : location_geo_targets,
            })

        results = self.__service.suggest_geo_target_constants(request=request)
        
        constants = []
        for suggestion in results.geo_target_constant_suggestions:
            geo_target_constant = suggestion.geo_target_constant

            constants.append({
                "name": geo_target_constant.name,
                "resourceName": geo_target_constant.resource_name,
                "targetType": geo_target_constant.target_type,
                "id" : geo_target_constant.id
            })

        return constants

    @override_method
    def start_execution(self):
        resources = self.get_argument("resources")
        result = self.__get_locations(resources)

        return result