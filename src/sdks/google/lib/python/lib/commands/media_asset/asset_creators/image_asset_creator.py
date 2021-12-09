

from ....decorators.override_method import override_method
from ....abstraction.creators.base_asset_creator import BaseAssetCreator

class ImageAssetCreator(BaseAssetCreator):
    # start creation
    @override_method
    def start_creation(self):
       self.set_image_data()
