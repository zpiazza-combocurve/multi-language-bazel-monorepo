from typing import Any, Optional
from datetime import date, datetime
from collections import defaultdict, namedtuple
from collections.abc import Mapping, Iterable, Collection
from itertools import chain

from mongoengine.base.fields import ComplexBaseField
from pymongo import UpdateMany, ReplaceOne, DeleteMany
from bson.objectid import ObjectId
from mongoengine import IntField, FloatField

import combocurve.lib.geohash as geohash
from combocurve.models.custom_fields import CustomFloatField
from combocurve.models.well import production_calcs
from combocurve.shared.collections import aggregate_dicts, first_increasing_sequence
from combocurve.shared.helpers import gen_inpt_id, clean_id, move_from_dict
from combocurve.shared.date import date_to_datetime, parse_date, get_month
from combocurve.shared.db_import import (calcs_pipeline, get_project_custom_headers_pipeline, min_with_check,
                                         set_on_insert, bulkwrite_operation)
from combocurve.shared.header_conversion import convert_headers, parse_float
from combocurve.shared.production_constants import (MONTHLY_PROD_FIELDS, DAILY_PROD_FIELDS, SURVEY_FIELDS,
                                                    SURVEY_LATITUDE_FIELD, SURVEY_LONGITUDE_FIELD,
                                                    SURVEY_MEASURED_DEPTH_FIELD, DAL_FIELD_NAME_MAP)
from combocurve.shared.directional_survey_calculations import get_missing_columns, is_valid_survey_data
from combocurve.shared.map_calculations import transform_to_wgs84
from combocurve.utils.exceptions import get_exception_info
from combocurve.services.data_import.import_data import ImportData, WellDataRow, DataSettings
from combocurve.dal.client import DAL

UPSERT_REQUEST_FIELDS = ['well', 'date', 'project']


