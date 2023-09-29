from combocurve.shared.aries_import_enums import CCSchemaEnum, ForecastEnum
from combocurve.utils.constants import DAYS_IN_YEAR


def handle_adx_log_ratio(q_start, q_end, d, doc, expression, start_idx, end_idx, max_date_index, pred_exp):
    try:
        date_unit = expression[4]
    except IndexError:
        date_unit = None
    if date_unit in ['ADX', 'MOX']:
        q_end = pred_exp(q_start, d, max_date_index - start_idx)
        end_idx = max_date_index
        doc[CCSchemaEnum.end_date.value] = None

    return q_end, end_idx


def get_k_linear(start_idx, q_start, end_idx, q_end):
    return (q_end - q_start) / (end_idx - start_idx)


def get_d_eff_linear(k, q_start):
    return -k * DAYS_IN_YEAR / q_start


def end_idx_limit_check(end_idx, max_date_index):
    # allowable pandas date limit
    if end_idx > max_date_index:
        end_idx = max_date_index
    return end_idx


def get_k_qend(document, max_date_index):
    k = -(document[ForecastEnum.qi.value] * (document[ForecastEnum.linear_deff.value] / 100)) / DAYS_IN_YEAR
    if document[ForecastEnum.end_index.value] > max_date_index:
        document[ForecastEnum.end_index.value] = max_date_index
    q_end = ((document[ForecastEnum.end_index.value] - document[ForecastEnum.start_index.value])
             * k) + document[ForecastEnum.qi.value]
    return k, q_end


def get_k_end_idx(document, max_date_index):
    k = -(document[ForecastEnum.qi.value] * (document[ForecastEnum.linear_deff.value] / 100)) / DAYS_IN_YEAR
    end_idx = ((document[ForecastEnum.qend.value] - document[ForecastEnum.qi.value])
               / k) + document[ForecastEnum.start_index.value]
    if end_idx > max_date_index:
        end_idx = max_date_index
    document[ForecastEnum.qend.value] = document[ForecastEnum.qi.value] + (
        (end_idx - document[ForecastEnum.start_index.value]) * k)
    return k, end_idx


def update_linear_segment(d_eff, segment):
    segment.update(linear_ratio_template)
    if d_eff <= 0:
        segment[ForecastEnum.slope.value] = 1
    else:
        segment[ForecastEnum.slope.value] = -1


linear_ratio_template = {ForecastEnum.name.value: ForecastEnum.linear.value}
