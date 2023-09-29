from dataclasses import dataclass


@dataclass
class PriceConditionals:
    use_btu: bool = False
    use_fpd: bool = False
    use_asof: bool = False


@dataclass
class PricingValues:
    unit: str = ''
    value: str = ''
    cap: str = ''
