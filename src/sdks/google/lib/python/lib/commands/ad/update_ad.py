from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand
from ...exceptions.invalid_arguments_exception import InvalidArgumentsException

from google.api_core import protobuf_helpers

from .ad_creators.responsive_search_ad_creator import ResponsiveSearchAdCreator
from .ad_creators.responsive_display_ad_creator import ResponsiveDisplayAdCreator
from .ad_creators.app_ad_creator import AppAdCreator
from .ad_creators.image_ad_creator import ImageAdCreator
from .ad_creators.display_upload_ad_creator import DisplayUploadAdCreator

# command: create_ad


class ExecuteCommand(BaseCommand):
    # create ad instance
    def __update_ad_instance(self, resource_name, ad_data):
        # Take service and operation for update ad
        service = self.get_service("AdService")
        ad_operation = self.get_type("AdOperation")

        ad = ad_operation.update
        ad.resource_name = resource_name

        # Final urls
        if "finalUrls" in ad_data:
            final_urls = ad_data["finalUrls"]

            for final_url in final_urls:
                ad.final_urls.append(final_url)

        # name ( can't be ubdated )
        if "name" in ad_data and ad_data["type"] != "RESPONSIVE_SEARCH_AD":
            ad.name = ad_data["name"]
        
       
        updaters_list = {
            "RESPONSIVE_SEARCH_AD": {
                "updater_class": ResponsiveSearchAdCreator,
                "argument_key": "responsiveSearchAd",
            },
            "RESPONSIVE_DISPLAY_AD": {
                "updater_class": ResponsiveDisplayAdCreator,
                "argument_key": "responsiveDisplayAd",
            },
            "APP_AD": {
                "updater_class": AppAdCreator,
                "argument_key": "appAd",
            },
            # "IMAGE_AD": {
            #     "updater_class": ImageAdCreator,
            #     "argument_key": "imageAd",
            # },
            "HTML5_UPLOAD_AD": {
                "updater_class": DisplayUploadAdCreator,
                "argument_key": "displayUploadAd",
            }
        }

        if ad_data["type"] not in updaters_list:
            message = "Ad type '%s' is not valid or method is not implemented."
            raise InvalidArgumentsException(message % ad_data["type"])

        updater_info = updaters_list.get(ad_data["type"])
        updater_class = updater_info["updater_class"]
        updater_args = ad_data[updater_info["argument_key"]]

        updater = updater_class()
        updater.initiate(self, ad, updater_args)
        updater.start_creation()
        
        # create mask
        field_mask = protobuf_helpers.field_mask(None, ad._pb)
        ad_operation.update_mask.CopyFrom(field_mask)

        request = self.create_request(
            request_name="MutateAdsRequest",
            operation =  ad_operation
        )

        # Mutate request
        response = service.mutate_ads(request=request)
        
        return response

    # #
    # Update ad_group_ad fields.
    # Here will be updated only status of adgroup~ad reference
    # #
    def __update_adgroup_ad_fields(self, resource_name, update_data):
        # update status to  -> paused, removed, enabled
        if("status" in update_data):
            # Take service and operation for update adGroupAd
            service = self.get_service("AdGroupAdService")
            ad_group_ad_operation = self.get_type("AdGroupAdOperation")

            # Create adGroupAd instance from operation for update
            ad_group_ad = ad_group_ad_operation.update

            # Set resource name
            ad_group_ad.resource_name = resource_name

            # Set new updated status
            ad_group_ad.status = self.get_enum(
                "AdGroupAdStatusEnum", update_data["status"]
            )

            # create mask
            field_mask = protobuf_helpers.field_mask(None, ad_group_ad._pb)
            ad_group_ad_operation.update_mask.CopyFrom(field_mask)

            request = self.create_request(
                request_name="MutateAdGroupAdsRequest",
                operation =  ad_group_ad_operation
            )

            # Mutate request
            response = service.mutate_ad_group_ads(request=request)

            return response

    # create ad_group ad association
    def __create_ad_group_ad(self):
        # Get ad and adGroup ids
        adId = self.get_argument("adId")
        adGroupId = self.get_argument("adGroupId")

        # {ad, adGroupAd}
        update_data = self.get_argument("data")

        # Update ad_group
        if("adGroupAd" in update_data):
            ad_group_ad_update_data = update_data["adGroupAd"]
            ad_group_ad_resource_name = self.get_resource_by_id(
                "adGroupAds", adGroupId + "~" + adId)

            # Here can be updated status of ad_group_ad
            self.__update_adgroup_ad_fields(
                ad_group_ad_resource_name, ad_group_ad_update_data)

        # UPDATE AD
        if("ad" in update_data):
            ad_update_data = update_data["ad"]

            ad_resource_name = self.get_resource_by_id("ads", adId)
            self.__update_ad_instance(ad_resource_name, ad_update_data)

        return {"status": "success"}

    # start execution
    @override_method
    def start_execution(self):
        ad_group_ad_resource = self.__create_ad_group_ad()

        return ad_group_ad_resource
