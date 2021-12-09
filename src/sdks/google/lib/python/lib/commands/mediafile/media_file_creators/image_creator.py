from ....decorators.override_method import override_method
from ....abstraction.creators.base_mediafile_creator import BaseMediaFileCreator

class ImageCreator(BaseMediaFileCreator):
    # Convert image to bytes
    def __image_to_byte(self, image_path):
       image = open(image_path, 'rb')
       return image.read()
       
    # set ad image file
    def __set_image(self):
        image_as_bytes = self.__image_to_byte(
            image_path=self.media_file_data["path"]
        )
        self.media_file.image.data = image_as_bytes
        
    # start creation
    @override_method
    def start_creation(self):
        self.__set_image()
