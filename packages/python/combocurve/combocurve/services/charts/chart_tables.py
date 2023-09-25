from functools import partial

from matplotlib.table import table as add_table
import seaborn as sns

from combocurve.shared.date import date_from_index
from combocurve.shared.str_format import basic_format_date, basic_format_number, format_percent
from combocurve.shared.functions import compose
from combocurve.science.segment_models.use_forecast_data.chart_data import get_eur
from combocurve.services.forecast.export_settings import ChartsExportSettings
from combocurve.services.charts.units import bbl_to_mbbl

CC_TABLE_HEADERS = [
    'Forecasted By',
    'Forecasted On',
    'Reviewed By',
    'Reviewed At',
    'Status',
    'Phase',
    'Monthly Cum\n(MBBL & MMCF)',
    'Daily Cum\n(MBBL & MMCF)',
    'Type',
    'Series',
    'EUR\n(MBBL & MMCF)',
    'EUR/PLL\n(BBL/FT & MCF/FT)',
    'Segment',
    'Segment Type',
    'Start Date',
    'End Date',
    'q Start\n(BBL/D, MCF/D,\nBBL/MCF, BBL/BBL, MCF/BBL)',
    'q End\n(BBL/D, MCF/D,\nBBL/MCF, BBL/BBL, MCF/BBL)',
    'Di Eff-Sec',
    'Di Nominal\n(1/D)',
    ' b ',
    'Realized D Sw-Eff-Sec',
    'Sw-Date',
]
ARIES_TABLE_HEADERS = [
    'PROPNUM',
    'WELL NAME',
    'WELL NUMBER',
    'INPT ID',
    'API10',
    'API12',
    'API14',
    'CHOSEN ID',
    'ARIES ID',
    'PHDWIN ID',
    'SECTION',
    'SEQUENCE',
    'QUALIFIER',
    'KEYWORD',
    'EXPRESSION',
]
PHASES = ['oil', 'water', 'gas']
FORECAST_DATA_STATUS = {
    "approved": "Approved",
    "in_progress": "In Progress",
    "rejected": "Rejected",
    "submitted": 'Submitted',
}

LANDSCAPE_MARGIN = 3 / 40
LANDSCAPE_CHART_Y = 2 / 5
LANDSCAPE_CHART_HEIGHT = 3 / 5
LANDSCAPE_TABLE_Y = 0
LANDSCAPE_TABLE_HEIGHT = 2 / 5 - LANDSCAPE_MARGIN

PORTRAIT_MARGIN = 3 / 160
PORTRAIT_CHART_Y = 8 / 12
PORTRAIT_CHART_HEIGHT = 4 / 12
PORTRAIT_CC_TABLE_Y = 5 / 12
PORTRAIT_CC_TABLE_HEIGHT = 3 / 12 - 2 * PORTRAIT_MARGIN
PORTRAIT_ARIES_TABLE_Y = 1 / 12
PORTRAIT_ARIES_TABLE_HEIGHT = 4 / 12 - PORTRAIT_MARGIN
PORTRAIT_COMMENTS_TABLE_Y = 0
PORTRAIT_COMMENTS_TABLE_HEIGHT = 1 / 12 - PORTRAIT_MARGIN

FULL_WIDTH_TABLE_LEFT_MARGIN = -0.06


def _set_landscape_layout(plot):
    fig = plot.fig

    plot_axes = plot.facet_axis(0, 0)
    plot_axes.set_position([0, LANDSCAPE_CHART_Y, 1, LANDSCAPE_CHART_HEIGHT])

    table_axes = fig.add_axes([0, LANDSCAPE_TABLE_Y, 1, LANDSCAPE_TABLE_HEIGHT])
    table_axes.axis('off')
    return table_axes


def _set_portrait_layout(plot, settings: ChartsExportSettings):
    fig = plot.fig

    plot_axes = plot.facet_axis(0, 0)
    plot_axes.set_position([0, PORTRAIT_CHART_Y, 1, PORTRAIT_CHART_HEIGHT])

    cc_table_axes = fig.add_axes([0, PORTRAIT_CC_TABLE_Y, 1, PORTRAIT_CC_TABLE_HEIGHT])
    cc_table_axes.axis('off')

    if settings.aries.include_original_forecast:
        aries_table_x = 0.5 + PORTRAIT_MARGIN / 2
        aries_tables_width = 0.5 - PORTRAIT_MARGIN / 2
    else:
        aries_table_x = 0
        aries_tables_width = 1
    aries_table_axes = fig.add_axes(
        [aries_table_x, PORTRAIT_ARIES_TABLE_Y, aries_tables_width, PORTRAIT_ARIES_TABLE_HEIGHT])
    aries_table_axes.axis('off')

    if settings.aries.include_original_forecast:
        aries_original_table_axes = fig.add_axes(
            [0, PORTRAIT_ARIES_TABLE_Y, aries_tables_width, PORTRAIT_ARIES_TABLE_HEIGHT])
        aries_original_table_axes.axis('off')
    else:
        aries_original_table_axes = None

    comments_table_axes = fig.add_axes([0, PORTRAIT_COMMENTS_TABLE_Y, 1, PORTRAIT_COMMENTS_TABLE_HEIGHT])
    comments_table_axes.axis('off')

    return cc_table_axes, aries_table_axes, aries_original_table_axes, comments_table_axes


