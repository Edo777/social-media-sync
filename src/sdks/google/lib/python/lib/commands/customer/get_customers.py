import re
from google.ads.googleads.errors import GoogleAdsException

from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: get_customers


class ExecuteCommand(BaseCommand):
    def __map(self, item):
        return re.sub("customers/", "", item)

    # get accessible cusomers id list
    def __get_accessible_cusomers_id_list(self, service):
        accessible_customers = service.list_accessible_customers()
        customers_id_list = list(
            map(self.__map, accessible_customers.resource_names))
        return customers_id_list

    # get cusomer by id
    def __get_customer_by_id(self, service, customer_id):
        try:
            resource_name = service.customer_path(customer_id)
            customer = service.get_customer(resource_name=resource_name)

            return customer
            # return self.serialize(customer)
        except Exception as ex:
            # print(ex)
            return None

    # get customer clients by manager id
    def __get_customer_clients(self, service, manager_customer_id, only_test_accounts):
        query = """
            SELECT
                customer_client.resource_name,
                customer_client.hidden,
                customer_client.level,
                customer_client.time_zone,
                customer_client.test_account,
                customer_client.manager,
                customer_client.descriptive_name,
                customer_client.currency_code
            FROM
                customer_client
            WHERE   
                customer_client.manager=false
                
        """
    # customer_client.client_customer = ':client_customer'
    #             AND
    #             customer_client.test_account = :test_account
        try:
            responses = self.run_query_with_id(manager_customer_id, query, {
                "client_customer": "customers/" + str(manager_customer_id),
                "test_account": "true" if only_test_accounts else "false"
            })

            results = self.loop_result(
                responses=responses,
                callback=lambda row: row.customer_client
            )
            
            client_customers = []
            for row_result in results:
                _, _manager_id, _, _client_id = row_result.resource_name.split("/")
                info = self.serialize(row_result)
                client_customers.append({
                    "loginCustomerId": _manager_id,
                    "clientCustomerId": _client_id,
                    **info
                })

            return client_customers
        except Exception as ex:
            # print(ex)
            return None

    # get cusomers by their ids
    def __get_customers_list(self, service, customer_ids):
        only_test_accounts = self.get_argument("testAccounts")
        if only_test_accounts is None:
            only_test_accounts = False
        
        customers = []
        for customer_id in customer_ids:
            try:
                manager_customer = self.__get_customer_by_id(service, customer_id)
                if manager_customer is None:
                    continue

                # if not manager_customer.manager:
                #     continue

                # if only_test_accounts and not manager_customer.test_account:
                #     continue

                client_customers = self.__get_customer_clients(
                    service = service,
                    manager_customer_id = manager_customer.id,
                    only_test_accounts = only_test_accounts
                )

                if client_customers is None:
                    continue

                for client_customer in client_customers:
                    customers.append(client_customer)

            # except GoogleAdsException as ex:
            #     if len(ex.failure.errors) != 0:
            #         codes = ex.failure.errors[0].error_code
            #         if hasattr(codes, "authorization_error"):
            #             customers.append({
            #                 "error": codes.authorization_error,
            #                 "id": customer_id,
            #             })
            except Exception as ex:
                # print(ex)
                pass

        return customers

    # start execution
    @override_method
    def start_execution(self):
        customer_service = self.get_service("CustomerService")

        ids = self.__get_accessible_cusomers_id_list(customer_service)
        customers = self.__get_customers_list(customer_service, ids)

        return customers
