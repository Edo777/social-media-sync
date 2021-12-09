from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand
from ...exceptions.invalid_arguments_exception import InvalidArgumentsException

from .media_file_creators.animated_image_creator import AnimatedImageCreator
from .media_file_creators.media_bundle_creator import MediaBundleCreator
from .media_file_creators.audio_creator import AudioCreator
from .media_file_creators.video_creator import VideoCreator
from .media_file_creators.image_creator import ImageCreator
from .media_file_creators.icon_creator import IconCreator

# command: create_campaign
class ExecuteCommand(BaseCommand):
    # create campaign with previously created budget
    def __create_media_file(self):
        input_data = self.get_argument("file")

        service = self.get_service("MediaFileService")
        operation = self.get_type("MediaFileOperation")

        media_file = operation.create
        
        media_file.name = input_data["name"]
        media_file.type_=self.get_enum("MediaTypeEnum", input_data["type"])

        creators_list = {
            "IMAGE": {
                "creator_class": ImageCreator,
                "argument_key": "image",
            },
            "ICON": {
                "creator_class": IconCreator,
                "argument_key": "icon",
            },
            "MEDIA_BUNDLE": {
                "creator_class": MediaBundleCreator,
                "argument_key": "mediaBundle",
            },
            "AUDIO": {
                "creator_class": AudioCreator,
                "argument_key": "audio",
            },
            "VIDEO": {
                "creator_class": VideoCreator,
                "argument_key": "video",
            },
            "DYNAMIC_IMAGE": {
                "creator_class": AnimatedImageCreator,
                "argument_key": "gif",
            }
        }

        if input_data["type"] not in creators_list:
            message = "Media type '%s' is not valid or method is not implemented."
            raise InvalidArgumentsException(message % input_data["type"])
        
        creator_info = creators_list.get(input_data["type"])
        creator_class = creator_info["creator_class"]
        creator_args = input_data[creator_info["argument_key"]]

        creator = creator_class()
        creator.initiate(self, media_file, creator_args)
        creator.start_creation()

        #Create request instance
        request = self.create_request(
            request_name =  "MutateMediaFilesRequest",
            operation =  operation
        )

        response = service.mutate_media_files(request=request)
        return response.results[0].resource_name

    # start execution
    @override_method
    def start_execution(self):
        media_file_resourcename = self.__create_media_file()

        return {
            "id": self.get_id_from_resource("mediaFiles", media_file_resourcename)
        }