class ImportService:
    Replace = namedtuple("Replace", ['id', 'update', 'remove'])

    def __init__(self, context):
        self.context = context

    def upsert_wells(self, data: ImportData, replace_production, operation="upsert"):
        full_extra_data = {
            **data.extra_data,
            **{
                'dataSource': data.data_settings.data_source,
                'project': data.data_settings.project
            }
        }
        wells = [(self._get_well_doc(convert_headers(r.get_headers_dict(), data.data_settings.data_source),
                                     full_extra_data, operation, data.data_settings),
                  self._get_prod_limit_dates(r.get_monthly_rows(), r.get_daily_rows()),
                  self._get_has_survey(r.get_survey_rows(), data.data_settings)) for r in data.rows]

        headers_bulk_operations = [
            self._get_well_upsert_op(w, prod_limit_dates, replace_production, data.data_settings, operation, has_survey)
            for (w, prod_limit_dates, has_survey) in wells
        ]

        if not headers_bulk_operations:
            return {}, []

        # upsert wells
        res = bulkwrite_operation(self.context.wells_collection, headers_bulk_operations)

        well_docs = [doc for (doc, _, _) in wells]

        return res, well_docs

    def replace_wells_by_id(self, data: Iterable[Mapping], extra_data: Mapping, set_default_values=True):
        data_settings = DataSettings('', '', 'id')
        replace_data = [
            self.Replace(id=r.get('id'),
                         update=self._get_well_dict_to_replace(r.get('update', {}), extra_data, data_settings,
                                                               set_default_values),
                         remove=r.get('remove')) for r in data
        ]

        headers_bulk_operations = [
            self._get_well_replace_op(id=r.id, update=r.update, remove=r.remove) for r in replace_data
        ]

        if not headers_bulk_operations:
            return

        res = bulkwrite_operation(self.context.wells_collection, headers_bulk_operations)

        return res

    def update_calcs(self, well_docs, data_settings: DataSettings):
        return self.context.wells_collection.update_many(self.get_wells_query(well_docs, data_settings), calcs_pipeline)

    def update_calcs_by_id(self, well_ids: Iterable[str]):
        return self.context.wells_collection.update_many({'_id': {
            '$in': [ObjectId(id) for id in well_ids]
        }}, calcs_pipeline)

    def get_wells_query(self, well_docs, data_settings: DataSettings):
        if data_settings.id == '_id':
            return {'_id': {'$in': [ObjectId(doc[self._mongoengine_field(data_settings.id)]) for doc in well_docs]}}
        return {
            data_settings.id: {
                '$in': [doc[data_settings.id] for doc in well_docs]
            },
            'dataSource': data_settings.data_source,
            'project': ObjectId(data_settings.project) if data_settings.project else None
        }

    def get_single_well_query(self, well_doc, data_settings: DataSettings):
        if data_settings.id == '_id':
            return {'_id': ObjectId(well_doc[self._mongoengine_field(data_settings.id)])}
        return {
            data_settings.id: well_doc[self._mongoengine_field(data_settings.id)],
            'dataSource': data_settings.data_source,
            'project': ObjectId(data_settings.project) if data_settings.project else None
        }

    def get_wells_ids(self, well_docs, data_settings: DataSettings):
        query = self.get_wells_query(well_docs, data_settings)
        well_ids = self.context.well_model.objects(__raw__=query).only(data_settings.id)
        res = defaultdict(list)
        for doc in well_ids:
            res[doc[self._mongoengine_field(data_settings.id)]].append(doc.id)
        return res

    def get_wells_surface_locations(self, well_docs, data_settings: DataSettings):
        return {
            doc[self._mongoengine_field(data_settings.id)]: (doc.surfaceLatitude, doc.surfaceLongitude)
            for doc in well_docs
        }

    def replace_survey(self, import_data: ImportData, well_ids_dict: Mapping, wells_surface_locations: Mapping):
        survey_by_well_dict, stats = self._get_survey_dicts(import_data, well_ids_dict, wells_surface_locations)

        survey_replace_operations = [
            self._get_survey_replace_op(well, self._get_survey_doc(well, data, import_data.data_settings.project))
            for (well, data) in survey_by_well_dict.items() if data
        ]

        if survey_replace_operations:
            bulkwrite_operation(self.context.well_directional_surveys_collection, survey_replace_operations)

        return stats

    def update_monthly(self, import_data: ImportData, well_ids_dict: Mapping, replace=False):
        return self._update_prod(import_data, well_ids_dict, monthly=True, replace=replace)

    def delete_well_survey(self, id: str, well_id: str):
        output = self.context.well_directional_surveys_collection.delete_one({'_id': ObjectId(id)})

        if output.deleted_count > 0:
            self.context.wells_collection.update_one({'_id': ObjectId(well_id)}, [{
                '$set': {
                    'has_directional_survey': False
                }
            }])

        return {'nMatched': output.deleted_count, 'nModified': output.deleted_count}

    def update_daily(self, import_data: ImportData, well_ids_dict: Mapping, replace=False):
        return self._update_prod(import_data, well_ids_dict, monthly=False, replace=replace)

    def _generate_field_mask(self, row_data):
        return UPSERT_REQUEST_FIELDS + list(row_data.keys())

    def _update_prod(self, import_data: ImportData, well_ids_dict: Mapping, monthly=True, replace=False):
        # get production data rows, wells and stats
        prod_data_rows, wells, stats = self._get_prod_dicts(import_data,
                                                            well_ids_dict,
                                                            monthly=monthly,
                                                            id=import_data.data_settings.id)

        if replace:
            # delete production data
            self._delete_production_data_to_replace(wells, monthly=monthly)

        dal: DAL = self.context.dal

        # get upsert request and upsert function
        upsert_production = dal.monthly_production if monthly else dal.daily_production

        # get upsert request generator and upsert
        generator_of_request = (upsert_production.to_upsert_request(
            field_mask=self._generate_field_mask(row['data']),
            well=str(row['well']),
            date=row['date'],
            project=str(import_data.data_settings.project) if import_data.data_settings.project else None,
            **row['data'],
        ) for row in prod_data_rows)

        upsert_production.upsert(generator_of_request)

        return {'total': stats['total'], 'imported': stats['valid']}

    def _delete_production_data_to_replace(self, wells, monthly=True):
        if len(wells) == 0:
            return

        # delete existing production data if replace
        if monthly:
            self.context.dal.monthly_production.delete_by_many_wells(wells=[str(well_id) for well_id in wells])
        else:
            self.context.dal.daily_production.delete_by_many_wells(wells=[str(well_id) for well_id in wells])

    def add_to_project(self, import_id: ObjectId, project: str):
        if project is None:
            return

        imported_wells = list(self.context.well_model.objects(mostRecentImport=import_id).only('id'))

        self.add_wells_ids_to_project([well.id for well in imported_wells], project)

    def add_well_docs_to_project(self, well_docs, data_settings: DataSettings):
        wells_ids = list(chain(*self.get_wells_ids(well_docs, data_settings).values()))
        self.add_wells_ids_to_project(wells_ids, data_settings.project)

    def add_wells_ids_to_project(self, wells_ids: Iterable[ObjectId], project: Optional[str]):
        if project is None:
            return

        project_id = ObjectId(project)

        self.context.project_collection.update_one({'_id': project_id}, [{
            '$set': {
                'wells': {
                    '$setUnion': ['$wells', wells_ids]
                }
            }
        }])

        custom_headers = self.context.project_custom_header_collection.find_one({'project': project_id},
                                                                                projection=['_id'])
        if custom_headers:
            project_custom_headers_pipeline = get_project_custom_headers_pipeline(
                project_id,
                wells_ids,
                self.context.project_custom_headers_data_collection,
            )
            self.context.wells_collection.aggregate(project_custom_headers_pipeline)

    def _get_well_doc(self,
                      headers_dict: Mapping,
                      extra_data: Mapping,
                      operation: str,
                      data_settings: DataSettings,
                      set_default_values=True):
        if operation == 'production_calcs_only':
            return {
                self._mongoengine_field(data_settings.id): headers_dict.get(data_settings.id, None),
                **{k: v
                   for k, v in extra_data.items() if v is not None}
            }

        headers_dict = {k: v for k, v in headers_dict.items() if self._has_value(v)}
        headers_dict.update({k: v for k, v in extra_data.items() if v is not None})
        headers_dict.update(self.get_coordinates(headers_dict, data_settings))

        valid_headers = self._get_valid_headers(headers_dict)

        doc = self.context.well_model(**valid_headers)

        if (set_default_values):
            return doc

        return {k: v for k, v in self._doc_to_dict(doc, self.context.well_model).items() if k in valid_headers}

    def _get_valid_headers(self, headers_dict: Mapping, pass_has_value=False):
        well_fields = self.context.well_model._fields

        return {
            k: self._get_field_value(well_fields[k], v)
            for (k, v) in headers_dict.items() if k in well_fields and (pass_has_value or self._has_value(v))
        }

    def _get_well_dict_to_replace(self,
                                  headers_dict: Mapping,
                                  extra_data: Mapping,
                                  data_settings: DataSettings,
                                  set_default_values=True):
        well_doc = self._doc_to_dict(
            self._get_well_doc(headers_dict, extra_data, 'replace', data_settings, set_default_values),
            self.context.well_model)
        all_headers = {**headers_dict, **well_doc}
        return {k: v for k, v in all_headers.items() if k not in production_calcs}

    def _get_well_upsert_op(self,
                            w,
                            prod_limit_dates: Mapping,
                            replace_production: bool,
                            data_settings: DataSettings,
                            operation="upsert",
                            has_survey=False):
        well_dict = w if operation == 'production_calcs_only' else w.to_mongo().to_dict()
        update_set = {k: v for k, v in well_dict.items() if self._has_value(v)}
        on_insert = {k: v for k, v in well_dict.items() if not self._has_value(v)}
        update_min = {}
        update_max = {}

        on_insert.update({'createdAt': datetime.utcnow(), 'inptID': gen_inpt_id()})
        update_set['updatedAt'] = datetime.utcnow()

        (monthly_first_date, monthly_last_date) = prod_limit_dates['monthly']
        if monthly_first_date is not None:
            update_set['has_monthly'] = True
            if replace_production:
                update_set['first_prod_date_monthly_calc'] = date_to_datetime(monthly_first_date)
                on_insert.pop('first_prod_date_monthly_calc', None)
                update_set['last_prod_date_monthly'] = date_to_datetime(monthly_last_date)
                on_insert.pop('last_prod_date_monthly', None)
            else:
                update_min['first_prod_date_monthly_calc'] = date_to_datetime(monthly_first_date)
                update_set.pop('first_prod_date_monthly_calc', None)
                on_insert.pop('first_prod_date_monthly_calc', None)
                update_max['last_prod_date_monthly'] = date_to_datetime(monthly_last_date)
                update_set.pop('last_prod_date_monthly', None)
                on_insert.pop('last_prod_date_monthly', None)
        else:
            move_from_dict(update_set, on_insert, 'has_monthly', False)
            move_from_dict(update_set, on_insert, 'first_prod_date_monthly_calc')
            move_from_dict(update_set, on_insert, 'last_prod_date_monthly')

        (daily_first_date, daily_last_date) = prod_limit_dates['daily']
        if daily_first_date is not None:
            update_set['has_daily'] = True
            if replace_production:
                update_set['first_prod_date_daily_calc'] = date_to_datetime(daily_first_date)
                on_insert.pop('first_prod_date_daily_calc', None)
                update_set['last_prod_date_daily'] = date_to_datetime(daily_last_date)
                on_insert.pop('last_prod_date_daily', None)
            else:
                update_min['first_prod_date_daily_calc'] = date_to_datetime(daily_first_date)
                update_set.pop('first_prod_date_daily_calc', None)
                on_insert.pop('first_prod_date_daily_calc', None)
                update_max['last_prod_date_daily'] = date_to_datetime(daily_last_date)
                update_set.pop('last_prod_date_daily', None)
                on_insert.pop('last_prod_date_daily', None)
        else:
            move_from_dict(update_set, on_insert, 'has_daily', False)
            move_from_dict(update_set, on_insert, 'first_prod_date_daily_calc')
            move_from_dict(update_set, on_insert, 'last_prod_date_daily')

        if has_survey:
            update_set['has_directional_survey'] = True
        else:
            move_from_dict(update_set, on_insert, 'has_directional_survey', False)

        query = self.get_single_well_query(w, data_settings)

        if operation == "insert":
            update = {'$setOnInsert': {**on_insert, **update_min, **update_max, **update_set}}
            upsert = True
        elif operation == "update" or operation == 'production_calcs_only':
            update_max = {key: {'$max': [f'${key}', val]} for key, val in update_max.items()}
            update_min = {key: min_with_check(f'${key}', val) for key, val in update_min.items()}
            update = {'$set': {**update_min, **update_max, **update_set}}
            upsert = False
        else:
            update_max = {key: {'$max': [f'${key}', val]} for key, val in update_max.items()}
            update_min = {key: min_with_check(f'${key}', val) for key, val in update_min.items()}
            on_insert = {key: set_on_insert(key, val) for key, val in on_insert.items()}
            update = {'$set': {**on_insert, **update_min, **update_max, **update_set}}
            upsert = True

        update = {k: v for k, v in update.items() if v}

        if operation != "insert":
            update = [update]

        return UpdateMany(query, update, upsert=upsert)

    def _get_well_replace_op(self, id, update, remove):
        update_set = dict(update)
        update_set['updatedAt'] = datetime.utcnow()

        remove_set = {k: '' for k in remove if k not in update_set}

        upd = {}
        if update_set:
            upd['$set'] = update_set
        if remove_set:
            upd['$unset'] = remove_set
        return UpdateMany({'_id': ObjectId(id)}, upd)

    def _get_prod_dicts(
        self,
        data: ImportData,
        well_ids_dict: Mapping,
        id='chosenID',
        monthly=True,
    ):

        if monthly:
            prod_rows = (p_row for r in data.rows for p_row in r.get_monthly_rows())
        else:
            prod_rows = (p_row for r in data.rows for p_row in r.get_daily_rows())

        prod_data_rows = []
        well_ids = set()

        update_data_per_id = (self._get_prod_update_data(p_row.get_dict(), well_ids_dict, monthly=monthly, id=id)
                              for p_row in prod_rows)

        total_prod_rows = 0
        valid_prod_rows = 0

        for prod_row_data in update_data_per_id:
            valid_row = False
            for one_insert_row in prod_row_data:
                if one_insert_row.get('well') is None or one_insert_row.get('date') is None or not one_insert_row.get(
                        'data'):
                    continue
                valid_row = True
                prod_data_rows.append(one_insert_row)
                well_ids.add(one_insert_row['well'])

            if valid_row:
                valid_prod_rows += 1
            total_prod_rows += 1

        return prod_data_rows, well_ids, {'total': total_prod_rows, 'valid': valid_prod_rows}

    def _get_survey_dicts(self, import_data: ImportData, well_ids_dict: Mapping, wells_surface_locations: Mapping):
        all_survey_rows = (survey_row for r in import_data.rows for survey_row in r.get_survey_rows())
        survey_rows_dict = (r.get_dict() for r in all_survey_rows)
        by_well_id = self._group_by_well_id(survey_rows_dict, import_data.data_settings.id)
        ready_data = {
            well_id: self._get_survey_well_data(well_survey_row_dicts, wells_surface_locations.get(well_id),
                                                import_data.data_settings)
            for well_id, well_survey_row_dicts in by_well_id.items()
        }
        by_well_ready_data = {
            well: data
            for (well_id, (data, _)) in ready_data.items() for well in well_ids_dict.get(well_id, [])
        }

        aggregated_stats = aggregate_dicts((stats for _, stats in ready_data.values()), {
            'total_rows': 0,
            'valid_rows': 0,
            'errors': []
        })
        aggregated_stats['total_wells'] = len(ready_data)
        aggregated_stats['valid_wells'] = sum((1 for _, stats in ready_data.values() if stats['valid_rows']))

        return by_well_ready_data, aggregated_stats

    def _get_survey_replace_op(self, well, doc):
        find = {'well': ObjectId(well)}
        return ReplaceOne(find, doc.to_mongo().to_dict(), upsert=True)

    def _get_survey_delete_op(self, wells):
        return DeleteMany({'well': {'$in': [ObjectId(w) for w in wells]}})

    def _get_prod_limit_dates(self, monthly_rows: Iterable[WellDataRow], daily_rows: Iterable[WellDataRow]):
        return {
            'monthly': self._get_monthly_limit_dates(monthly_rows),
            'daily': self._get_daily_limit_dates(daily_rows)
        }

    def _get_has_survey(self, survey_rows: Collection[WellDataRow], data_settings: DataSettings):
        survey_dicts = [row.get_dict() for row in survey_rows]
        well_survey_data, _ = self._get_survey_well_data_dict(survey_dicts, data_settings)
        return is_valid_survey_data(well_survey_data)

    def _get_monthly_date(self, monthly_dict):
        try:
            prod_date = monthly_dict.get('date')
            if self._has_value(prod_date):
                try:
                    return parse_date(prod_date)
                except Exception:
                    return None

            year = monthly_dict.get('year')
            month = monthly_dict.get('month')
            if self._has_value(year) and self._has_value(month):
                return date(int(year), get_month(month), 1)

        except (ValueError, OverflowError):
            pass

        return None

    def _get_valid_monthly_date(self, date_):
        if date_ is None:
            return None
        return date(date_.year, date_.month, 15)

    def _get_monthly_limit_dates(self, rows: Iterable[WellDataRow]):
        monthly_dicts = (row.get_dict() for row in rows)
        dates_with_data = (self._get_monthly_date(d) for d in monthly_dicts if len(self._get_monthly_data(d)) > 0)
        valid_dates = [self._get_valid_monthly_date(d) for d in dates_with_data if d is not None]
        return (min(valid_dates, default=None), max(valid_dates, default=None))

    def _get_monthly_data(self, monthly_dict):
        monthly_production_fields = self.context.monthly_production_model._fields
        prod_values = ((prod_type,
                        self._parse_prod_value(monthly_production_fields[prod_type], monthly_dict.get(prod_type)))
                       for prod_type in MONTHLY_PROD_FIELDS)
        return {prod_type: value for (prod_type, value) in prod_values if self._has_value(value)}

    def _get_data(self, data_dict, monthly=True):
        production_fields = (self.context.monthly_production_model._fields
                             if monthly else self.context.daily_production_model._fields)
        prod_fields = MONTHLY_PROD_FIELDS if monthly else DAILY_PROD_FIELDS
        prod_values = ((prod_type, self._parse_prod_value(production_fields[prod_type], data_dict.get(prod_type)))
                       for prod_type in prod_fields)

        return {
            DAL_FIELD_NAME_MAP.get(prod_type, prod_type): value
            for (prod_type, value) in prod_values if self._has_value(value)
        }

    def _get_prod_update_data(self, prod_dict, well_ids_dict, monthly=True, id='chosenID'):
        def get_prod_date(prod_dict):
            prod_date = None
            if monthly:
                prod_date = self._get_monthly_date(prod_dict)
                prod_date = prod_date.replace(day=15)
            else:
                prod_date = self._get_daily_date(prod_dict)

            return prod_date

        # get key (well id and start index)
        id_value = clean_id(prod_dict.get(id))
        well_ids = well_ids_dict.get(id_value)

        prod_date = get_prod_date(prod_dict)

        if prod_date is None:
            return []

        # get production data to insert
        data = self._get_data(prod_dict, monthly)

        return ({'date': prod_date, 'well': well, 'data': data} for well in well_ids)

    def _get_daily_date(self, daily_dict):
        try:
            prod_date = daily_dict.get('date')
            if self._has_value(prod_date):
                return parse_date(prod_date)

            year = daily_dict.get('year')
            month = daily_dict.get('month')
            day = daily_dict.get('day')
            if self._has_value(year) and self._has_value(month) and self._has_value(day):
                return date(int(year), get_month(month), int(day))

        except (ValueError, OverflowError):
            pass

        return None

    def _get_daily_limit_dates(self, rows: Iterable[WellDataRow]):
        daily_dicts = (row.get_dict() for row in rows)
        dates_with_data = (self._get_daily_date(d) for d in daily_dicts if len(self._get_daily_data(d)) > 0)
        valid_dates = [d for d in dates_with_data if d is not None]
        return (min(valid_dates, default=None), max(valid_dates, default=None))

    def _get_daily_data(self, daily_dict):
        daily_production_fields = self.context.daily_production_model._fields
        prod_values = ((prod_type, self._parse_prod_value(daily_production_fields[prod_type],
                                                          daily_dict.get(prod_type)))
                       for prod_type in DAILY_PROD_FIELDS)
        return {prod_type: value for (prod_type, value) in prod_values if self._has_value(value)}

    def _group_by_well_id(self, survey_row_dicts: Iterable[Mapping[str, Any]], id='chosenID'):
        grouped: defaultdict[Any, list[Mapping[str, Any]]] = defaultdict(list)
        for row_dict in survey_row_dicts:
            id_value = clean_id(row_dict.get(id))
            grouped[id_value].append(row_dict)

        return grouped

    def _get_survey_well_data_dict(self, well_survey_row_dicts: Collection[Mapping[str, Any]],
                                   data_settings: DataSettings):
        valid_rows = 0

        rows_data = (self._get_survey_row_data(row_dict, data_settings) for row_dict in well_survey_row_dicts)
        valid_row_data = (data for data in rows_data if data)
        increasing_row_data = first_increasing_sequence(valid_row_data,
                                                        key=lambda r: r.get(SURVEY_MEASURED_DEPTH_FIELD, 0) or 0)

        well_data = defaultdict(list)
        for row_data in increasing_row_data:
            valid_rows += 1
            for (field, value) in row_data.items():
                well_data[field].append(value)

        return well_data, valid_rows

    def _get_survey_well_data(self, well_survey_row_dicts: Collection[Mapping[str, Any]],
                              surface_location: Optional[tuple[float, float]], data_settings: DataSettings):
        well_data, valid_rows = self._get_survey_well_data_dict(well_survey_row_dicts, data_settings)

        try:
            well_data = get_missing_columns(well_data, surface_location)
        except ValueError as e:
            return None, {'total_rows': len(well_survey_row_dicts), 'valid_rows': 0, 'errors': [get_exception_info(e)]}

        return well_data, {'total_rows': len(well_survey_row_dicts), 'valid_rows': valid_rows, 'errors': []}

    def _get_survey_row_data(self, survey_dict: Mapping[str, Any], data_settings: DataSettings):
        survey_fields = self.context.well_directional_survey_model._fields
        survey_values = ((field, self._parse_survey_value(survey_fields[field], survey_dict.get(field)))
                         for field in SURVEY_FIELDS)
        res = {field: value if self._has_value(value) else None for (field, value) in survey_values}

        latitude = res.get(SURVEY_LATITUDE_FIELD)
        longitude = res.get(SURVEY_LONGITUDE_FIELD)
        if ImportService._valid_coordinates(latitude, longitude):
            res[SURVEY_LATITUDE_FIELD], res[SURVEY_LONGITUDE_FIELD] = transform_to_wgs84(
                latitude, longitude, data_settings.coordinate_reference_system)

        return res if any((v is not None for v in res.values())) else None

    def _get_survey_doc(self, well, data, project):
        now = datetime.utcnow()
        return self.context.well_directional_survey_model(well=well,
                                                          project=project,
                                                          createdAt=now,
                                                          updatedAt=now,
                                                          **data)

    @staticmethod
    def _mongoengine_field(field):
        return field if field != '_id' else 'id'

    @staticmethod
    def _doc_to_dict(doc, model):
        return doc.to_mongo().to_dict() if isinstance(doc, model) else doc

    @staticmethod
    def _has_value(value):
        if value is None:
            return False
        if isinstance(value, str):
            return value != '' and value.lower() != 'null'
        return True

    @staticmethod
    def _get_field_value(field, value):
        if isinstance(field, (IntField, FloatField)):
            return parse_float(value)
        return value

    @staticmethod
    def _parse_prod_value(field, value):
        if not isinstance(field, (ComplexBaseField)):
            return ImportService._get_field_value(field, value)

        base_field = field.field
        if isinstance(base_field, (IntField, CustomFloatField)):
            num_value = parse_float(value, -1)
            return num_value if num_value >= 0 else None
        return value

    @staticmethod
    def _parse_survey_value(field, value):
        if not isinstance(field, (ComplexBaseField)):
            return ImportService._get_field_value(field, value)

        base_field = field.field
        if isinstance(base_field, (CustomFloatField)):
            return parse_float(value)

        return value

    @staticmethod
    def _valid_coordinates(latitude, longitude):
        return longitude is not None and -180 <= longitude < 180 \
            and latitude is not None and -90 <= latitude < 90

    @staticmethod
    def get_coordinates(headers_dict, data_settings: DataSettings):
        coordinates = {}

        longitude = parse_float(headers_dict.get('surfaceLongitude'))
        latitude = parse_float(headers_dict.get('surfaceLatitude'))
        if ImportService._valid_coordinates(latitude, longitude):
            latitude, longitude = transform_to_wgs84(latitude, longitude, data_settings.coordinate_reference_system)
            coordinates['surfaceLatitude'] = latitude
            coordinates['surfaceLongitude'] = longitude
            coordinates['location'] = {'type': 'Point', 'coordinates': [longitude, latitude]}
            coordinates['geohash'] = geohash.encode(latitude, longitude)

        toe_longitude = parse_float(headers_dict.get('toeLongitude'))
        toe_latitude = parse_float(headers_dict.get('toeLatitude'))
        if ImportService._valid_coordinates(toe_latitude, toe_longitude):
            toe_latitude, toe_longitude = transform_to_wgs84(toe_latitude, toe_longitude,
                                                             data_settings.coordinate_reference_system)
            coordinates['toeLatitude'] = toe_latitude
            coordinates['toeLongitude'] = toe_longitude
            coordinates['toeLocation'] = {'type': 'Point', 'coordinates': [toe_longitude, toe_latitude]}

        heel_longitude = parse_float(headers_dict.get('heelLongitude'))
        heel_latitude = parse_float(headers_dict.get('heelLatitude'))
        if ImportService._valid_coordinates(heel_latitude, heel_longitude):
            heel_latitude, heel_longitude = transform_to_wgs84(heel_latitude, heel_longitude,
                                                               data_settings.coordinate_reference_system)
            coordinates['heelLatitude'] = heel_latitude
            coordinates['heelLongitude'] = heel_longitude
            coordinates['heelLocation'] = {'type': 'Point', 'coordinates': [heel_longitude, heel_latitude]}

        return coordinates
