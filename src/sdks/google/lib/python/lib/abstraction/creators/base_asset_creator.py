import re
import os
from PIL import Image as PilImage, ImageOps as PilImageOps
from ..base_execution import BaseExecution
from ...decorators.abstract_class import abstract_class
from ...decorators.abstract_method import abstract_method

@abstract_class
class BaseAssetCreator(BaseExecution):
    # start ad creation (must be overriden in child class)
    @abstract_method
    def start_creation(seld):
        abstract_method.override_error("start_creation")

    # initiate values
    def initiate(self, source, asset, asset_data):
        self.clone_configs_from(source)
        self.asset = asset
        self.asset_data = asset_data
    
    # file to bytes
    def __to_bytes(self, path):
        file = open(path, "rb")
        return file.read()
    
    # Set media bundle asset's data
    def set_bundle_data(self):
        self.asset.media_bundle_asset.data=self.__to_bytes(
            path=self.asset_data["path"]
        )
        
    # Set image data to asset operation
    def set_image_data(self):
        image_path = self.asset_data["path"]
        image_url = self.asset_data["url"]

        pil_image = PilImage.open(image_path)
        width, height = pil_image.size

        image_content = self.__to_bytes(image_path)

        self.asset.image_asset.data = image_content
        self.asset.image_asset.file_size = len(image_content)
        self.asset.image_asset.mime_type = self.get_enum("MimeTypeEnum", "IMAGE_JPEG")
        self.asset.image_asset.full_size.height_pixels = height
        self.asset.image_asset.full_size.width_pixels = width
        self.asset.image_asset.full_size.url = image_url
