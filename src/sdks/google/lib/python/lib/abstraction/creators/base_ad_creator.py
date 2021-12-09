import re
import os
from PIL import Image as PilImage, ImageOps as PilImageOps
from ..base_execution import BaseExecution
from ...decorators.abstract_class import abstract_class
from ...decorators.abstract_method import abstract_method

@abstract_class
class BaseAdCreator(BaseExecution):
    # start ad creation (must be overriden in child class)
    @abstract_method
    def start_creation(seld):
        abstract_method.override_error("start_creation")

    # initiate values
    def initiate(self, source, ad, ad_data):
        self.clone_configs_from(source)
        self.ad = ad
        self.ad_data = ad_data

    # copy image to new path and crop copied image to make it square
    def copy_and_crop_square(self, image_path_and_url, crop_size):
        square_image_path_and_url = image_path_and_url.copy()

        square_image_path_and_url["path"] = self.__replace_extension_square(
            width = crop_size[0],
            height = crop_size[1],
            str_val = square_image_path_and_url["path"],
        )
        square_image_path_and_url["url"] = self.__replace_extension_square(
            width = crop_size[0],
            height = crop_size[1],
            str_val = square_image_path_and_url["url"],
        )

        with PilImage.open(image_path_and_url["path"]) as pil_image:
            pil_image_thumb = PilImageOps.fit(pil_image, crop_size, PilImage.ANTIALIAS)
            pil_image_thumb.save(square_image_path_and_url["path"], quality = 95)
        
        return square_image_path_and_url

    # create ad text asset
    def create_ad_text_asset(self, text, pinned_field = None):
        ad_text_asset = self.get_type("AdTextAsset")
        ad_text_asset.text = text
        
        if pinned_field is not None:
            ad_text_asset.pinned_field = pinned_field

        return ad_text_asset

    # create ad image asset
    def create_ad_image_asset(self, image_path_and_url):
        ad_image_asset = self.get_type("AdImageAsset")
        ad_image_asset.asset = self.__upload_image(image_path_and_url)

        return ad_image_asset

    # create headlines
    def create_headlines(self, pin_first_headline):
        if("headlines" in self.ad_data):
            headlines = []
            for index, headline_text in enumerate(self.ad_data["headlines"], 0):
                pinned_field = None
                if pin_first_headline and index == 0:
                    pinned_field = self.get_enum("ServedAssetFieldTypeEnum", "HEADLINE_1")

                headline = self.create_ad_text_asset(headline_text, pinned_field)
                headlines.append(headline)
            
            return headlines
            
        return None

    # create descriptions
    def create_descriptions(self):
        if("descriptions" in self.ad_data):
            descriptions = []
            for description_text in self.ad_data["descriptions"]:
                description = self.create_ad_text_asset(description_text)
                descriptions.append(description)
        
            return descriptions
        
        return None

    # create images asset using their paths
    def create_images(self, images_list, images_with_path_and_url, crop_size = None):
        for image_with_path_and_url in images_with_path_and_url:
            use_image_path_and_url = image_with_path_and_url
            if crop_size is not None:
                use_image_path_and_url = self.copy_and_crop_square(
                    image_path_and_url = use_image_path_and_url,
                    crop_size = crop_size
                )

            # image = self.create_ad_image_asset(use_image_path_and_url)

            image_item = images_list._pb.add()
            image_item.asset = self.__upload_image(use_image_path_and_url)

    def __replace_extension_square(self, width, height, str_val):
        filename, extension = os.path.splitext(str_val)
        return "%s.thumbnail_%ix%i%s" % (filename, width, height, extension)

    def __image_to_bytes(self, image_path):
        image = open(image_path, "rb")
        return image.read()
        # byte_array = bytearray(image.read())
        # return byte_array[0]

    def __upload_image(self, image_path_and_url):
        pil_image = PilImage.open(image_path_and_url["path"])
        width, height = pil_image.size

        image_content = self.__image_to_bytes(image_path_and_url["path"])

        service = self.get_service("AssetService")
        operation = self.get_type("AssetOperation")
        
        asset = operation.create
        asset.type_ = self.get_enum("AssetTypeEnum", "IMAGE")
        asset.image_asset.data = image_content
        asset.image_asset.file_size = len(image_content)
        asset.image_asset.mime_type = self.get_enum("MimeTypeEnum", "IMAGE_JPEG")
        asset.image_asset.full_size.height_pixels = height
        asset.image_asset.full_size.width_pixels = width
        asset.image_asset.full_size.url = image_path_and_url["url"]

        request = self.create_request(
            request_name="MutateAssetsRequest",
            operation = operation
        )

        response = service.mutate_assets(request=request)
        return response.results[0].resource_name

