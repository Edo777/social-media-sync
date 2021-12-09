import re
import os
from PIL import Image as PilImage, ImageOps as PilImageOps
from ..base_execution import BaseExecution
from ...decorators.abstract_class import abstract_class
from ...decorators.abstract_method import abstract_method

@abstract_class
class BaseMediaFileCreator(BaseExecution):
    # start ad creation (must be overriden in child class)
    @abstract_method
    def start_creation(seld):
        abstract_method.override_error("start_creation")

    # initiate values
    def initiate(self, source, media_file, media_file_data):
        self.clone_configs_from(source)
        self.media_file = media_file
        self.media_file_data = media_file_data
