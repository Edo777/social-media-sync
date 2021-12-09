from .override_method import override_method

class abstract_method:
    @staticmethod
    def override_error(cls, method):
        override_method.override_error(method)

    def __init__(self, method):
        self.__method = method
        self.__owner = None

    def __set_name__(self, owner, name):
        self.__method.class_name = owner.__name__

        setattr(owner, name, self.__method)
        self.__owner = owner

        self.__start_checking()

    def __start_checking(self):
        pass
