from google.ads.googleads.errors import GoogleAdsException
from google.api_core import protobuf_helpers

from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand
from .customer_link.handle_error import CustomerLinkageErrorHandler

# command: get_customers
class ExecuteCommand(BaseCommand):
    def __create_invitation(self, manager_customer_id, client_customer_id):
        client_link_operation = self.get_type("CustomerClientLinkOperation")
        client_link = client_link_operation.create
        client_link.client_customer = "customers/{}".format(client_customer_id)
        client_link.status = self.get_enum("ManagerLinkStatusEnum", "PENDING")

        service = self.get_service("CustomerClientLinkService")

        #Create request instance
        request = self.create_request(
            request_name="MutateCustomerClientLinkRequest",
            operation=  client_link_operation
        )

        response = service.mutate_customer_client_link(request=request)

        return response.results[0].resource_name

    def __get_link_id(self, resource):
        query = """
            SELECT customer_client_link.manager_link_id
            FROM customer_client_link
            WHERE customer_client_link.resource_name = ':resource_name'
            LIMIT 1
        """

        responses = self.run_query(query, {
            "resource_name": resource,
        })

        results = self.loop_result(
            responses = resource,
            callback = lambda row: row.customer_client_link.manager_link_id,
        )

        return results[0]

    def __accept_invitation(self, client_customer_id, manager_customer_id, manager_link_id):
        manager_link_operation = self.get_type("CustomerManagerLinkOperation")
        manager_link = manager_link_operation.update
        manager_link.resource_name = "customers/{}/customerManagerLinks/{}~{}".format(
            client_customer_id,
            manager_customer_id,
            manager_link_id
        )

        manager_link.status = self.get_enum("ManagerLinkStatusEnum", "ACTIVE")
        field_mask = protobuf_helpers.field_mask(None, manager_link)
        manager_link_operation.update_mask.CopyFrom(field_mask)

        service = self.get_service("ManagerLinkService")

        #Create request instance
        request = self.create_request(
            request_name="MutateManagerLinksRequest",
            operation=  manager_link_operation
        )
        response = service.mutate_manager_links(request=request)

    def __try_link_client_and_manager(self):
        client_customer_id = self.to_numeric_customer_id(self.get_argument("clientCustomerId"))
        manager_customer_id = self.to_numeric_customer_id(self.get_env_variable("login_customer_id"))

        link_resource = self.__create_invitation(
            manager_customer_id = manager_customer_id,
            client_customer_id = client_customer_id,
        )

        manager_link_id = self.__get_link_id(link_resource)
        self.__accept_invitation(
            client_customer_id = client_customer_id,
            manager_customer_id = manager_customer_id,
            manager_link_id = manager_link_id,
        )

    def __handle_error(self, ex):
        if len(ex.failure.errors) == 0:
            return CustomerLinkageErrorHandler.RES_UNKNOW_ERROR

        error_handler = CustomerLinkageErrorHandler()
        error_handler.clone_configs_from(self)

        error = ex.failure.errors[0].error_code
        return error_handler.handle(error)

    # start execution
    @override_method
    def start_execution(self):
        try:
            self.__try_link_client_and_manager()
            return CustomerLinkageErrorHandler.RES_LINKAGE_SUCCESS
        except GoogleAdsException as ex:
            return self.__handle_error(ex)
        except Exception as ex:
            return CustomerLinkageErrorHandler.RES_UNKNOW_ERROR
