from ....decorators.override_method import override_method
from ....abstraction.creators.base_ad_creator import BaseAdCreator


class AppAdCreator(BaseAdCreator):
    # create headlines
    def __create_headlines(self):
        headlines = self.create_headlines(pin_first_headline=False)
        if(headlines):
            self.ad.app_ad.headlines.extend(headlines)

    # create descriptions
    def __create_descriptions(self):
        descriptions = self.create_descriptions()
        if(descriptions):
            self.ad.app_ad.descriptions.extend(descriptions)

    # set other parameters
    def __set_other_params(self):
        if "mandatoryAdText" in self.ad_data:
            self.ad.app_ad.mandatory_ad_text = self.create_ad_text_asset(
                text=self.ad_data["mandatoryAdText"],
            )

    # set ad files
    def __set_files(self):
        if "images" not in self.ad_data:
            return

        self.create_images(
            images_list=self.ad.app_ad.images,
            images_with_path_and_url=self.ad_data["images"],
            crop_size=(600, 314),
        )

    # start creation
    @override_method
    def start_creation(self):
        self.__create_headlines()
        self.__create_descriptions()
        self.__set_other_params()
        self.__set_files()
