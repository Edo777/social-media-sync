from ....decorators.override_method import override_method
from ....abstraction.creators.base_mediafile_creator import BaseMediaFileCreator

class MediaBundleCreator(BaseMediaFileCreator):
    
    # Convert zip to bytes
    def __zip_to_byte(self, zipfile_path):
       zipFile = open(zipfile_path, 'rb')
       return zipFile.read()
       
    # set ad file
    def __set_zip(self):
        zipfile_as_bytes = self.__zip_to_byte(
            zipfile_path=self.media_file_data["path"]
        )
        self.media_file.media_bundle.data = zipfile_as_bytes
        
    # start creation
    @override_method
    def start_creation(self):
        self.__set_zip()
