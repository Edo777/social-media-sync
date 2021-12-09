
class CriterionOperationItem(object):
    def __init__(self, operation, criterion):
        self.__operation = operation
        self.__criterion = criterion

    @property
    def criterion_operation(self):
        return self.__operation

    @property
    def criterion(self):
        return self.__criterion
