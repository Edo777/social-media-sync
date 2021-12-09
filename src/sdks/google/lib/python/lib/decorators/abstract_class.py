from ..exceptions.abstract_instantiate_exception import AbstractInstantiateException


def abstract_class(klass):
    class_name = klass.__name__

    class AbstractClass(klass):
        def __is_child(self):
            return class_name != self.__class__.__name__

        def __error(self, class_name, class_ctr):
            message = "Class '%s@%s' markes as abstract class and cannot be create instance."
            raise AbstractInstantiateException(message % (class_name, class_ctr))

        def __init__(self, *args, **kargs):
            if not self.__is_child():
                self.__error(class_name, "__init__")

            return klass.__init__(self, *args, **kargs)

        def __new__(self, *args, **kargs):
            if not self.__is_child(self):
                self.__error(self, class_name, "__new__")

            return klass.__new__(self, *args, **kargs)

    return AbstractClass