def _get_text_width(text: str):
    return max((len(line) for line in text.splitlines()), default=0)


def _get_columns_width(table, n_columns):
    column_widths = [0 for _ in range(n_columns)]
    for (_, column), cell in table.get_celld().items():
        column_widths[column] = max(column_widths[column], _get_text_width(cell.get_text().get_text()))
    return column_widths


def _get_row_height(row, data_rows, table_height):
    if row > data_rows:
        remaining_rows_space = table_height - data_rows - 2
        return 0 if remaining_rows_space <= 0 else remaining_rows_space / table_height
    rows_space = max(table_height, data_rows - 2)
    return (2 if row == 0 else 1) / rows_space


def _get_row_height_without_header(row, data_rows, table_height):
    if row >= data_rows:
        remaining_rows_space = table_height - data_rows
        return 0 if remaining_rows_space <= 0 else remaining_rows_space / table_height
    rows_space = max(table_height, data_rows)
    return 1 / rows_space


def _add_table(table_axes, table_headers, table_data, title=None, fontsize=4, left_margin=0, table_height=12):
    if not table_data:
        return

    table = add_table(
        table_axes,
        cellText=table_data + [[''] * len(table_headers)],
        colLabels=table_headers,
        bbox=[0 + left_margin, 0, 1 - left_margin, 1],
    )

    if title:
        table_axes.set_title(title, loc='left', fontsize=10, x=0 + left_margin)

    column_widths = _get_columns_width(table, len(table_headers))

    for (row, column), cell in table.get_celld().items():
        cell.set_text_props(verticalalignment='center_baseline', ha='center', fontsize=fontsize)
        cell.set_edgecolor('darkGray')
        cell.set_height(_get_row_height(row, len(table_data), table_height))
        cell.PAD = 1 / (1 + column_widths[column])
        if row > len(table_data):
            cell.set_alpha(0)
    table.auto_set_column_width(range(len(table_headers)))


def _add_cc_table(table_axes, table_data, settings: ChartsExportSettings):
    _add_table(table_axes,
               CC_TABLE_HEADERS,
               table_data,
               title='ComboCurve Forecast Parameters',
               fontsize=4,
               left_margin=FULL_WIDTH_TABLE_LEFT_MARGIN,
               table_height=16)


def _add_aries_table(table_axes, table_data, settings: ChartsExportSettings):
    if settings.aries.include_original_forecast:
        fontsize = 3
        left_margin = 0.
    else:
        fontsize = 6
        left_margin = FULL_WIDTH_TABLE_LEFT_MARGIN
    _add_table(table_axes,
               ARIES_TABLE_HEADERS,
               table_data,
               title='Aries Forecast Parameters (Fixed Start Date)',
               fontsize=fontsize,
               left_margin=left_margin,
               table_height=24)


def _add_aries_original_table(table_axes, table_data, settings: ChartsExportSettings):
    _add_table(table_axes,
               ARIES_TABLE_HEADERS,
               table_data,
               title='Aries Forecast Parameters (Variable Start Date)',
               fontsize=3,
               left_margin=FULL_WIDTH_TABLE_LEFT_MARGIN * 2,
               table_height=24)


def _add_comments_table(table_axes, table_data, settings: ChartsExportSettings):
    table = add_table(table_axes,
                      cellText=table_data + [['', '', '']],
                      bbox=[0 + FULL_WIDTH_TABLE_LEFT_MARGIN, 0, 1 - FULL_WIDTH_TABLE_LEFT_MARGIN, 1])
    table_axes.set_title('Comments on the Forecast', loc='left', fontsize=10, x=0 + FULL_WIDTH_TABLE_LEFT_MARGIN)

    cell_dict = table.get_celld()

    for (row, column), cell in cell_dict.items():
        cell.set_text_props(verticalalignment='center_baseline', fontsize=8)
        cell.set_height(_get_row_height_without_header(row, len(table_data), 5))
        cell.set_edgecolor('white')
        if column == 0:  # user column
            cell.set_text_props(horizontalalignment='right', fontweight='bold')
            cell.PAD = 0
        if column == 1:  # date column
            cell.set_text_props(color='darkGray')
        if column == 2:  # text column
            cell.set_text_props(horizontalalignment='left')
            cell.PAD = 0

    table.auto_set_column_width([0, 1])

    # fake table, just for the edges
    edges_table = add_table(table_axes,
                            cellText=[['']],
                            bbox=[0 + FULL_WIDTH_TABLE_LEFT_MARGIN, 0, 1 - FULL_WIDTH_TABLE_LEFT_MARGIN, 1])
    for cell in edges_table.get_celld().values():
        cell.set_edgecolor('darkGray')
        cell.set_fill(False)


