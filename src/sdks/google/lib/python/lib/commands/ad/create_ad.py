from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand
from ...exceptions.invalid_arguments_exception import InvalidArgumentsException

from .ad_creators.responsive_search_ad_creator import ResponsiveSearchAdCreator
from .ad_creators.responsive_display_ad_creator import ResponsiveDisplayAdCreator
from .ad_creators.app_ad_creator import AppAdCreator
from .ad_creators.image_ad_creator import ImageAdCreator
from .ad_creators.display_upload_ad_creator import DisplayUploadAdCreator

# command: create_ad
class ExecuteCommand(BaseCommand):
    # create ad instance
    def __create_ad_instance(self, ad):
        ad_data = self.get_argument("ad")

        if "finalUrls" in ad_data:
            final_urls = ad_data["finalUrls"]
            for final_url in final_urls:
                ad.final_urls.append(final_url)
        
        if "name" in ad_data and ad_data["type"] != "RESPONSIVE_SEARCH_AD":
            ad.name = ad_data["name"]

        creators_list = {
            "RESPONSIVE_SEARCH_AD": {
                "creator_class": ResponsiveSearchAdCreator,
                "argument_key": "responsiveSearchAd",
            },
            "RESPONSIVE_DISPLAY_AD": {
                "creator_class": ResponsiveDisplayAdCreator,
                "argument_key": "responsiveDisplayAd",
            },
            "APP_AD": {
                "creator_class": AppAdCreator,
                "argument_key": "appAd",
            },
            "IMAGE_AD": {
                "creator_class": ImageAdCreator,
                "argument_key": "imageAd",
            },
            "HTML5_UPLOAD_AD": {
                "creator_class": DisplayUploadAdCreator,
                "argument_key": "displayUploadAd",
            }
        }

        if ad_data["type"] not in creators_list:
            message = "Ad type '%s' is not valid or method is not implemented."
            raise InvalidArgumentsException(message % ad_data["type"])
        
        creator_info = creators_list.get(ad_data["type"])
        creator_class = creator_info["creator_class"]
        creator_args = ad_data[creator_info["argument_key"]]

        creator = creator_class()
        creator.initiate(self, ad, creator_args)
        creator.start_creation()

    # create ad_group ad association
    def __create_ad_group_ad(self):
        service = self.get_service("AdGroupAdService")
        operation = self.get_type("AdGroupAdOperation")

        ad_group_ad_data = self.get_argument("adGroupAd")

        ad_group_ad = operation.create
        ad_group_ad.ad_group = self.get_resource_by_id("adGroups", ad_group_ad_data["adGroupId"])
        ad_group_ad.status = self.get_enum("AdGroupAdStatusEnum", ad_group_ad_data["status"])
        self.__create_ad_instance(ad_group_ad.ad)

        request = self.create_request(
            request_name="MutateAdGroupAdsRequest",
            operation =  operation
        )

        response = service.mutate_ad_group_ads(request=request)
        return response.results[0].resource_name

    # start execution
    @override_method
    def start_execution(self):
        ad_group_ad_resource = self.__create_ad_group_ad()
        ids = self.get_id_from_resource("adGroupAds", ad_group_ad_resource).split("~")

        return {
            "adGroupId": ids[0],
            "adId": ids[1],
        }
