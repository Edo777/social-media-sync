from ....decorators.override_method import override_method
from ....abstraction.creators.base_ad_creator import BaseAdCreator


class ResponsiveDisplayAdCreator(BaseAdCreator):
    # create headlines
    def __create_headlines(self):
        headlines = self.create_headlines(pin_first_headline=False)
        if(headlines):
            self.ad.responsive_display_ad.headlines.extend(headlines)

    # create descriptions
    def __create_descriptions(self):
        descriptions = self.create_descriptions()
        if(descriptions):
            self.ad.responsive_display_ad.descriptions.extend(descriptions)

    # set other parameters
    def __set_other_params(self):
        # Businnessname set
        if("businessName" in self.ad_data):
            self.ad.responsive_display_ad.business_name = self.ad_data["businessName"]

        # allowFlexibleColor set
        if("allowFlexibleColor" in self.ad_data):
            self.ad.responsive_display_ad.allow_flexible_color = self.ad_data[
                "allowFlexibleColor"]

        # control_spec set
        control_spec = self.ad.responsive_display_ad.control_spec
        if("control_spec" in self.ad_data):
            if("enableAssetEnhancements" in self.ad_data["controlSpec"]):
                control_spec.enable_asset_enhancements = self.ad_data[
                    "controlSpec"]["enableAssetEnhancements"]

            if("enableAutogenVideo" in self.ad_data["controlSpec"]):
                control_spec.enable_autogen_video = self.ad_data["controlSpec"]["enableAutogenVideo"]

        # format_setting set
        if("formatSetting" in self.ad_data):
            self.ad.responsive_display_ad.format_setting = self.get_enum(
                enum_name="DisplayAdFormatSettingEnum",
                enum_field=self.ad_data["formatSetting"],
            )

        # longHeadline set
        if("longHeadline" in self.ad_data):
            self.ad.responsive_display_ad.long_headline.text = self.ad_data["longHeadline"]

        # callToActionText set
        if "callToActionText" in self.ad_data:
            self.ad.responsive_display_ad.call_to_action_text = self.ad_data["callToActionText"]

    # set ad files

    def __set_files(self):
        if("marketingImages" in self.ad_data):
            self.create_images(
                images_list=self.ad.responsive_display_ad.marketing_images,
                images_with_path_and_url=self.ad_data["marketingImages"],
                crop_size=(600, 314),
            )

            self.create_images(
                images_list=self.ad.responsive_display_ad.square_marketing_images,
                images_with_path_and_url=self.ad_data["marketingImages"],
                crop_size=(300, 300),
            )

    # start creation
    @override_method
    def start_creation(self):
        self.__create_headlines()
        self.__create_descriptions()
        self.__set_files()
        self.__set_other_params()