def _get_table_value(value, formatter=lambda x: x):
    if value is None:
        return ''
    return formatter(value)


def _get_user_full_name(user):
    return f'{user.get("firstName","")} {user.get("lastName","")}'


def _get_segment_data(well_data, phase, series_key, series, segment_index, segment):
    phase_key = phase['phase']

    monthly_cum = sum(p for p in well_data.get('monthly_production', {}).get(phase_key, []) if p)
    daily_cum = sum(p for p in well_data.get('daily_production', {}).get(phase_key, []) if p)

    eur = get_eur(well_data, phase, series, monthly_cum, daily_cum)
    pll = well_data['header'].get('perf_lateral_length', None)

    return [
        _get_table_value(phase.get('forecastedBy'), _get_user_full_name),  # Forecasted By
        _get_table_value(phase.get('forecastedAt'), basic_format_date),  # Forecasted On
        _get_table_value(phase.get('reviewedBy'), _get_user_full_name),  # Reviewed By
        _get_table_value(phase.get('reviewedAt'), basic_format_date),  # Reviewed At
        _get_table_value(phase.get('status'), lambda status: FORECAST_DATA_STATUS[status]),  # Status
        phase_key,  # Phase
        _get_table_value(monthly_cum, compose(basic_format_number, bbl_to_mbbl)),  # Monthly Cum
        _get_table_value(daily_cum, compose(basic_format_number, bbl_to_mbbl)),  # Daily Cum
        phase['forecastType'],  # Type
        series_key,  # Series
        _get_table_value(eur, compose(basic_format_number, bbl_to_mbbl)),  #  EUR
        _get_table_value(eur / pll if pll else None, basic_format_number),  # EUR/FT
        segment_index + 1,  # Segment
        segment['name'],  # Segment Type
        _get_table_value(segment['start_idx'], compose(basic_format_date, date_from_index)),  # Start Date
        _get_table_value(segment['end_idx'], compose(basic_format_date, date_from_index)),  # End Date
        _get_table_value(segment.get('q_start'), basic_format_number),  # q Start
        _get_table_value(segment.get('q_end'), basic_format_number),  # q End
        _get_table_value(segment.get('D_eff'), format_percent),  # Di Eff-Sec
        _get_table_value(segment.get('D'), partial(basic_format_number, decimal_digits=6)),  # Di Nominal
        _get_table_value(segment.get('b'), basic_format_number),  # b
        _get_table_value(segment.get('realized_D_eff_sw'), format_percent),  # Realized D Sw-Eff-Sec
        _get_table_value(segment.get('sw_idx'), compose(basic_format_date, date_from_index))  # Sw-Date
    ]


def _get_series(forecast_phase):
    if forecast_phase['forecastType'] == 'ratio':
        return [('ratio', forecast_phase['ratio'])]
    return forecast_phase.get('P_dict', {}).items()


def _get_cc_table_data(well_data):
    forecast_phases = (well_data.get('forecast_data', {}).get(phase_key, {}) for phase_key in PHASES
                       if phase_key in well_data['forecast_data'])
    return [
        _get_segment_data(well_data, phase, series_key, series, segment_index, segment) for phase in forecast_phases
        for series_key, series in _get_series(phase) for segment_index, segment in enumerate(series['segments'])
    ]


def _get_comment_row(comment):
    return [
        f'  {_get_table_value(comment.get("createdBy"), _get_user_full_name)} |',
        _get_table_value(comment.get('createdAt'), basic_format_date),
        _get_table_value(comment.get('text'))
    ]


def _get_comments_table_data(comments):
    return [_get_comment_row(c) for c in comments]


def add_tables(well_data: dict, plot: sns.FacetGrid, settings: ChartsExportSettings):
    if not settings.include_parameters and not settings.aries.include and not settings.include_comments:
        return

    if settings.landscape_orientation:
        cc_table_axes = _set_landscape_layout(plot)
    else:
        (cc_table_axes, aries_table_axes, aries_original_table_axes,
         comments_table_axes) = _set_portrait_layout(plot, settings)

    if settings.include_parameters and cc_table_axes:
        cc_table_data = _get_cc_table_data(well_data)
        _add_cc_table(cc_table_axes, cc_table_data, settings)

    if settings.aries.include and aries_table_axes:
        aries_table_data = well_data.get('aries_data', {}).get('with_start_date')
        _add_aries_table(aries_table_axes, aries_table_data, settings)

        if settings.aries.include_original_forecast and aries_original_table_axes:
            aries_original_table_data = well_data.get('aries_data', {}).get('without_start_date')
            _add_aries_original_table(aries_original_table_axes, aries_original_table_data, settings)

    if settings.include_comments and comments_table_axes:
        comments_data = _get_comments_table_data(well_data.get('header', {}).get('comments', []))
        _add_comments_table(comments_table_axes, comments_data, settings)
