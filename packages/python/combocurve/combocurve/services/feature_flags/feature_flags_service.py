import logging
from enum import Enum
from typing import Union

import ldclient
from ldclient import Context
from ldclient.config import Config
from pydantic import BaseModel

from combocurve.shared.secret_manager import SecretManager
from combocurve.services.feature_flags.feature_flag_list import check_valid_flag_name
from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID
from combocurve.utils.design_patterns import SingletonMeta

logger = logging.getLogger(__name__)


class ContextType(str, Enum):
    """The type of the context for LaunchDarkly feature flag evaluation.

    Should match the configuration in LaunchDarkly.
    """
    organization = "organization"
    user = "user"


class LaunchDarklyContext(BaseModel):
    """Context for LaunchDarkly feature flag evaluation

    Attributes:
        context_name: The name of the context (the tenant-email pair or the organization name)
        context_type: The type of the context (user (for email) or organization)

    """
    context_name: str
    context_type: ContextType


class FeatureFlagsService(metaclass=SingletonMeta):
    def __init__(self):
        if GCP_PRIMARY_PROJECT_ID:
            secret_manager = SecretManager(GCP_PRIMARY_PROJECT_ID)

            self.sdk_key = secret_manager.access_secret("launchDarklySDKKey")
        else:
            self.sdk_key = None
        self.ld_client = ldclient
        logger.info(f"Initializing LaunchDarkly client in Project with ID: {GCP_PRIMARY_PROJECT_ID}.")
        self.ld_client.set_config(Config(sdk_key=self.sdk_key))

    def evaluate_boolean_flag(self, flag_name: str, context: LaunchDarklyContext) -> bool:
        """
        Evaluates a feature flag for a given context. Boolean version.

        Args:
            flag_name: The name of the feature flag.
            context: The context for the feature flag evaluation.

        Returns:
            True if the feature flag is enabled for the given context, False otherwise.
        """
        if not check_valid_flag_name(flag_name):
            logger.error(f"Invalid flag name called: {flag_name}. Context: {context}. Returning False.")
            return False
        context = Context.builder(context.context_type.value).name(context.context_name).build()
        evaluation_result = bool(self.ld_client.get().variation(flag_name, context, False))
        logger.info(f"Feature flag {flag_name} evaluated to {evaluation_result} for context {context}.")
        return evaluation_result


def evaluate_boolean_flag(flag_name: str,
                          context: Union[LaunchDarklyContext, dict[str, str]],
                          default_fallback_value=None) -> bool:
    """Helper function that wraps over the Feature Flag service and Evaluates a feature flag for a given context.
    Boolean version. This function can be used anywhere in the code to evaluate a feature flag.

    You can pass either a LaunchDarklyContext directly or a dict with the required fields for the LaunchDarklyContext.

    Hint: Using this function is preferred over using the FeatureFlagsService directly as it is easier to mock in tests.

    Args:
        flag_name: The name of the feature flag.
        context: The context for the feature flag evaluation. Can be either a LaunchDarklyContext or a dict with the
                 required fields for the LaunchDarklyContext.
                 The structure of the dict should be: {"context_name": "<context_name>",
                                                       "context_type": "organization" | "user"}
        default_fallback_value: The default value to return if the flag is not found. Defaults to None, which will
                                raise an exception if the flag is not found or the flag context is invalid.

    Returns:
        True if the feature flag is enabled for the given context, False otherwise.

    Raises:
        AssertionError: If the context is invalid and no default_fallback_value is provided.
    """
    if isinstance(context, dict):
        try:
            assert "context_name" in context
            assert "context_type" in context
            assert len(context) == 2
            context = LaunchDarklyContext(**context)
        except AssertionError as e:
            logger.error(f"Invalid context passed: {context}. Error: {e}")
            if default_fallback_value is None:
                raise e
            else:
                return default_fallback_value
    return FeatureFlagsService().evaluate_boolean_flag(flag_name, context)
