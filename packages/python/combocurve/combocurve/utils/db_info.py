from typing import TypedDict


class DbInfo(TypedDict):
    db_cluster: str
    db_connection_string: str
    db_name: str
    db_password: str
    db_username: str
