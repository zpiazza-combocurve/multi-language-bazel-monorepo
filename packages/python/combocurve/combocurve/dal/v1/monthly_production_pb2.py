# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: combocurve/dal/v1/monthly_production.proto
"""Generated protocol buffer code."""
from google.protobuf.internal import builder as _builder
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from google.protobuf import field_mask_pb2 as google_dot_protobuf_dot_field__mask__pb2
from google.protobuf import timestamp_pb2 as google_dot_protobuf_dot_timestamp__pb2
from combocurve.common.v1 import date_range_pb2 as combocurve_dot_common_dot_v1_dot_date__range__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n*combocurve/dal/v1/monthly_production.proto\x12\x11\x63ombocurve.dal.v1\x1a google/protobuf/field_mask.proto\x1a\x1fgoogle/protobuf/timestamp.proto\x1a%combocurve/common/v1/date_range.proto\"\xc9\x06\n%MonthlyProductionServiceUpsertRequest\x12.\n\nfield_mask\x18\x01 \x01(\x0b\x32\x1a.google.protobuf.FieldMask\x12\x0c\n\x04well\x18\x02 \x01(\t\x12(\n\x04\x64\x61te\x18\x03 \x01(\x0b\x32\x1a.google.protobuf.Timestamp\x12\x14\n\x07project\x18\x04 \x01(\tH\x00\x88\x01\x01\x12\x12\n\x05\x63hoke\x18\x05 \x01(\x01H\x01\x88\x01\x01\x12\x1a\n\rco2_injection\x18\x06 \x01(\x01H\x02\x88\x01\x01\x12\x14\n\x07\x64\x61ys_on\x18\x07 \x01(\x01H\x03\x88\x01\x01\x12\x10\n\x03gas\x18\x08 \x01(\x01H\x04\x88\x01\x01\x12\x1a\n\rgas_injection\x18\t \x01(\x01H\x05\x88\x01\x01\x12\x10\n\x03ngl\x18\n \x01(\x01H\x06\x88\x01\x01\x12\x10\n\x03oil\x18\x0b \x01(\x01H\x07\x88\x01\x01\x12\x1c\n\x0fsteam_injection\x18\x0c \x01(\x01H\x08\x88\x01\x01\x12\x12\n\x05water\x18\r \x01(\x01H\t\x88\x01\x01\x12\x1c\n\x0fwater_injection\x18\x0e \x01(\x01H\n\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_0\x18\x0f \x01(\x01H\x0b\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_1\x18\x10 \x01(\x01H\x0c\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_2\x18\x11 \x01(\x01H\r\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_3\x18\x12 \x01(\x01H\x0e\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_4\x18\x13 \x01(\x01H\x0f\x88\x01\x01\x12\x1c\n\x0foperational_tag\x18\x14 \x01(\tH\x10\x88\x01\x01\x42\n\n\x08_projectB\x08\n\x06_chokeB\x10\n\x0e_co2_injectionB\n\n\x08_days_onB\x06\n\x04_gasB\x10\n\x0e_gas_injectionB\x06\n\x04_nglB\x06\n\x04_oilB\x12\n\x10_steam_injectionB\x08\n\x06_waterB\x12\n\x10_water_injectionB\x12\n\x10_custom_number_0B\x12\n\x10_custom_number_1B\x12\n\x10_custom_number_2B\x12\n\x10_custom_number_3B\x12\n\x10_custom_number_4B\x12\n\x10_operational_tag\"(\n&MonthlyProductionServiceUpsertResponse\"D\n3MonthlyProductionServiceChangeToCompanyScopeRequest\x12\r\n\x05wells\x18\x01 \x03(\t\"6\n4MonthlyProductionServiceChangeToCompanyScopeResponse\"\xd4\x01\n$MonthlyProductionServiceFetchRequest\x12.\n\nfield_mask\x18\x01 \x01(\x0b\x32\x1a.google.protobuf.FieldMask\x12\r\n\x05wells\x18\x02 \x03(\t\x12\x33\n\ndate_range\x18\x03 \x01(\x0b\x32\x1f.combocurve.common.v1.DateRange\x12 \n\x13only_physical_wells\x18\x04 \x01(\x08H\x00\x88\x01\x01\x42\x16\n\x14_only_physical_wells\"\x99\x06\n%MonthlyProductionServiceFetchResponse\x12(\n\x04\x64\x61te\x18\x13 \x01(\x0b\x32\x1a.google.protobuf.Timestamp\x12\x0c\n\x04well\x18\x01 \x01(\t\x12\x14\n\x07project\x18\x02 \x01(\tH\x00\x88\x01\x01\x12\x12\n\x05\x63hoke\x18\x03 \x01(\x01H\x01\x88\x01\x01\x12\x1a\n\rco2_injection\x18\x04 \x01(\x01H\x02\x88\x01\x01\x12\x14\n\x07\x64\x61ys_on\x18\x05 \x01(\x01H\x03\x88\x01\x01\x12\x10\n\x03gas\x18\x06 \x01(\x01H\x04\x88\x01\x01\x12\x1a\n\rgas_injection\x18\x07 \x01(\x01H\x05\x88\x01\x01\x12\x10\n\x03ngl\x18\x08 \x01(\x01H\x06\x88\x01\x01\x12\x10\n\x03oil\x18\t \x01(\x01H\x07\x88\x01\x01\x12\x1c\n\x0fsteam_injection\x18\n \x01(\x01H\x08\x88\x01\x01\x12\x12\n\x05water\x18\x0b \x01(\x01H\t\x88\x01\x01\x12\x1c\n\x0fwater_injection\x18\x0c \x01(\x01H\n\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_0\x18\r \x01(\x01H\x0b\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_1\x18\x0e \x01(\x01H\x0c\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_2\x18\x0f \x01(\x01H\r\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_3\x18\x10 \x01(\x01H\x0e\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_4\x18\x11 \x01(\x01H\x0f\x88\x01\x01\x12\x1c\n\x0foperational_tag\x18\x12 \x01(\tH\x10\x88\x01\x01\x42\n\n\x08_projectB\x08\n\x06_chokeB\x10\n\x0e_co2_injectionB\n\n\x08_days_onB\x06\n\x04_gasB\x10\n\x0e_gas_injectionB\x06\n\x04_nglB\x06\n\x04_oilB\x12\n\x10_steam_injectionB\x08\n\x06_waterB\x12\n\x10_water_injectionB\x12\n\x10_custom_number_0B\x12\n\x10_custom_number_1B\x12\n\x10_custom_number_2B\x12\n\x10_custom_number_3B\x12\n\x10_custom_number_4B\x12\n\x10_operational_tag\"\xda\x01\n*MonthlyProductionServiceFetchByWellRequest\x12.\n\nfield_mask\x18\x01 \x01(\x0b\x32\x1a.google.protobuf.FieldMask\x12\r\n\x05wells\x18\x02 \x03(\t\x12\x33\n\ndate_range\x18\x03 \x01(\x0b\x32\x1f.combocurve.common.v1.DateRange\x12 \n\x13only_physical_wells\x18\x04 \x01(\x08H\x00\x88\x01\x01\x42\x16\n\x14_only_physical_wells\"\xba\x03\n+MonthlyProductionServiceFetchByWellResponse\x12(\n\x04\x64\x61te\x18\x12 \x03(\x0b\x32\x1a.google.protobuf.Timestamp\x12\x0c\n\x04well\x18\x01 \x01(\t\x12\x14\n\x07project\x18\x02 \x01(\tH\x00\x88\x01\x01\x12\r\n\x05\x63hoke\x18\x03 \x03(\x01\x12\x15\n\rco2_injection\x18\x04 \x03(\x01\x12\x0f\n\x07\x64\x61ys_on\x18\x05 \x03(\x01\x12\x0b\n\x03gas\x18\x06 \x03(\x01\x12\x15\n\rgas_injection\x18\x07 \x03(\x01\x12\x0b\n\x03ngl\x18\x08 \x03(\x01\x12\x0b\n\x03oil\x18\t \x03(\x01\x12\x17\n\x0fsteam_injection\x18\n \x03(\x01\x12\r\n\x05water\x18\x0b \x03(\x01\x12\x17\n\x0fwater_injection\x18\x0c \x03(\x01\x12\x17\n\x0f\x63ustom_number_0\x18\r \x03(\x01\x12\x17\n\x0f\x63ustom_number_1\x18\x0e \x03(\x01\x12\x17\n\x0f\x63ustom_number_2\x18\x0f \x03(\x01\x12\x17\n\x0f\x63ustom_number_3\x18\x10 \x03(\x01\x12\x17\n\x0f\x63ustom_number_4\x18\x11 \x03(\x01\x42\n\n\x08_project\"\xd8\x01\n(MonthlyProductionServiceSumByWellRequest\x12.\n\nfield_mask\x18\x01 \x01(\x0b\x32\x1a.google.protobuf.FieldMask\x12\r\n\x05wells\x18\x02 \x03(\t\x12\x33\n\ndate_range\x18\x03 \x01(\x0b\x32\x1f.combocurve.common.v1.DateRange\x12 \n\x13only_physical_wells\x18\x04 \x01(\x08H\x00\x88\x01\x01\x42\x16\n\x14_only_physical_wells\"\xc1\x05\n)MonthlyProductionServiceSumByWellResponse\x12\x0c\n\x04well\x18\x01 \x01(\t\x12\x14\n\x07project\x18\x02 \x01(\tH\x00\x88\x01\x01\x12\x12\n\x05\x63hoke\x18\x03 \x01(\x01H\x01\x88\x01\x01\x12\x1a\n\rco2_injection\x18\x04 \x01(\x01H\x02\x88\x01\x01\x12\x14\n\x07\x64\x61ys_on\x18\x05 \x01(\x01H\x03\x88\x01\x01\x12\x10\n\x03gas\x18\x06 \x01(\x01H\x04\x88\x01\x01\x12\x1a\n\rgas_injection\x18\x07 \x01(\x01H\x05\x88\x01\x01\x12\x10\n\x03ngl\x18\x08 \x01(\x01H\x06\x88\x01\x01\x12\x10\n\x03oil\x18\t \x01(\x01H\x07\x88\x01\x01\x12\x1c\n\x0fsteam_injection\x18\n \x01(\x01H\x08\x88\x01\x01\x12\x12\n\x05water\x18\x0b \x01(\x01H\t\x88\x01\x01\x12\x1c\n\x0fwater_injection\x18\x0c \x01(\x01H\n\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_0\x18\r \x01(\x01H\x0b\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_1\x18\x0e \x01(\x01H\x0c\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_2\x18\x0f \x01(\x01H\r\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_3\x18\x10 \x01(\x01H\x0e\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_4\x18\x11 \x01(\x01H\x0f\x88\x01\x01\x42\n\n\x08_projectB\x08\n\x06_chokeB\x10\n\x0e_co2_injectionB\n\n\x08_days_onB\x06\n\x04_gasB\x10\n\x0e_gas_injectionB\x06\n\x04_nglB\x06\n\x04_oilB\x12\n\x10_steam_injectionB\x08\n\x06_waterB\x12\n\x10_water_injectionB\x12\n\x10_custom_number_0B\x12\n\x10_custom_number_1B\x12\n\x10_custom_number_2B\x12\n\x10_custom_number_3B\x12\n\x10_custom_number_4\"\xda\x01\n*MonthlyProductionServiceCountByWellRequest\x12.\n\nfield_mask\x18\x01 \x01(\x0b\x32\x1a.google.protobuf.FieldMask\x12\r\n\x05wells\x18\x02 \x03(\t\x12\x33\n\ndate_range\x18\x03 \x01(\x0b\x32\x1f.combocurve.common.v1.DateRange\x12 \n\x13only_physical_wells\x18\x04 \x01(\x08H\x00\x88\x01\x01\x42\x16\n\x14_only_physical_wells\"\xc3\x05\n+MonthlyProductionServiceCountByWellResponse\x12\x0c\n\x04well\x18\x01 \x01(\t\x12\x14\n\x07project\x18\x02 \x01(\tH\x00\x88\x01\x01\x12\x12\n\x05\x63hoke\x18\x03 \x01(\x01H\x01\x88\x01\x01\x12\x1a\n\rco2_injection\x18\x04 \x01(\x01H\x02\x88\x01\x01\x12\x14\n\x07\x64\x61ys_on\x18\x05 \x01(\x01H\x03\x88\x01\x01\x12\x10\n\x03gas\x18\x06 \x01(\x01H\x04\x88\x01\x01\x12\x1a\n\rgas_injection\x18\x07 \x01(\x01H\x05\x88\x01\x01\x12\x10\n\x03ngl\x18\x08 \x01(\x01H\x06\x88\x01\x01\x12\x10\n\x03oil\x18\t \x01(\x01H\x07\x88\x01\x01\x12\x1c\n\x0fsteam_injection\x18\n \x01(\x01H\x08\x88\x01\x01\x12\x12\n\x05water\x18\x0b \x01(\x01H\t\x88\x01\x01\x12\x1c\n\x0fwater_injection\x18\x0c \x01(\x01H\n\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_0\x18\r \x01(\x01H\x0b\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_1\x18\x0e \x01(\x01H\x0c\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_2\x18\x0f \x01(\x01H\r\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_3\x18\x10 \x01(\x01H\x0e\x88\x01\x01\x12\x1c\n\x0f\x63ustom_number_4\x18\x11 \x01(\x01H\x0f\x88\x01\x01\x42\n\n\x08_projectB\x08\n\x06_chokeB\x10\n\x0e_co2_injectionB\n\n\x08_days_onB\x06\n\x04_gasB\x10\n\x0e_gas_injectionB\x06\n\x04_nglB\x06\n\x04_oilB\x12\n\x10_steam_injectionB\x08\n\x06_waterB\x12\n\x10_water_injectionB\x12\n\x10_custom_number_0B\x12\n\x10_custom_number_1B\x12\n\x10_custom_number_2B\x12\n\x10_custom_number_3B\x12\n\x10_custom_number_4\"A\n.MonthlyProductionServiceDeleteByProjectRequest\x12\x0f\n\x07project\x18\x01 \x01(\t\"1\n/MonthlyProductionServiceDeleteByProjectResponse\"p\n+MonthlyProductionServiceDeleteByWellRequest\x12\x0c\n\x04well\x18\x01 \x01(\t\x12\x33\n\ndate_range\x18\x02 \x01(\x0b\x32\x1f.combocurve.common.v1.DateRange\".\n,MonthlyProductionServiceDeleteByWellResponse\"A\n0MonthlyProductionServiceDeleteByManyWellsRequest\x12\r\n\x05wells\x18\x01 \x03(\t\"3\n1MonthlyProductionServiceDeleteByManyWellsResponse2\xd1\n\n\x18MonthlyProductionService\x12\x81\x01\n\x06Upsert\x12\x38.combocurve.dal.v1.MonthlyProductionServiceUpsertRequest\x1a\x39.combocurve.dal.v1.MonthlyProductionServiceUpsertResponse\"\x00(\x01\x12\xa9\x01\n\x14\x43hangeToCompanyScope\x12\x46.combocurve.dal.v1.MonthlyProductionServiceChangeToCompanyScopeRequest\x1aG.combocurve.dal.v1.MonthlyProductionServiceChangeToCompanyScopeResponse\"\x00\x12~\n\x05\x46\x65tch\x12\x37.combocurve.dal.v1.MonthlyProductionServiceFetchRequest\x1a\x38.combocurve.dal.v1.MonthlyProductionServiceFetchResponse\"\x00\x30\x01\x12\x90\x01\n\x0b\x46\x65tchByWell\x12=.combocurve.dal.v1.MonthlyProductionServiceFetchByWellRequest\x1a>.combocurve.dal.v1.MonthlyProductionServiceFetchByWellResponse\"\x00\x30\x01\x12\x8a\x01\n\tSumByWell\x12;.combocurve.dal.v1.MonthlyProductionServiceSumByWellRequest\x1a<.combocurve.dal.v1.MonthlyProductionServiceSumByWellResponse\"\x00\x30\x01\x12\x90\x01\n\x0b\x43ountByWell\x12=.combocurve.dal.v1.MonthlyProductionServiceCountByWellRequest\x1a>.combocurve.dal.v1.MonthlyProductionServiceCountByWellResponse\"\x00\x30\x01\x12\x9a\x01\n\x0f\x44\x65leteByProject\x12\x41.combocurve.dal.v1.MonthlyProductionServiceDeleteByProjectRequest\x1a\x42.combocurve.dal.v1.MonthlyProductionServiceDeleteByProjectResponse\"\x00\x12\x91\x01\n\x0c\x44\x65leteByWell\x12>.combocurve.dal.v1.MonthlyProductionServiceDeleteByWellRequest\x1a?.combocurve.dal.v1.MonthlyProductionServiceDeleteByWellResponse\"\x00\x12\xa0\x01\n\x11\x44\x65leteByManyWells\x12\x43.combocurve.dal.v1.MonthlyProductionServiceDeleteByManyWellsRequest\x1a\x44.combocurve.dal.v1.MonthlyProductionServiceDeleteByManyWellsResponse\"\x00\x62\x06proto3')

