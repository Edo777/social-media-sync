from ..exceptions.class_nethod_override_exception import ClassMethodOverrideException

class override_method:
    @staticmethod
    def override_error(message):
        raise ClassMethodOverrideException(message)

    def __init__(self, method):
        self.__method = method
        self.__owner = None

    def __set_name__(self, owner, name):
        self.__method.class_name = owner.__name__

        setattr(owner, name, self.__method)
        self.__owner = owner

        self.__start_checking()

    # get parent of child class
    def __get_parent(self, child_class):
        try:
            return child_class.__bases__[0]
        except:
            return None

    # check parent contians method
    def __parent_containes(self, parent_class):
        method = self.__method.__name__
        if hasattr(parent_class, method):
            return True

        parent_class = self.__get_parent(parent_class)
        if parent_class is None:
            return False
        
        return self.__parent_containes(parent_class)

    # configure
    def __start_checking(self):
        parent_class = self.__get_parent(self.__owner)
        if not self.__parent_containes(parent_class):
            message = "Method '%s' does not exists in parent classes, so cannot be overriden in child class."
            override_method.override_error(message % self.__method.__name__)
