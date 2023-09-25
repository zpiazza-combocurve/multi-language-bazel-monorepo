from mongoengine import Document, ObjectIdField, IntField, ListField, DateTimeField, StringField

from combocurve.models.custom_fields import CustomFloatField


def get_monthly_production_model(db_name):
    class MonthlyProduction(Document):
        project = ObjectIdField(default=None, null=True)
        well = ObjectIdField(required=True)
        startIndex = IntField(required=True)  # First day of year calculated from Jan 1st 1900
        first_production_index = IntField(default=0)  # 0-11. Will show the earliest month that has prod data.
        # array. Will contain values like startIndex but for every month.
        index = ListField(IntField(), default=[None] * 12)

        # phase arrays have a fixed length of 12, each element is a data point
        water = ListField(CustomFloatField(), default=[None] * 12)  # phase array
        oil = ListField(CustomFloatField(), default=[None] * 12)  # phase array
        gas = ListField(CustomFloatField(), default=[None] * 12)  # phase array
        operational_tag = ListField(StringField(), default=[None] * 12)
        choke = ListField(CustomFloatField(), default=[None] * 12)  # phase array
        days_on = ListField(IntField(), default=[None] * 12)  # phase array

        gasInjection = ListField(CustomFloatField(), default=[None] * 12)  # phase array
        waterInjection = ListField(CustomFloatField(), default=[None] * 12)  # phase array
        co2Injection = ListField(CustomFloatField(), default=[None] * 12)  # phase array
        steamInjection = ListField(CustomFloatField(), default=[None] * 12)  # phase array
        ngl = ListField(CustomFloatField(), default=[None] * 12)  # phase array

        # custom fields
        customNumber0 = ListField(CustomFloatField(), default=[None] * 12)
        customNumber1 = ListField(CustomFloatField(), default=[None] * 12)
        customNumber2 = ListField(CustomFloatField(), default=[None] * 12)
        customNumber3 = ListField(CustomFloatField(), default=[None] * 12)
        customNumber4 = ListField(CustomFloatField(), default=[None] * 12)

        createdAt = DateTimeField(required=True)
        updatedAt = DateTimeField(required=True)

        meta = {'collection': 'monthly-productions', 'strict': False, 'db_alias': db_name}

    return MonthlyProduction


def get_daily_production_model(db_name):
    class DailyProduction(Document):
        project = ObjectIdField(default=None, null=True)
        well = ObjectIdField(required=True)
        startIndex = IntField(required=True)  # First day of month calculated from Jan 1st 1900
        first_production_index = IntField(default=0)  # 0-30. Will show the earliest day that has prod data.
        # `index` will contain values like startIndex but for every day and have trailing null values if the month has
        # less than 31 days.
        index = ListField(IntField(), default=[None] * 31)

        # Phase arrays have a fixed length of 31, each element is a data point. Months with less than 31 days will have
        # trailing nulls and consumers will need to filter based on the index array or calculate how many days are in
        # the month.
        water = ListField(CustomFloatField(), default=[None] * 31)  # phase array
        oil = ListField(CustomFloatField(), default=[None] * 31)  # phase array
        gas = ListField(CustomFloatField(), default=[None] * 31)  # phase array
        choke = ListField(CustomFloatField(), default=[None] * 31)  # phase array
        hours_on = ListField(IntField(), default=[None] * 31)  # phase array
        gas_lift_injection_pressure = ListField(CustomFloatField(), default=[None] * 31)  # phase array
        bottom_hole_pressure = ListField(CustomFloatField(), default=[None] * 31)  # phase array
        tubing_head_pressure = ListField(CustomFloatField(), default=[None] * 31)  # phase array
        flowline_pressure = ListField(CustomFloatField(), default=[None] * 31)  # phase array
        casing_head_pressure = ListField(CustomFloatField(), default=[None] * 31)  # phase array
        operational_tag = ListField(StringField(), default=[None] * 31)
        vessel_separator_pressure = ListField(CustomFloatField(), default=[None] * 31)  # phase array

        gasInjection = ListField(CustomFloatField(), default=[None] * 31)  # phase array
        waterInjection = ListField(CustomFloatField(), default=[None] * 31)  # phase array
        co2Injection = ListField(CustomFloatField(), default=[None] * 31)  # phase array
        steamInjection = ListField(CustomFloatField(), default=[None] * 31)  # phase array
        ngl = ListField(CustomFloatField(), default=[None] * 31)  # phase array

        # custom fields
        customNumber0 = ListField(CustomFloatField(), default=[None] * 31)
        customNumber1 = ListField(CustomFloatField(), default=[None] * 31)
        customNumber2 = ListField(CustomFloatField(), default=[None] * 31)
        customNumber3 = ListField(CustomFloatField(), default=[None] * 31)
        customNumber4 = ListField(CustomFloatField(), default=[None] * 31)

        createdAt = DateTimeField(required=True)
        updatedAt = DateTimeField(required=True)

        meta = {'collection': 'daily-productions', 'strict': False, 'db_alias': db_name}

    return DailyProduction
