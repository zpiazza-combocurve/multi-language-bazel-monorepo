"""
Use this file to add feature flags to the list of all feature flags. It will be used as a checklist to make sure
that requests for feature flags are not open-ended. This file is used by the feature_flag.py file in the same directory.

Make sure to use python's snake case for the feature flag name.
"""
from functools import lru_cache


class EnabledFeatureFlags:
    roll_out_compositional_economics = "roll-out-compositional-economics"


@lru_cache(maxsize=1)
def _get_all_flags() -> set:
    """Returns a set of all feature flags. Cached."""
    return {flag_name for flag_name in EnabledFeatureFlags.__dict__.values()}


def check_valid_flag_name(flag_name: str) -> bool:
    """Checks if the flag name is valid, i.e. if it is in the list of all feature flags."""
    return flag_name in _get_all_flags()
