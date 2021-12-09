from ....decorators.override_method import override_method
from ....abstraction.creators.base_ad_creator import BaseAdCreator


class DisplayUploadAdCreator(BaseAdCreator):
    # set ad file
    def __set_media_bundle(self):
        # Set product type
        self.ad.display_upload_ad.display_upload_product_type=self.ad_data["productType"]

        # Set mediafile rosource
        bundle_asset_resource = self.get_resource_by_id(
            field="assets",
            id=self.ad_data["bundleAssetId"]
        )
        self.ad.display_upload_ad.media_bundle.asset = bundle_asset_resource

    # start creation
    @override_method
    def start_creation(self):
        self.__set_media_bundle()
