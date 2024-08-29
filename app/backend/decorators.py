import logging
from functools import wraps
from typing import Any, Callable, Dict

from quart import abort, current_app, request

from config import (
    CONFIG_AUTH_CLIENT,
    CONFIG_AUTH_CLIENT_T1,
    CONFIG_AUTH_CLIENT_T2,
    CONFIG_AUTH_CLIENT_T3,
    CONFIG_AUTH_CLIENT_T4,
    CONFIG_AUTH_CLIENT_T5,
    CONFIG_AUTH_CLIENT_T6,
    CONFIG_AUTH_CLIENT_T7,
    CONFIG_SEARCH_CLIENT,
    CONFIG_SEARCH_CLIENT_T1,
    CONFIG_SEARCH_CLIENT_T2,
    CONFIG_SEARCH_CLIENT_T3,
    CONFIG_SEARCH_CLIENT_T4,
    CONFIG_SEARCH_CLIENT_T5,
    CONFIG_SEARCH_CLIENT_T6,
    CONFIG_SEARCH_CLIENT_T7
)
from core.authentication import AuthError
from error import error_response


def authenticated_path(route_fn: Callable[[str, Dict[str, Any]], Any]):
    """
    Decorator for routes that request a specific file that might require access control enforcement
    """

    @wraps(route_fn)
    async def auth_handler(path=""):
        # If authentication is enabled, validate the user can access the file
        auth_helper = current_app.config[CONFIG_AUTH_CLIENT_T1]
        search_client = current_app.config[CONFIG_SEARCH_CLIENT_T1]
        authorized = False
        try:
            auth_claims = await auth_helper.get_auth_claims_if_enabled(request.headers)
            authorized = await auth_helper.check_path_auth(path, auth_claims, search_client)
        except AuthError:
            abort(403)
        except Exception as error:
            logging.exception("Problem checking path auth %s", error)
            return error_response(error, route="/content")

        if not authorized:
            abort(403)

        return await route_fn(path, auth_claims)

    return auth_handler


# def authenticated_path(config_auth_client=CONFIG_AUTH_CLIENT, config_search_client=CONFIG_SEARCH_CLIENT):
#     """
#     Decorator for routes that request a specific file that might require access control enforcement
#     """
    
#     def decorator(route_fn: Callable[[str, Dict[str, Any]], Any]):
#         @wraps(route_fn)
#         async def auth_handler(path=""):
#             # If authentication is enabled, validate the user can access the file
#             auth_helper = current_app.config[CONFIG_AUTH_CLIENT]
#             search_client = current_app.config[CONFIG_SEARCH_CLIENT]
#             authorized = False
#             try:
#                 auth_claims = await auth_helper.get_auth_claims_if_enabled(request.headers)
#                 authorized = await auth_helper.check_path_auth(path, auth_claims, search_client)
#             except AuthError:
#                 abort(403)
#             except Exception as error:
#                 logging.exception("Problem checking path auth %s", error)
#                 return error_response(error, route="/content")

#             if not authorized:
#                 abort(403)

#             return await route_fn(path, auth_claims)

#         return auth_handler
    
#     return decorator


# def authenticated(route_fn: Callable[[Dict[str, Any]], Any]):
#     """
#     Decorator for routes that might require access control. Unpacks Authorization header information into an auth_claims dictionary
#     """

#     @wraps(route_fn)
#     async def auth_handler():
#         auth_helper = current_app.config[CONFIG_AUTH_CLIENT_T1]
#         try:
#             auth_claims = await auth_helper.get_auth_claims_if_enabled(request.headers)
#         except AuthError:
#             abort(403)

#         return await route_fn(auth_claims)

#     return auth_handler


def authenticated(config_auth_client=CONFIG_AUTH_CLIENT):
    """
    Decorator for routes that might require access control. Unpacks Authorization header information into an auth_claims dictionary
    """

    def decorator(route_fn: Callable[[Dict[str, Any]], Any]):
        @wraps(route_fn)
        async def auth_handler():
            auth_helper = current_app.config[config_auth_client]
            try:
                auth_claims = await auth_helper.get_auth_claims_if_enabled(request.headers)
            except AuthError:
                abort(403)

            return await route_fn(auth_claims)

        return auth_handler

    return decorator
