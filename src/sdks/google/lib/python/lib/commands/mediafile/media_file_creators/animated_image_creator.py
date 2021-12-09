from ....decorators.override_method import override_method
from ....abstraction.creators.base_mediafile_creator import BaseMediaFileCreator

# This is an DYNAMIC_IMAGE 
# https://developers.google.com/google-ads/api/reference/rpc/v6/MediaTypeEnum.MediaType
class AnimatedImageCreator(BaseMediaFileCreator):
    # Convert image to bytes
    def __image_to_byte(self, image_path):
       image = open(image_path, 'rb')
       return image.read()
       
    # set ad image file
    def __set_animated_image(self):
        animated_image_as_bytes = self.__image_to_byte(
            image_path=self.media_file_data["path"]
        )
        self.media_file.image.data = image_as_bytes
        
    # start creation
    @override_method
    def start_creation(self):
        self.__set_animated_image()
