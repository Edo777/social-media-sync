from ....decorators.override_method import override_method
from ....abstraction.creators.base_mediafile_creator import BaseMediaFileCreator

class IconCreator(BaseMediaFileCreator):
    # set ad file
    def __set_html(self):
        # # Get path and url from data
        # image_path = self.ad_data["path"]
        # # image_url = self.ad_data["url"]

        # # Set display url
        self.ad.display_url = self.ad.final_urls[0]

        # # Open image file for reading
        # # Read image as byte and set in data
        # image = open(image_path, "rb")
        self.ad.image_ad.media_file = self.ad_data["path"]

    # start creation
    @override_method
    def start_creation(self):
        self.__set_html()
