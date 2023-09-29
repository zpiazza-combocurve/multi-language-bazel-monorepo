from typing import TYPE_CHECKING
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO, StringIO, TextIOWrapper
from datetime import datetime
from zipfile import ZipFile
import json
from time import sleep

from bson import ObjectId
from shapefile import Reader as ShapefileReader, Writer as ShapefileWriter
from pyproj import CRS, Transformer
from pyproj.enums import WktVersion

from combocurve.utils.constants import USER_NOTIFICATION_UPDATE_EVENT_NAME
from combocurve.shared.progress_notifier import PusherChannel, ProgressNotifier
from combocurve.shared.serialization import make_serializable
from combocurve.utils.with_error_notification_decorator import with_error_notification
from .utils import (GEOJSON_TO_SHAPEFILE_TYPES, MAPBOX_STATUS_CHECK_DELAY, MAPBOX_UPLOAD_CHECK_RETRIES,
                    MAPBOX_UPLOAD_RETRIES, MAPBOX_UPLOAD_RETRY_DELAY, UPLOAD_PROCESSING_SHAPES_FRACTION,
                    EXPORT_READING_SHAPES_FRACTION, STD_TO_SHP_FIELD_TYPES, WGS84_CRS, MissingShapefileError,
                    InvalidShapefileError, MapboxUploadError, find_shapefile_files, fix_feature_invalid_polygon,
                    get_all_properties, get_base_shape_type, get_bbox, get_field_dict, is_valid_shape_record,
                    transform_feature_coordinates, get_valid_fields, get_valid_record, with_retry)

if TYPE_CHECKING:
    from context import Context

_UPLOAD_NOTIFICATION_TYPE = 'upload-shapefile'
_EXPORT_NOTIFICATION_TYPE = 'map-layer-export'


