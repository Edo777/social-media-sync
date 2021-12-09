from ....decorators.override_method import override_method
from ....abstraction.creators.base_ad_creator import BaseAdCreator


class ResponsiveSearchAdCreator(BaseAdCreator):
    # create headlines
    def __create_headlines(self):
        headlines = self.create_headlines(pin_first_headline=True)
        if(headlines):
            self.ad.responsive_search_ad.headlines.extend(headlines)

    # create descriptions
    def __create_descriptions(self):
        descriptions = self.create_descriptions()
        if(descriptions):
            self.ad.responsive_search_ad.descriptions.extend(descriptions)

    # create paths
    def __create_paths(self):
        if(("paths" in self.ad_data) and ("first" in self.ad_data["paths"])):
            self.ad.responsive_search_ad.path1 = self.ad_data["paths"]["first"]

            if ("second" in self.ad_data["paths"]):
                self.ad.responsive_search_ad.path2 = self.ad_data["paths"]["second"]

    # start creation

    @override_method
    def start_creation(self):
        self.__create_headlines()
        self.__create_descriptions()
        self.__create_paths()
