from ....decorators.override_method import override_method
from ....abstraction.creators.base_ad_creator import BaseAdCreator


class ImageAdCreator(BaseAdCreator):
    # Logic for create ad from mediafile
    def __create_ad_from_mediafile(self):
        # Set display url
        self.ad.display_url = self.ad.final_urls[0]

        # Set mediafile rosource
        media_file_resource = self.get_resource_by_id(
            field="mediaFiles",
            id=self.ad_data["mediaFileId"]
        )
        self.ad.image_ad.media_file = media_file_resource

    # Logic for create ad image from path and url
    def __create_ad_from_url(self):
        # Get path and url from data
        image_path = self.ad_data["path"]
        image_url = self.ad_data["url"]

        # Set image url
        self.ad.image_ad.image_url = image_url

        # Set display url
        if(self.ad.final_urls):
            self.ad.display_url = self.ad.final_urls[0]

        # Open image file for reading
        # Read image as byte and set in data
        image = open(image_path, "rb")
        self.ad.image_ad.data = image.read()

    # set ad file
    def __set_image(self):
        if("mediaFileId" in self.ad_data):
            self.__create_ad_from_mediafile()
        elif("path" in self.ad_data and "url" in self.ad_data):
            self.__create_ad_from_url()

    # start creation

    @override_method
    def start_creation(self):
        self.__set_image()
