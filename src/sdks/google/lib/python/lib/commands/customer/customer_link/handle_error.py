from ....abstraction.base_execution import BaseExecution

class CustomerLinkageErrorHandler(BaseExecution):
    RES_LINKAGE_SUCCESS = "LINKAGE_SUCCESS"
    RES_ALREADY_LINKED = "ALREADY_LINKED"
    RES_UNKNOW_ERROR = "UNKNOW_ERROR"

    def __is_already_linked_error(self, error):
        if not hasattr(error, "manager_link_error"):
            return False
        
        return error.manager_link_error == self.get_enum(
            enum_name = "ManagerLinkErrorEnum",
            enum_field = "ALREADY_MANAGED_IN_HIERARCHY",
        )

    def handle(self, error):
        if self.__is_already_linked_error(error):
            return CustomerLinkageErrorHandler.RES_ALREADY_LINKED

        return CustomerLinkageErrorHandler.RES_UNKNOW_ERROR
