from combocurve.dal.mock_stubs import DailyProduction, MonthlyProduction


class MockDAL:

    daily_production: DailyProduction
    monthly_production: MonthlyProduction

    def __init__(self, monthly_productions_collection, daily_productions_collection) -> None:
        self.daily_production = DailyProduction(daily_productions_collection)
        self.monthly_production = MonthlyProduction(monthly_productions_collection)
