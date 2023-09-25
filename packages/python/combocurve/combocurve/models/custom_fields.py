from mongoengine import FloatField, DateTimeField, BooleanField

from combocurve.shared.date import parse_datetime


class CustomFloatField(FloatField):
    """Floating point number field. Added TypeError check to allow NoneType values"""
    def to_python(self, value):
        try:
            value = super().to_python(value)
        except TypeError:
            pass
        return value


class CustomDateTimeField(DateTimeField):
    def to_mongo(self, value):
        try:
            parsed = parse_datetime(value)
        except Exception:
            parsed = None
        return super().to_mongo(parsed)


class CustomBooleanField(BooleanField):
    def to_python(self, value):
        if isinstance(value, str):
            normalized = value.lower()
            if normalized in {'y', 'yes', 'true', '1'}:
                return True
            if normalized in {'n', 'no', 'false', '0'}:
                return False
            return None

        if value is None:
            return None

        return super().to_python(value)
