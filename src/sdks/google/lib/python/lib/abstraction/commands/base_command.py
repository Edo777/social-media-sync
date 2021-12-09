import re
import time
from ...exceptions.invalid_response_exception import InvalidResponseException
from ...exceptions.class_nethod_override_exception import ClassMethodOverrideException
from ..base_execution import BaseExecution
from ...decorators.abstract_class import abstract_class
from ...decorators.abstract_method import abstract_method

@abstract_class
class BaseCommand(BaseExecution):
    # execute command (main point of command, must be overriden in child class)
    @abstract_method
    def start_execution(seld):
        abstract_method.override_error("start_execution")

    # append unix milliseconds to name
    def append_name(self, name):
        milliseconds = round(time.time() * 1000)
        return "%s [%i]" % (name, milliseconds)
