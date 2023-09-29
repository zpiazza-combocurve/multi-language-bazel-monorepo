"""wrap py_test"""

load("@pip//:requirements.bzl", "requirement")
load("@rules_python//python:defs.bzl", "py_test")


def pytest_test(name, srcs, data=[], deps = [], args = [], **kwargs):
    """
        Call pytest
    """
    py_test(
        name = name,
        srcs = [
            "//tools/pytest:pytest_wrapper.py",
        ] + srcs,
        data = data,
        main = "//tools/pytest:pytest_wrapper.py",
        args = [
            "--capture=no",
        ] + args + ["$(location :%s)" % x for x in srcs],
        python_version = "PY3",
        srcs_version = "PY3",
        deps = deps + [
            requirement("pytest"),
        ],
        **kwargs
    )