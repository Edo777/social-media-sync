from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand
from ...exceptions.invalid_arguments_exception import InvalidArgumentsException

from .asset_creators.image_asset_creator import ImageAssetCreator
from .asset_creators.lead_form_asset_creator import LeadFormAssetCreator
from .asset_creators.media_bundle_asset_creator import MediaBundleAssetCreator
from .asset_creators.text_asset_creator import TextAssetCreator
from .asset_creators.youtube_video_asset_creator import YoutubeVideoAssetCreator

# command: create_campaign


class ExecuteCommand(BaseCommand):
    # create campaign with previously created budget
    def __create_asset(self):
        input_data = self.get_argument("asset")

        service = self.get_service("AssetService")
        operation = self.get_type("AssetOperation")

        asset = operation.create

        if("name" in input_data):
            asset.name = input_data["name"]
        
        asset.type_ = self.get_enum("MediaTypeEnum", input_data["type"])

        # Set final urls
        if "finalUrls" in input_data:
            final_urls = input_data["finalUrls"]
            for final_url in final_urls:
                asset.final_urls.append(final_url)

        creators_list = {
            "YOUTUBE_VIDEO": {
                "creator_class": YoutubeVideoAssetCreator,
                "argument_key": "youtube",
            },
            "MEDIA_BUNDLE": {
                "creator_class": MediaBundleAssetCreator,
                "argument_key": "zip",
            },
            "IMAGE": {
                "creator_class": ImageAssetCreator,
                "argument_key": "image",
            },
            "TEXT": {
                "creator_class": TextAssetCreator,
                "argument_key": "text",
            },
            "LEAD_FORM": {
                "creator_class": LeadFormAssetCreator,
                "argument_key": "leadForm",
            },
        }

        if input_data["type"] not in creators_list:
            message = "Media type '%s' is not valid or method is not implemented."
            raise InvalidArgumentsException(message % input_data["type"])

        creator_info = creators_list.get(input_data["type"])
        creator_class = creator_info["creator_class"]
        creator_args = input_data[creator_info["argument_key"]]

        creator = creator_class()
        creator.initiate(self, asset, creator_args)
        creator.start_creation()

        #Create request instance
        request = self.create_request(
            request_name =  "MutateAssetsRequest",
            operation =  operation
        )

        response = service.mutate_assets(request=request)

        return response.results[0].resource_name

    # start execution
    @override_method
    def start_execution(self):
        asset_resource_name = self.__create_asset()

        return {
            "id": self.get_id_from_resource("assets", asset_resource_name)
        }