_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, globals())
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'combocurve.dal.v1.monthly_production_pb2', globals())
if _descriptor._USE_C_DESCRIPTORS == False:

  DESCRIPTOR._options = None
  _MONTHLYPRODUCTIONSERVICEUPSERTREQUEST._serialized_start=172
  _MONTHLYPRODUCTIONSERVICEUPSERTREQUEST._serialized_end=1013
  _MONTHLYPRODUCTIONSERVICEUPSERTRESPONSE._serialized_start=1015
  _MONTHLYPRODUCTIONSERVICEUPSERTRESPONSE._serialized_end=1055
  _MONTHLYPRODUCTIONSERVICECHANGETOCOMPANYSCOPEREQUEST._serialized_start=1057
  _MONTHLYPRODUCTIONSERVICECHANGETOCOMPANYSCOPEREQUEST._serialized_end=1125
  _MONTHLYPRODUCTIONSERVICECHANGETOCOMPANYSCOPERESPONSE._serialized_start=1127
  _MONTHLYPRODUCTIONSERVICECHANGETOCOMPANYSCOPERESPONSE._serialized_end=1181
  _MONTHLYPRODUCTIONSERVICEFETCHREQUEST._serialized_start=1184
  _MONTHLYPRODUCTIONSERVICEFETCHREQUEST._serialized_end=1396
  _MONTHLYPRODUCTIONSERVICEFETCHRESPONSE._serialized_start=1399
  _MONTHLYPRODUCTIONSERVICEFETCHRESPONSE._serialized_end=2192
  _MONTHLYPRODUCTIONSERVICEFETCHBYWELLREQUEST._serialized_start=2195
  _MONTHLYPRODUCTIONSERVICEFETCHBYWELLREQUEST._serialized_end=2413
  _MONTHLYPRODUCTIONSERVICEFETCHBYWELLRESPONSE._serialized_start=2416
  _MONTHLYPRODUCTIONSERVICEFETCHBYWELLRESPONSE._serialized_end=2858
  _MONTHLYPRODUCTIONSERVICESUMBYWELLREQUEST._serialized_start=2861
  _MONTHLYPRODUCTIONSERVICESUMBYWELLREQUEST._serialized_end=3077
  _MONTHLYPRODUCTIONSERVICESUMBYWELLRESPONSE._serialized_start=3080
  _MONTHLYPRODUCTIONSERVICESUMBYWELLRESPONSE._serialized_end=3785
  _MONTHLYPRODUCTIONSERVICECOUNTBYWELLREQUEST._serialized_start=3788
  _MONTHLYPRODUCTIONSERVICECOUNTBYWELLREQUEST._serialized_end=4006
  _MONTHLYPRODUCTIONSERVICECOUNTBYWELLRESPONSE._serialized_start=4009
  _MONTHLYPRODUCTIONSERVICECOUNTBYWELLRESPONSE._serialized_end=4716
  _MONTHLYPRODUCTIONSERVICEDELETEBYPROJECTREQUEST._serialized_start=4718
  _MONTHLYPRODUCTIONSERVICEDELETEBYPROJECTREQUEST._serialized_end=4783
  _MONTHLYPRODUCTIONSERVICEDELETEBYPROJECTRESPONSE._serialized_start=4785
  _MONTHLYPRODUCTIONSERVICEDELETEBYPROJECTRESPONSE._serialized_end=4834
  _MONTHLYPRODUCTIONSERVICEDELETEBYWELLREQUEST._serialized_start=4836
  _MONTHLYPRODUCTIONSERVICEDELETEBYWELLREQUEST._serialized_end=4948
  _MONTHLYPRODUCTIONSERVICEDELETEBYWELLRESPONSE._serialized_start=4950
  _MONTHLYPRODUCTIONSERVICEDELETEBYWELLRESPONSE._serialized_end=4996
  _MONTHLYPRODUCTIONSERVICEDELETEBYMANYWELLSREQUEST._serialized_start=4998
  _MONTHLYPRODUCTIONSERVICEDELETEBYMANYWELLSREQUEST._serialized_end=5063
  _MONTHLYPRODUCTIONSERVICEDELETEBYMANYWELLSRESPONSE._serialized_start=5065
  _MONTHLYPRODUCTIONSERVICEDELETEBYMANYWELLSRESPONSE._serialized_end=5116
  _MONTHLYPRODUCTIONSERVICE._serialized_start=5119
  _MONTHLYPRODUCTIONSERVICE._serialized_end=6480
# @@protoc_insertion_point(module_scope)
