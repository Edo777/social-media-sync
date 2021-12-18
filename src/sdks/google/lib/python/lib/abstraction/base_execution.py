from abc import ABC
import re
import json
from google.protobuf.json_format import MessageToJson
from google.ads.googleads.client import GoogleAdsClient
from ..decorators.abstract_class import abstract_class
from google.ads.googleads import config, oauth2, util
# from google.ads.googleads.v8.services.types.google_ads_service import GoogleAdsRow
# from google.ads.googleads.v8.resources.types.campaign import Campaign

@abstract_class
class BaseExecution(ABC):
    # parse string-null to python known None value
    def __parse_null(self, value):
        return value if "null" != value else None

    # BaseCommand constructur
    def __init__(self):
        self.__arguments = dict()
        self.__env_vars = {
            "client_id": "",
            "client_secret": "",
            "developer_token": "",
            "access_token": "",
            "refresh_token": "",
            "login_customer_id": "",
            "client_customer_id": "",
            "logging": False
        }
        
        self.__api_version = ""
        self.__google_ads_client = None

    # clone environment variables, arguments and more from source
    def clone_configs_from(self, source):
        self.__arguments = source.get_arguments()
        self.__env_vars = source.get_env_variables()
        self.__api_version = source.get_api_version()
        self.__google_ads_client = source.get_google_ads_client()

    # set environment variables
    def set_env_variables(
            self,
            client_id,
            client_secret,
            developer_token,
            access_token,
            refresh_token,
            login_customer_id,
            client_customer_id,
            logging
        ):
        self.__env_vars = {
            "client_id": self.__parse_null(client_id),
            "client_secret": self.__parse_null(client_secret),
            "developer_token": self.__parse_null(developer_token),
            "access_token": self.__parse_null(access_token),
            "refresh_token": self.__parse_null(refresh_token),
            "login_customer_id": self.__parse_null(login_customer_id),
            "client_customer_id": self.__parse_null(client_customer_id),
            "logging": self.__parse_null(logging)
        }

        self.__env_vars["login_customer_id"] = self.to_numeric_customer_id(self.__env_vars["login_customer_id"])
        self.__env_vars["client_customer_id"] = self.to_numeric_customer_id(self.__env_vars["client_customer_id"])

        oauth_data = {
            "developer_token": self.get_env_variable("developer_token"),
            "refresh_token": self.get_env_variable("refresh_token"),
            "client_id": self.get_env_variable("client_id"),
            "client_secret": self.get_env_variable("client_secret"),
            "login_customer_id": self.get_env_variable("login_customer_id")
        }

        configs = {
            "credentials": oauth2.get_credentials(oauth_data),
            "use_proto_plus": True,
            "logging_config": {
                "disable_existing_loggers": True,
                "loggers": {
                    "": {
                        "handlers": ["default_handler"],
                        "level": "WARNING"
                    }
                }
            }
        }

        self.__google_ads_client = GoogleAdsClient.load_from_dict({ **oauth_data, **configs })

    # get env variable
    def get_env_variable(self, env_key):
        if env_key not in self.__env_vars:
            return None

        return self.__env_vars[env_key]

    # parse to numeric customer id
    def to_numeric_customer_id(self, customer_id):
        if "null" == customer_id or customer_id is None:
            return None
        return re.sub("-", "", customer_id)

    # parse to string customer id
    def to_string_customer_id(self, customer_id):
        part1 = int(customer_id / 10000000)
        part2 = int((customer_id - part1 * 10000000) / 10000)
        part3 = customer_id - part1 * 10000000 - part2 * 10000
        
        return "%s-%s-%s" % (part1, part2, part3)

    # get customer id
    def get_client_customer_id(self):
        return self.get_env_variable("client_customer_id")

    # set passed arguments
    def set_arguments(self, arguments):
        self.__arguments = arguments

    # get passed arguments
    def get_arguments(self):
        return self.__arguments

    # get passed environment variables
    def get_env_variables(self):
        return self.__env_vars

    # get passed argument by key
    def get_argument(self, arg_key):
        if arg_key not in self.__arguments:
            return None
        return self.__arguments[arg_key]

    # set default api version
    def set_api_version(self, api_version):
        self.__api_version = api_version

    # get default api version
    def get_api_version(self):
        return self.__api_version

    # get google ads api client
    def get_google_ads_client(self):
        return self.__google_ads_client

    # get service instance
    def get_service(self, service_name):
        return self.__google_ads_client.get_service(
            name = service_name,
            version = self.__api_version
        )

    # get type instance
    def get_type(self, type_name):
        return self.__google_ads_client.get_type(
            name = type_name,
            version = self.__api_version
        )

    # get enum instance
    def get_enum(self, enum_name, enum_field):
        enum_instance = None

        # Enum instance get logic in v6
        if self.__api_version != "v9":
            enum_instance = self.__google_ads_client.get_type(
                name = enum_name,
                version = self.__api_version
            )
        else:
            # Enum instance get logic in v8
            enum_instance = getattr(self.__google_ads_client.enums, enum_name)
       
        if enum_instance is None:
            return None

        return getattr(enum_instance, enum_field)
    
    # Create request instance
    # request_name ex. MutateCampaignBudgetsRequest
    # operation can be list or instance ex. [operation] or operation
    # content_type -> [UNSPECIFIED, MUTABLE_RESOURCE, RESOURCE_NAME_ONLY]
    def create_request(self, 
            request_name, 
            operation=None, 
            content_type=None,
            attributes=None,
            set_customer_id=True,
            customer_id=None
        ):
        # Client init
        c = self.__google_ads_client

        # Get request instance and set customer_id
        request = c.get_type(request_name)
        
        # set customer
        if set_customer_id:
            if customer_id is not None:
                request.customer_id = customer_id
            else:
                request.customer_id = self.get_client_customer_id()

        # Set operation(s)
        if operation is not None:
            if isinstance(operation, list):
                request.operations =operation
            else:
                request.operations = [operation]
        
        # Set ContentType
        if content_type is not None:
            request.response_content_type = self.get_enum("ResponseContentTypeEnum", content_type)
        
        # set options
        if attributes is not None:
            for attr in attributes:
                setattr(request, attr, attributes[attr])

        return request
    
    # run query
    def run_query(self, prepared_query, replaces = {}):
        return self.run_query_with_id(
            customer_id = self.get_client_customer_id(),
            prepared_query = prepared_query,
            replaces = replaces
        )

    # run query with customer id
    def run_query_with_id(self, customer_id, prepared_query, replaces = {}):
        final_query = prepared_query
        for key in replaces:
            final_query = re.sub(":" + key, str(replaces[key]), final_query)

        google_ads_service = self.get_service("GoogleAdsService")
        # return google_ads_service.search_stream(
        #     customer_id = customer_id,
        #     query = final_query
        # )

        # Create request instance
        request = self.create_request(
            request_name="SearchGoogleAdsRequest",
            set_customer_id=True,
            customer_id=str(customer_id),
            attributes =  {
                "query": final_query,
                "page_size": 1000
            }
        )
        return google_ads_service.search(request=request)

    # loop on response result with callbacks
    def loop_result(self, responses, callback):
        if self.__api_version != "v9":
            list_result = []

            try:
                iteration = responses._page_iter(True)
                for page in iteration:
                    
                    results = page.raw_page.results
                    if results is None or len(results) == 0:
                        continue

                    for row in results:
                        item_result = callback(row)
                        list_result.append(item_result)
            except Exception as ex:
                print(ex)
                exit(1)
                pass

            return list_result
        else:
            list_result = []
            
            # for batch in responses:
            for row in responses:
                item_result = callback(row)
                list_result.append(item_result)

            return list_result

    # serialize google lib class
    def serialize(self, obj):
        serialized_json = MessageToJson(obj._pb).replace("\n", "")
        return json.loads(serialized_json)
    
    # get resource id from their name string
    def get_id_from_resource(self, field, resource_name, customer_id = None):
        if customer_id is None:
            customer_id = self.get_client_customer_id()

        cutting_part = "customers/" + str(customer_id) + "/" + field + "/"
        return re.sub(cutting_part, "", resource_name)

    # get resource name from their id
    def get_resource_by_id(self, field, id):
        return "customers/%s/%s/%s" % (self.get_client_customer_id(), field, id)
