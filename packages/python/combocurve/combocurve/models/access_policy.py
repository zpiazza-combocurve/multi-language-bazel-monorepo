from enum import Enum
from mongoengine import (Document, StringField, ListField, ObjectIdField)


class MemberType(Enum):
    users = 'users'
    groups = 'groups'

    @classmethod
    def list(cls):
        return list(map(lambda c: c.value, cls))


class ResourceType(Enum):
    company = 'company'
    project = 'project'

    @classmethod
    def list(cls):
        return list(map(lambda c: c.value, cls))


PROJECT_ADMIN_ROLE = 'project.project.admin'


def get_access_policy_model(db_name):
    class AccessPolicy(Document):
        memberType = StringField(choices=MemberType.list(), required=True)
        memberId = ObjectIdField()

        resourceType = StringField(choices=ResourceType.list(), required=True)
        resourceId = ObjectIdField()

        roles = ListField(StringField())

        meta = {'collection': 'access-policies', 'strict': False, 'db_alias': db_name}

    return AccessPolicy
