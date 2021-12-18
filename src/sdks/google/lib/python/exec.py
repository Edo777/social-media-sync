#!/usr/bin/env python3

import sys
import os
import importlib
import json
import traceback
import re
import base64
import asyncio

from google.ads.googleads.errors import GoogleAdsException

def __to_response(status, request_id, args):
    return json.dumps({
        "status": status,
        "request": request_id,
        **args
    })

def __to_error(message, request_id = None):
    return __to_response("failed", request_id, {
        "message": message
    })

def __to_result(result, request_id = None):
    return __to_response("success", request_id, {
        "result": result,
    })

# #
# Here the module will set envirements to command_lib ex. => commands.create_campaign.py
# that command_lib will be our executor and we will call from there start_execution fn.
# #
def __exec_command(command_lib, arguments, is_async_task=False):
    # environment variables
    env_client_id = os.environ.get("ENV_OAUTH_CLIENT_ID")
    env_client_secret = os.environ.get("ENV_OAUTH_CLIENT_SECRET")
    env_developer_token = os.environ.get("ENV_DEVELOPER_TOKEN")
    env_access_token = os.environ.get("ENV_ACCESS_TOKEN")
    env_refresh_token = os.environ.get("ENV_REFRESH_TOKEN")
    env_login_customer_id = os.environ.get("ENV_LOGIN_CUSTOMER_ID")
    env_client_customer_id = os.environ.get("ENV_CLIENT_CUSTOMER_ID")
    env_logging = os.environ.get("ENV_DEBUG_LOGGING")

    # execute
    executor = importlib.import_module(command_lib).ExecuteCommand()
    executor.set_arguments(arguments)
    executor.set_api_version("v9")
    executor.set_env_variables(
        client_id = env_client_id,
        client_secret = env_client_secret,
        developer_token = env_developer_token,
        access_token = env_access_token,
        refresh_token = env_refresh_token,
        login_customer_id = env_login_customer_id,
        client_customer_id = env_client_customer_id,
        logging = env_logging
    )

    # responde result
    if is_async_task:
        loop = asyncio.get_event_loop()
        task = loop.create_task(executor.start_execution())
        result = loop.run_until_complete(task)
    else:
        result = executor.start_execution()
    
    return __to_result(result)

##
# That function will try to execute the command. 
# When something will be wrong, the function returns us exceptions. 
# Another case it will execute and return result from command_lib
##
def __try_exec_command(command_lib, arguments, is_async_task):
    try:
        return __exec_command(command_lib, arguments, is_async_task)
    except GoogleAdsException as ex:
        spaces = "    "
        message = "Request failed with status \"%s\" and includes the following errors:" % ex.error.code().name
        for error in ex.failure.errors:
            message = message + ("\n%sError with message \"%s\"." % (spaces, error.message))
            if error.location:
                for field_path_element in error.location.field_path_elements:
                    message = message + ("\n%s%sOn field: %s" % (spaces, spaces, field_path_element.field_name))

        return __to_error(message, ex.request_id)
    except Exception as ex:
        return __to_error(traceback.format_exc())

def __to_utf8(value):
    try:
        return base64.b64decode(value).decode("UTF-8")
    except:
        return value

def __to_valid_argv(argv):
    if not argv.startswith("'"):
        return __to_utf8(argv)
        
    if not argv.endswith("'"):
        return __to_utf8(argv)

    _start = 1
    _end = len(argv) - 1

    return __to_utf8(argv[_start:_end])

##
# The main function of that module.
# It will be called first, when node will execute the exec.py
##
def __main():
    path_splited = __to_valid_argv(sys.argv[1]).split("/")
    path_segments = ["lib", "commands", *path_splited]

    command_path = os.path.join(*path_segments) + ".py"
    command_lib = ".".join(path_segments)
    
    result = ""
    if not os.path.exists(command_path):
        result = __to_error("Unknown command: %s" % __to_valid_argv(sys.argv[1]))
    else:
        arguments = json.loads(__to_valid_argv(sys.argv[2]))

        # check is async task to await or not
        is_async_task = (len(sys.argv) == 4) and (sys.argv[3] == 'async_task')

        result = __try_exec_command(command_lib, arguments, is_async_task)

    print(result)

if __name__ == "__main__":
    try:
        __main()
    except Exception as ex:
        print(ex)