class ShapefileService:
    def __init__(self, context: 'Context'):
        self.context = context
        self.shapefiles_bucket = str(self.context.google_services.storage_bucket.name)
        self.base_file_name = 'shapefiles'

    def get_shapefile(self, shapefile_id: str):
        shapefile = self.context.shapefiles_collection.find_one({'_id': ObjectId(shapefile_id)})
        if not shapefile:
            raise MissingShapefileError()
        return shapefile

    def create_shapefile(self, shapefile_data):
        count = self.context.shapefiles_collection.estimated_document_count()
        result = self.context.shapefiles_collection.insert_one({
            **shapefile_data,
            'position': count,
            'active': True,
        })
        return result.inserted_id

    def _get_shape(self, shapefile: dict, index: int) -> str:
        file_name = f'{shapefile["gcpFolder"]}/{index}'
        return self.context.storage_service.read_as_string(self.shapefiles_bucket, file_name)

    def get_shape(self, shapefile_id: str, index: int) -> str:
        shapefile = self.get_shapefile(shapefile_id)
        return self._get_shape(shapefile, index)

    def export(self, shapefile_id: str, format: str, file_name: str, user_id: str):
        shapefile = self.get_shapefile(shapefile_id)

        notification = make_serializable(self._create_export_notification(shapefile, format, file_name, user_id))

        @with_error_notification(self.context.notification_service, notification['_id'])
        def _export_shapefile():
            return self._export(shapefile, format, file_name, user_id, notification['_id'])

        created_file = _export_shapefile()

        self._notify_export_complete(shapefile, created_file, notification['_id'])

    def upload(self, file_id: str, name: str, description: str, color: str, project_ids: list[str], scope: str,
               tileset: str, user_id: str):
        notification = make_serializable(
            self._create_upload_notification(name, description, color, project_ids, scope, tileset, user_id,
                                             'Upload Shapefile', f'Uploading shapefile {name}...'))

        file_doc = self.context.file_service.get_file(file_id)
        file_data = self.context.file_service.download_to_memory(file_doc.gcpName)

        @with_error_notification(self.context.notification_service, notification['_id'])
        def process_shapes(shapefile_zip: BytesIO):
            return self._process_shapes(shapefile_zip, notification['_id'], user_id)

        @with_error_notification(self.context.notification_service, notification['_id'])
        def upload_to_mapbox(data: BytesIO):
            return self._upload_to_mapbox(data, name, tileset)

        with ThreadPoolExecutor() as executor:
            metadata = executor.submit(process_shapes, BytesIO(file_data.getvalue()))
            mapbox_id = executor.submit(upload_to_mapbox, BytesIO(file_data.getvalue()))

        self._notify_upload_progress(95, user_id, notification['_id'])

        shapefile_id = self.create_shapefile({
            'file': ObjectId(file_id),
            'name': name,
            'description': description,
            'color': color,
            'projectIds': project_ids,
            'visibility': [scope],
            'idShapefile': mapbox_id.result(),
            **metadata.result(),
        })

        self._notify_upload_complete(str(shapefile_id), notification['_id'], f'Shapefile {name} successfully uploaded.')

    def upload_geojson(self, features: list[dict], name: str, description: str, color: str, project_ids: list[str],
                       scope: str, tileset: str, user_id: str):
        notification = make_serializable(
            self._create_upload_notification(name, description, color, project_ids, scope, tileset, user_id,
                                             'Create Map Layer', f'Creating layer {name}...'))

        data = BytesIO('\n'.join((json.dumps(f) for f in features)).encode())

        @with_error_notification(self.context.notification_service, notification['_id'])
        def process_geojson():
            return self._process_geojson(name, features, notification['_id'], user_id)

        @with_error_notification(self.context.notification_service, notification['_id'])
        def upload_to_mts():
            return self._upload_to_mts(data, name, tileset)

        with ThreadPoolExecutor() as executor:
            metadata = executor.submit(process_geojson)
            mapbox_id = executor.submit(upload_to_mts)

        self._notify_upload_progress(95, user_id, notification['_id'])

        shapefile_id = self.create_shapefile({
            'name': name,
            'description': description,
            'color': color,
            'projectIds': project_ids,
            'visibility': [scope],
            'idShapefile': mapbox_id.result(),
            **metadata.result(),
        })

        self._notify_upload_complete(str(shapefile_id), notification['_id'], f'Map layer {name} successfully created.')

    def _export(self, shapefile: dict, format: str, file_name: str, user_id: str, notification_id: str):
        shapes_count = shapefile.get('shapesCount')
        if shapes_count is None:
            raise InvalidShapefileError('exported')

        shapes_data = (self._get_shape(shapefile, i) for i in range(shapes_count))
        shapes_dicts = (json.loads(s) for s in shapes_data)

        progress_notifier = ProgressNotifier(self.context.pusher, notification_id, self.context.subdomain, user_id,
                                             PusherChannel.USER)
        progress = 0

        def read_shape(shape):
            nonlocal progress
            progress += 100 * EXPORT_READING_SHAPES_FRACTION / shapes_count
            progress_notifier.notify(progress)
            return shape

        with ThreadPoolExecutor(max_workers=10) as executor:
            shapes_list = list(executor.map(read_shape, shapes_dicts))

        export_method = {'shapefile': self._export_as_shapefile, 'geojson': self._export_as_geojson}[format]
        return export_method(shapefile, shapes_list, file_name, user_id)

    def _export_as_shapefile(self, shapefile: dict, shapes: list[dict], file_name: str, user_id: str) -> dict:
        valid_fields = list(get_valid_fields(shapefile.get('fields', []), shapes))

        shp = BytesIO()
        shx = BytesIO()
        dbf = BytesIO() if len(valid_fields) else None
        with ShapefileWriter(shp=shp, shx=shx, dbf=dbf) as writer:
            for field in valid_fields:
                writer.field(field['name'], STD_TO_SHP_FIELD_TYPES[field['fieldType']])
            for s in shapes:
                if dbf:
                    record = get_valid_record(s.get('properties', {}), valid_fields)
                    writer.record(**record)
                writer.shape(s['geometry'])

        prj = StringIO(WGS84_CRS.to_wkt(WktVersion.WKT1_ESRI))

        zip_file = BytesIO()
        with ZipFile(zip_file, 'w') as zip_writer:
            zip_writer.writestr(f'{file_name}.shp', shp.getvalue())
            zip_writer.writestr(f'{file_name}.shx', shx.getvalue())
            if dbf:
                zip_writer.writestr(f'{file_name}.dbf', dbf.getvalue())
            zip_writer.writestr(f'{file_name}.prj', prj.getvalue())

        file_data = {
            'name': f'{file_name}.zip',
            'gcpName': f'{file_name}-{user_id}-{datetime.utcnow().isoformat()}.zip',
            'type': 'application/zip',
        }
        return self.context.file_service.upload_file_from_string(zip_file.getvalue(), file_data, user_id)

    def _export_as_geojson(self, shapefile: dict, shapes: list[dict], file_name: str, user_id: str) -> dict:
        data = {'type': 'FeatureCollection', 'features': list(shapes)}
        file_data = {
            'name': f'{file_name}.geojson',
            'gcpName': f'{file_name}-{user_id}-{datetime.utcnow().isoformat()}.geojson',
            'type': 'application/geo+json',
        }
        return self.context.file_service.upload_file_from_string(json.dumps(data), file_data, user_id)

    def _get_folder_name(self, base_shapefile_name: str):
        timestamp = int(datetime.now().timestamp() * 1000)
        return f'{self.base_file_name}/{base_shapefile_name}-{timestamp}'

    def _create_export_notification(self, shapefile: dict, format: str, file_name: str, user_id: str):
        notification_data = {
            'type': _EXPORT_NOTIFICATION_TYPE,
            'title': 'Export Layer',
            'status': 'pending',
            'description': f'Exporting layer {shapefile["name"]}...',
            'forUser': ObjectId(user_id),
            'createdBy': ObjectId(user_id),
            'extra': {
                'body': {
                    'shapefile_id': str(shapefile['_id']),
                    'format': format,
                    'file_name': file_name,
                    'user_id': user_id,
                },
            }
        }
        return self.context.notification_service.add_notification_with_notifying_target(notification_data)

    def _notify_export_complete(self, shapefile: dict, created_file: dict, notification_id: str):
        file_data = {
            'name': created_file['name'],
            'gcpName': created_file['gcpName'],
            'bSize': created_file.get('bSize'),
            'mbSize': created_file.get('mbSize'),
            'type': created_file.get('type'),
            'createdBy': str(created_file['createdBy']) if 'createdBy' in created_file else None,
            'project': str(created_file['project']) if 'project' in created_file else None,
            'expireAt': str(created_file['expireAt']) if 'expireAt' in created_file else None,
        }
        valid_file_data = {k: v for k, v in file_data.items() if v is not None}
        self.context.notification_service.update_notification_with_notifying_target(
            notification_id, {
                'status': 'complete',
                'description': f'Exported layer {shapefile["name"]}.',
                'extra.output': {
                    'file': valid_file_data
                },
            })

    def _create_upload_notification(self, name: str, description: str, color: str, project_ids: list[str], scope: str,
                                    tileset: str, user_id: str, notification_title: str, notification_description: str):
        notification_data = {
            'type': _UPLOAD_NOTIFICATION_TYPE,
            'title': notification_title,
            'status': 'pending',
            'description': notification_description,
            'forUser': ObjectId(user_id),
            'createdBy': ObjectId(user_id),
            'extra': {
                'body': {
                    'name': name,
                    'description': description,
                    'color': color,
                    'project_ids': project_ids,
                    'scope': scope,
                    'tileset': tileset,
                },
            }
        }
        return self.context.notification_service.add_notification_with_notifying_target(notification_data)

    def _notify_upload_progress(self, progress: float, user_id: str, notification_id: str):
        self.context.pusher.trigger_user_channel(self.context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
            '_id': notification_id,
            'progress': progress,
        })

    def _notify_upload_complete(self, shapefile_id: str, notification_id: str, description: str):
        self.context.notification_service.update_notification_with_notifying_target(notification_id, {
            'status': 'complete',
            'description': description,
            'extra.output': {
                'createdShapefile': {
                    '_id': shapefile_id
                }
            }
        })

    def _upload_shape(self, folder_name: str, index: int, shape_geojson: dict):
        file_name = f'{folder_name}/{index}'
        data = json.dumps(shape_geojson)
        self.context.storage_service.write_from_string(self.shapefiles_bucket, file_name, data, 'application/json')

    def _process_shapes(self, shapefile_zip: BytesIO, notification_id: str, user_id: str):
        with ZipFile(shapefile_zip) as zip_file:
            base_name, shp_name, shx_name, dbf_name, other_names = find_shapefile_files(zip_file.namelist())
            with zip_file.open(shp_name) as shp_file,\
                zip_file.open(shx_name) as shx_file,\
                    zip_file.open(dbf_name) as dbf_file:

                shapefile = ShapefileReader(shp=shp_file, shx=shx_file, dbf=dbf_file)

                transformer = None
                if 'prj' in other_names:
                    with zip_file.open(other_names['prj']) as prj_file:
                        text_file = TextIOWrapper(prj_file)
                        wkt = text_file.read()
                    shp_crs = CRS.from_string(wkt)
                    wgs_crs = WGS84_CRS
                    transformer = Transformer.from_crs(shp_crs, wgs_crs, always_xy=True)

                shape_type = get_base_shape_type(shapefile.shapeTypeName)
                bbox = list(shapefile.bbox)
                shapes_count = len(shapefile)
                fields = [get_field_dict(field) for field in shapefile.fields[1:]]

                folder_name = self._get_folder_name(base_name)
                enumerated_shapes = ((i, shape_rec) for (i, shape_rec) in enumerate(shapefile.iterShapeRecords())
                                     if is_valid_shape_record(shape_rec, shape_type))

                progress_notifier = ProgressNotifier(self.context.pusher, notification_id, self.context.subdomain,
                                                     user_id, PusherChannel.USER)
                progress = 0

                def process_shape(index_shape_tuple):
                    nonlocal progress
                    index, shape_record = index_shape_tuple
                    shape_geojson = shape_record.__geo_interface__
                    shape_geojson = transform_feature_coordinates(shape_geojson, transformer)
                    shape_geojson = fix_feature_invalid_polygon(shape_geojson)
                    self._upload_shape(folder_name, index, shape_geojson)
                    progress += 100 * UPLOAD_PROCESSING_SHAPES_FRACTION / shapes_count
                    progress_notifier.notify(progress)

                with ThreadPoolExecutor(max_workers=10) as executor:
                    list(executor.map(process_shape, enumerated_shapes))

                return {
                    'shapeType': shape_type,
                    'bbox': bbox,
                    'shapesCount': shapes_count,
                    'fields': fields,
                    'gcpFolder': folder_name
                }

    def _process_geojson(self, name: str, features: list[dict], notification_id: str, user_id: str):
        shape_type = GEOJSON_TO_SHAPEFILE_TYPES[features[0]['geometry']['type']]
        bbox = get_bbox(features)
        fields = [{'name': prop} for prop in get_all_properties(features)]

        folder_name = self._get_folder_name(name)

        progress_notifier = ProgressNotifier(self.context.pusher, notification_id, self.context.subdomain, user_id,
                                             PusherChannel.USER)
        progress = 0

        def process_shape(index_feature_tuple: tuple[int, dict]):
            nonlocal progress
            index, feature = index_feature_tuple
            feature = fix_feature_invalid_polygon(feature)
            self._upload_shape(folder_name, index, feature)
            progress += 100 * UPLOAD_PROCESSING_SHAPES_FRACTION / len(features)
            progress_notifier.notify(progress)

        with ThreadPoolExecutor(max_workers=10) as executor:
            list(executor.map(process_shape, enumerate(features)))

        return {
            'shapeType': shape_type,
            'bbox': bbox,
            'shapesCount': len(features),
            'fields': fields,
            'gcpFolder': folder_name
        }

    def _wait_for_mapbox_upload(self, upload_id: str):
        for _ in range(MAPBOX_UPLOAD_CHECK_RETRIES):
            status_resp = self.context.mapbox_uploader.status(upload_id).json()
            if status_resp['complete']:
                return status_resp
            if status_resp.get('error'):
                raise MapboxUploadError(status_resp['error'])
            sleep(MAPBOX_STATUS_CHECK_DELAY)
        raise TimeoutError('Upload to MapBox timed out')

    @with_retry(lambda resp: resp.status_code == 422, MAPBOX_UPLOAD_RETRIES, MAPBOX_UPLOAD_RETRY_DELAY)
    def _mapbox_uploader_upload(self, data: BytesIO, tileset: str, name: str):
        return self.context.mapbox_uploader.upload(data, tileset, name)

    def _upload_to_mapbox(self, data: BytesIO, name: str, tileset: str):
        upload_resp = self._mapbox_uploader_upload(data, tileset, name)
        if upload_resp.status_code != 201:
            raise MapboxUploadError(f'Status code {upload_resp.status_code}')
        upload_id = upload_resp.json()['id']

        status_resp = self._wait_for_mapbox_upload(upload_id)
        return status_resp['tileset']

    def _upload_to_mts(self, data: BytesIO, name: str, tileset: str):
        return self.context.mapbox_tile_service_uploader.upload(data, name, tileset)
