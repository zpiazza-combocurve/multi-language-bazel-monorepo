from typing import Dict


def get_discount_map(discount_table: Dict, reporting_units: Dict):
    first_discount = discount_table['first_discount']
    second_discount = discount_table['second_discount']

    cash_unit = reporting_units.get('cash', 'M$')

    discount_map = {
        f'First Discount Total Net Investment ({cash_unit})':
        f'{first_discount} Discount Total Net CAPEX ({cash_unit})',
        f'Second Discount Total Net Investment ({cash_unit})':
        f'{second_discount} Discount Total Net CAPEX ({cash_unit})',
        f'First Discount Net Operating Income ({cash_unit})':
        f'{first_discount} Discount Net Operating Income ({cash_unit})',
        f'Second Discount Net Operating Income ({cash_unit})':
        f'{second_discount} Discount Net Operating Income ({cash_unit})',
        f'First Discount Cash Flow ({cash_unit})': f'{first_discount} Discount Cash Flow ({cash_unit})',
        f'Second Discount Cash Flow ({cash_unit})': f'{second_discount} Discount Cash Flow ({cash_unit})',
        f'AFIT First Discount Cash Flow ({cash_unit})':
        f'{first_discount} After Income Tax Discount Cash Flow ({cash_unit})',
        f'AFIT Second Discount Cash Flow ({cash_unit})':
        f'{second_discount} After Income Tax Discount Cash Flow ({cash_unit})',
        'After Tax Income First Discount ROI (Discounted CAPEX) (ratio)':
        f'{first_discount} After Income Tax Discount ROI w/ Discounted CAPEX (ratio)',
        'After Tax Income Second Discount ROI (Discounted CAPEX) (ratio)':
        f'{second_discount} After Income Tax Discount ROI w/ Discounted CAPEX (ratio)',
        'After Tax Income First Discount ROI (Undiscounted CAPEX) (ratio)':
        f'{first_discount} After Income Tax Discount ROI w/ Undiscounted CAPEX (ratio)',
        'After Tax Income Second Discount ROI (Undiscounted CAPEX) (ratio)':
        f'{second_discount} After Income Tax Discount ROI w/ Undiscounted CAPEX (ratio)',
        'After Income Tax First Discount Payout Date': f'{first_discount} After Income Tax Discount Payout Date',
        'After Income Tax First Discount Payout Duration (months)':
        f'{first_discount} After Income Tax Discount Payout Duration (months)',
        'After Income Tax Second Discount Payout Date': f'{second_discount} After Income Tax Discount Payout Date',
        'After Income Tax Second Discount Payout Duration (months)':
        f'{second_discount} After Income Tax Discount Payout Duration (months)',
        'First Discount ROI (Discounted CAPEX) (ratio)': f'{first_discount} Discount ROI w/ Discounted CAPEX (ratio)',
        'Second Discount ROI (Discounted CAPEX) (ratio)': f'{second_discount} Discount ROI w/ Discounted CAPEX (ratio)',
        'First Discount ROI (Undiscounted CAPEX) (ratio)':
        f'{first_discount} Discount ROI w/ Undiscounted CAPEX (ratio)',
        'Second Discount ROI (Undiscounted CAPEX) (ratio)':
        f'{second_discount} Discount ROI w/ Undiscounted CAPEX (ratio)',
        'First Discount Payout Date': f'{first_discount} Discount Payout Date',
        'First Discount Payout Duration (months)': f'{first_discount} Discount Payout Duration (months)',
        'Second Discount Payout Date': f'{second_discount} Discount Payout Date',
        'Second Discount Payout Duration (months)': f'{second_discount} Discount Payout Duration (months)',
    }

    # add discount table cum CFs, CC model has 16 rows, ARIES import model has 15 rows, need to make it dynamic
    for i in range(len(discount_table['rows'])):
        col_name_with_pct = f'{discount_table["rows"][i]}% Discount Cash Flow ({cash_unit})'
        discount_map[f'Discount Table Cum CF {i+1} ({cash_unit})'] = col_name_with_pct
        discount_map[f'AFIT Discount Table Cum CF {i+1} ({cash_unit})'] = f'AFIT {col_name_with_pct}'

    return discount_map
