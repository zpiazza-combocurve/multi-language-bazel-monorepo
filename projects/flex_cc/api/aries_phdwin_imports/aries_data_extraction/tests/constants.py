import numpy as np
import pandas as pd

AC_ECONOMIC_TABLE = {
    'PROPNUM': {
        0: 'KCAKOBFMHJ',
        1: 'KCAKOBFMHJ',
        2: 'KCAKOBFMHJ',
        3: 'KCAKOBFMHJ',
        4: 'KCAKOBFMHJ',
        5: 'KCAKOBFMHJ',
        6: 'KCAKOBFMHJ',
        7: 'KCAKOBFMHJ'
    },
    'SECTION': {
        0: 2,
        1: 4,
        2: 4,
        3: 6,
        4: 6,
        5: 8,
        6: 8,
        7: 8
    },
    'SEQUENCE': {
        0: 16,
        1: 220,
        2: 250,
        3: 10,
        4: 40,
        5: 10.0005,
        6: 20,
        7: 30
    },
    'QUALIFIER': {
        0: 'WFS',
        1: 'WFS',
        2: 'WFS',
        3: 'WFS',
        4: 'WFS',
        5: 'LU(WFS_AL_CAPEX)@M:WEHLU V',
        6: 'WFS',
        7: 'WFS'
    },
    'KEYWORD': {
        0: 'ABAN',
        1: 'START',
        2: 'START',
        3: 'START',
        4: 'PLUG',
        5: 'CAPITAL',
        6: 'CAPITAL',
        7: 'TEXT'
    },
    'EXPRESSION': {
        0: '2 YRS',
        1: '@M.WFS_START_DATE',
        2: '@M.WFS_START_DATE',
        3: '@M.WFS_START_DATE',
        4: '35 X M$ TO LIFE PC 0',
        5: 'X 0 G @M.WFS_AL_MONTHS MOS PC 0',
        6: '0 @M.WFS_PDNP_CAPEX G -1 MOS PC 0',
        7: 'ALL CAPITAL HAS BEEN INCREASED BY 6%'
    },
    'EXTRACTED SEQUENCE': {
        0: None,
        1: None,
        2: None,
        3: None,
        4: None,
        5: 10.0005,
        6: None,
        7: None
    },
    'keyword_mark': {
        0: 'ABAN',
        1: 'START',
        2: 'START',
        3: 'START',
        4: 'PLUG',
        5: 'CAPITAL',
        6: 'CAPITAL',
        7: 'TEXT'
    }
}

AC_PROPERTY_TABLE = {
    'DBSKEY': {
        0: 'chk010100000',
        1: 'chk010100000',
        2: 'chk010100000',
        3: 'chk010100000',
        4: 'chk010100000'
    },
    'PROPNUM': {
        0: 'KCAKOBFMHJ',
        1: 'OAGH9O1OHC',
        2: 'OAGI0P3EZ4',
        3: 'OAGIAB56C1',
        4: 'OAGIAIN5F1'
    },
    'SEQNUM': {
        0: '438803.0',
        1: '437652.0',
        2: '437670.0',
        3: '437682.0',
        4: '437685.0'
    },
    'API': {
        0: '3510922306',
        1: '3508323896',
        2: '3507335867',
        3: '3510938326',
        4: '3510938187'
    },
    'LEASE': {
        0: 'HEATHER 1-19 (WEHLU)',
        1: 'MAXON 30-2 H',
        2: 'WEHLU 009 (STORM 1)',
        3: 'WEHLU 401 ST2 (PAULY)',
        4: 'WEHLU 282 (STATE 16 B 2)'
    },
    'MAJOR': {
        0: 'OIL',
        1: 'OIL',
        2: 'GAS',
        3: 'GAS',
        4: 'OIL'
    },
    'RSV_CAT': {
        0: '3PDNP',
        1: '3PDNP',
        2: '3PDNP',
        3: '3PDSI',
        4: '3PDNP'
    },
    'ACQUISITION': {
        0: 'CHESAPEAKE',
        1: 'GASTAR',
        2: 'GASTAR',
        3: 'GASTAR',
        4: 'GASTAR'
    },
    'PLAY_AREA': {
        0: 'WEST EDMOND',
        1: 'WEST EDMOND',
        2: 'WEST EDMOND',
        3: 'WEST EDMOND',
        4: 'WEST EDMOND'
    },
    'SUB_PLAY_AREA': {
        0: 'WEHLU',
        1: 'WEHLU',
        2: 'WEHLU',
        3: 'WEHLU',
        4: 'WEHLU'
    },
    'OPER_NONOP': {
        0: 'OP',
        1: 'OP',
        2: 'OP',
        3: 'OP',
        4: 'OP'
    },
    'OPERATOR': {
        0: 'REVOLUTION RESOURCES',
        1: 'REVOLUTION RESOURCES',
        2: 'REVOLUTION RESOURCES',
        3: 'REVOLUTION RESOURCES',
        4: 'REVOLUTION RESOURCES'
    },
    'RESERVOIR': {
        0: 'HUNTON',
        1: "BOIS D'ARC",
        2: "BOIS D'ARC",
        3: "BOIS D'ARC",
        4: "BOIS D'ARC"
    },
    'HIST_SPUD': {
        0: '11/3/2009',
        1: '9/20/2008',
        2: '1/1/1945',
        3: '8/22/1944',
        4: '1/1/1945'
    },
    'HIST_FIRST_PROD': {
        0: '12/9/2009',
        1: '1/8/2009',
        2: '7/1/1978',
        3: '1/1/2011',
        4: '1/1/1979'
    },
    'M_SECTION': {
        0: '19.0',
        1: '30.0',
        2: '24.0',
        3: '27.0',
        4: '16.0'
    },
    'TOWNSHIP': {
        0: '14N',
        1: '15N',
        2: '15N',
        3: '14N',
        4: '14N'
    },
    'RANGE': {
        0: '04W',
        1: '04W',
        2: '05W',
        3: '04W',
        4: '04W'
    },
    'STATE': {
        0: 'OK',
        1: 'OK',
        2: 'OK',
        3: 'OK',
        4: 'OK'
    },
    'COUNTY': {
        0: 'OKLAHOMA',
        1: 'LOGAN',
        2: 'OKLAHOMA',
        3: 'OKLAHOMA',
        4: 'OKLAHOMA'
    },
    'HOR_VERT': {
        0: 'V',
        1: 'H',
        2: 'V',
        3: 'V',
        4: 'V'
    },
    'LL': {
        0: np.nan,
        1: '3121.0',
        2: np.nan,
        3: np.nan,
        4: np.nan
    },
    'TC_REFERENCE_LL': {
        0: np.nan,
        1: np.nan,
        2: np.nan,
        3: np.nan,
        4: np.nan
    },
    'LL_MUL': {
        0: np.nan,
        1: np.nan,
        2: np.nan,
        3: np.nan,
        4: np.nan
    },
    'TYPE_CURVE': {
        0: np.nan,
        1: np.nan,
        2: np.nan,
        3: np.nan,
        4: np.nan
    },
    'WI': {
        0: '96.269206',
        1: '98.76921',
        2: '98.76921',
        3: '98.76921',
        4: '98.76921'
    },
    'NRI': {
        0: '80.011465',
        1: '81.948462',
        2: '81.948462',
        3: '81.948462',
        4: '81.948462'
    },
    'DIFF_GROUP': {
        0: 'WEHLU V',
        1: 'WEHLU H ',
        2: 'WEHLU V',
        3: 'WEHLU V',
        4: 'WEHLU V'
    },
    'LOS_GROUP_LIFT': {
        0: 'WEHLU V',
        1: 'WEHLU H NON_ESP',
        2: 'WEHLU V',
        3: 'WEHLU V',
        4: 'WEHLU V'
    },
    'WFS_DRILL': {
        0: np.nan,
        1: np.nan,
        2: np.nan,
        3: np.nan,
        4: np.nan
    },
    'WFS_COMPL': {
        0: np.nan,
        1: np.nan,
        2: np.nan,
        3: np.nan,
        4: np.nan
    },
    'WFS_PDNP_CAPEX': {
        0: '21.0',
        1: '196.0',
        2: '48.0',
        3: np.nan,
        4: '212.0'
    },
    'WFS_PLUG_DATE': {
        0: np.nan,
        1: np.nan,
        2: np.nan,
        3: '2030-08-01 00:00:00',
        4: np.nan
    },
    'WFS_AL_MONTHS': {
        0: '0.0',
        1: '0.0',
        2: '0.0',
        3: '0.0',
        4: '0.0'
    },
    'WFS_DRILL_DATE': {
        0: np.nan,
        1: np.nan,
        2: np.nan,
        3: np.nan,
        4: np.nan
    },
    'WFS_COMPL_DATE': {
        0: np.nan,
        1: np.nan,
        2: np.nan,
        3: np.nan,
        4: np.nan
    },
    'WFS_START_DATE': {
        0: '2023-02-01 00:00:00',
        1: '2023-12-01 00:00:00',
        2: '2023-01-01 00:00:00',
        3: '2011-01-01 00:00:00',
        4: '2023-04-01 00:00:00'
    }
}

CUSTOM_TABLE_dict = {
    'A':
    pd.DataFrame(columns=[
        'PROPNUM',
        'A_DATE',
        'TYPE',
        'HOURS',
        'SIBHP',
        'N_PRIOR',
        'Q1',
        'FBHP1',
        'Q2',
        'FBHP2',
        'Q3',
        'FBHP3',
        'Q4',
        'FBHP4',
        'A_N',
        'A_C',
        'AOR',
        'A_COMMENT',
    ]),
    'CRC':
    pd.DataFrame(columns=[
        'PROPNUM',
        'APPROVED',
        'REASON_COMMENT',
        'REASON_CODE',
        'CHANGEDON',
        'CRC_COMMENT',
    ]),
    'X':
    pd.DataFrame(columns=[
        'PROPNUM',
        'C_DATE',
        'QI',
        'C_DI',
        'C_N',
        'RERW',
        'C_BO',
        'SW',
        'RW',
        'C_MU',
        'CT',
        'C_RE',
        'C_H',
        'PI',
        'PWF',
        'C_K',
        'RWP',
        'PHI',
        'SPG',
        'H2S',
        'CO2',
        'N2',
        'PCRIT',
        'TCRIT',
        'TEMPF',
    ]),
    'J':
    pd.DataFrame(columns=[
        'PROPNUM',
        'D_DATE',
        'PRES_RES',
        'PRES_DEL',
        'AOF',
        'DELIV',
        'SALES',
        'AOF_SLP_N',
        'AOF_CONST',
        'CUM_PROD',
    ]),
    'DT':
    pd.DataFrame(columns=[
        'PROPNUM',
        'SCENARIO',
        'PERIOD',
        'S345',
        'S346',
        'S349',
        'S370',
        'S371',
        'S372',
        'S391',
        'S395',
        'S427',
        'S428',
        'S429',
        'S442',
        'S815',
        'S816',
        'S817',
        'S846',
        'S847',
        'S848',
        'S861',
        'S872',
        'S873',
        'S874',
        'S887',
        'S892',
        'S1062',
        'S1064',
        'S1065',
        'S1069',
        'S1100',
        'S1101',
        'S1183',
        'S1184',
        'S1185',
        'S1186',
        'S1187',
        'S1301',
        'S1302',
        'S1303',
        'S1305',
        'S1306',
        'S1134',
        'S1182',
        'S1236',
        'S1208',
        'S1261',
        'S1262',
        'S1263',
        'S1264',
        'S1265',
        'S1266',
        'S1269',
        'S1270',
        'S1307',
        'S1308',
        'S1314',
        'S1315',
        'S1316',
        'S1317',
        'S1318',
        'S392',
        'S374',
        'S375',
        'S801',
        'S819',
        'S850',
        'S1024',
        'S1018',
        'S1019',
        'S1040',
        'S1041',
        'S1042',
        'S350',
        'S754',
        'S753',
        'S757',
        'S1033',
        'S1034',
        'S1035',
        'S1038',
        'S397',
        'S821',
        'S1039',
        's376',
        's1094',
        's1043',
        'S1093',
        'S893',
        'S1028',
        'S1030',
        'S1046',
    ]),
    'EZ':
    pd.DataFrame(columns=['PROPNUM', 'SCENARIO', 'BREAK_LEVEL', 'RUN_DATE', 'SUM_DATA']),
    'FCST':
    pd.DataFrame(columns=[
        'PROPNUM',
        'PHASE',
        'QUALIFIER',
        'SEGMENT',
        'STARTDATE',
        'ENDDATE',
        'PRODRATE',
        'UOM',
        'DECLINERATE',
        'DECLINETYPE',
        'BFACTOR',
        'STARTCUM',
        'ENDRATE',
        'REMRESV',
        'DURATION',
        'ULTIMATE',
        'DSOURCE',
        'NOMINALRATE',
        'SEGRESV',
    ]),
    'EM':
    pd.DataFrame(columns=[
        'PROPNUM',
        'SCENARIO',
        'OUTDATE',
        'S345',
        'S346',
        'S349',
        'S370',
        'S371',
        'S372',
        'S391',
        'S395',
        'S427',
        'S428',
        'S429',
        'S442',
        'S750',
        'S751',
        'S815',
        'S816',
        'S817',
        'S846',
        'S847',
        'S848',
        'S861',
        'S872',
        'S873',
        'S874',
        'S887',
        'S892',
        'S1062',
        'S1064',
        'S1065',
        'S1069',
        'S1071',
        'S392',
        'S374',
        'S375',
        'S801',
        'S819',
        'S850',
        'S1024',
        'S1018',
        'S1019',
        'S1040',
        'S1041',
        'S1042',
        'S350',
        'S754',
        'S753',
        'S757',
        'S1033',
        'S1034',
        'S1035',
        'S1038',
        's376',
        's1039',
        's1043',
        's1094',
        'S1093',
    ]),
    'NOTE':
    pd.DataFrame(columns=['PROPNUM', 'NOTE_DATE', 'MODIFY_BY', 'NOTE_TEXT']),
    'OL':
    pd.DataFrame(columns=[
        'M16',
        'PROPNUM',
        'SCENARIO',
        'C370',
        'C371',
        'C374',
        'C391',
        'C392',
        'C395',
        'C733',
        'C753',
        'C754',
        'C757',
        'C815',
        'C816',
        'C819',
        'C355',
        'C846',
        'C847',
        'C850',
        'C861',
        'C872',
        'C873',
        'C876',
        'C887',
        'C892',
        'C1062',
        'C1064',
        'C1065',
        'C1069',
        'C1100',
        'C1101',
        'C1183',
        'C1184',
        'C1185',
        'C1186',
        'C1187',
        'C1301',
        'C1302',
        'C1303',
        'C1208',
        'C1263',
        'C1264',
        'C1265',
        'C1269',
        'C1270',
        'C1306',
        'C1308',
        'C1316',
        'C1317',
        'C1318',
        'C1333',
        'M1',
        'M3',
        'M4',
        'M7',
        'M11',
        'M17',
        'M18',
        'M19',
        'M20',
        'M23',
        'M24',
        'M25',
        'M29',
        'M30',
        'M31',
        'M41',
        'M34',
        'M35',
        'M36',
        'M39',
        'E1',
        'E2',
        'E3',
        'E4',
        'E5',
        'E7',
        'E8',
        'E9',
        'E10',
        'E11',
        'P1',
        'P2',
        'P3',
        'P4',
        'P5',
        'P6',
        'P7',
        'P8',
        'P9',
        'P10',
        'P11',
        'G1',
        'G2',
        'G3',
        'G4',
        'C1083',
        'M21',
        'M22',
        'G5',
        'G6',
        'M32',
        'M33',
        'M8',
        'M75',
        'A1',
        'A2',
        'A3',
        'A4',
        'A5',
        'A6',
        'A7',
        'A8',
        'A9',
        'A10',
        'A11',
        'A12',
        'A13',
        'A14',
        'A15',
        'A16',
        'A17',
        'A18',
        'A19',
        'A20',
        'A21',
        'A22',
        'A23',
        'A24',
        'A25',
        'A26',
        'A27',
        'A28',
        'A29',
        'A30',
        'B1',
        'B2',
        'B3',
        'B4',
        'B5',
        'B6',
        'B7',
        'B8',
        'B9',
        'B10',
        'B11',
        'B12',
        'B13',
        'B14',
        'B15',
        'V1',
        'V2',
        'V3',
        'V4',
        'V5',
        'V6',
        'V7',
        'V8',
        'V9',
        'V10',
        'V11',
        'V12',
        'V13',
        'V14',
        'V15',
        'C750',
        'C751',
        'C376',
        'C1024',
    ]),
    'OW':
    pd.DataFrame(columns=[
        'PROPNUM',
        'SCENARIO',
        'PHASENAME',
        'STARTDATE',
        'HISTORY',
        'OWNERNAME',
        'UNITS',
        'INTEREST',
    ]),
    'PZ':
    pd.DataFrame(columns=[
        'PROPNUM',
        'QUALIFIER',
        'PZORIG',
        'PZABD',
        'EUR',
        'GASINPLACE',
        'EFF_DATE',
        'REMAINING',
    ]),
    'RATIO':
    pd.DataFrame(columns=[
        'PROPNUM',
        'RATIO_1',
        'RATIO_2',
        'RATIO_3',
        'RATIO_4',
        'RATIO_5',
        'RATIO_6',
        'RATIO_7',
        'RATIO_8',
        'RATIO_9',
        'RATIO_10',
    ]),
    'RESV':
    pd.DataFrame(columns=[
        'PROPNUM',
        'LABEL',
        'EFF_DATE',
        'ROWFLAG',
        'METHOD',
        'TYPE',
        'RES_G1',
        'RES_G2',
        'RES_G3',
        'RES_G4',
        'RES_G5',
        'RES_G6',
        'RES_G7',
        'RES_G8',
        'RES_G9',
        'RES_G10',
        'REV_MEMO',
        'NET_FACTOR',
    ]),
    'R':
    pd.DataFrame(columns=[
        'PROPNUM',
        'OWN_TYPE',
        'RO_DATE',
        'QUAL_OWNER',
        'BEG_DATE',
        'BEG_P1',
        'BEG_P2',
        'BEG_P3',
        'BEG_P4',
        'BEG_P5',
        'BEG_P6',
        'BEG_P7',
        'BEG_P8',
        'BEG_P9',
        'BEG_NPV',
        'CUR_DATE',
        'CUR_P1',
        'CUR_P2',
        'CUR_P3',
        'CUR_P4',
        'CUR_P5',
        'CUR_P6',
        'CUR_P7',
        'CUR_P8',
        'CUR_P9',
        'CUR_NPV',
    ]),
    'WT':
    pd.DataFrame(columns=[
        'PROPNUM',
        'T_DATE',
        'T_TIME',
        'CULLFLAG',
        'T_LONG',
        'PHASE',
        'TYPE',
        'CODE',
        'CUM_OIL',
        'CUM_GAS',
        'CUM_WATER',
        'OIL_RATE',
        'GAS_RATE',
        'WTR_RATE',
        'WHT',
        'M_FWHP',
        'M_FBHP',
        'M_SIWHP',
        'M_SIBHP',
        'C_FWHP',
        'C_FBHP',
        'C_SIWHP',
        'C_SIBHP',
        'LINEP',
        'RESVP',
        'Z',
        'CAOF',
        'CHOKE',
        'GLVOL',
        'SPM',
        'T_ALLOC',
        'BHPZ',
        'T_COMMENT',
        'BHT',
    ]),
    'USR':
    pd.DataFrame(columns=[
        'PROPNUM',
        'TEXT0',
        'TEXT1',
        'TEXT2',
        'TEXT3',
        'TEXT4',
        'TEXT5',
        'TEXT6',
        'TEXT7',
        'TEXT8',
        'TEXT9',
        'NUMBER0',
        'NUMBER1',
        'NUMBER2',
        'NUMBER3',
        'NUMBER4',
        'NUMBER5',
        'NUMBER6',
        'NUMBER7',
        'NUMBER8',
        'NUMBER9',
        'DATE0',
        'DATE1',
        'DATE2',
        'DATE3',
        'DATE4',
        'DATE5',
        'DATE6',
        'DATE7',
        'DATE8',
        'DATE9',
    ]),
    'VIP':
    pd.DataFrame(columns=[
        'PROPNUM',
        'QUALIFIER',
        'PROD_DT',
        'OIL',
        'GAS',
        'WTR',
        'WTRINJ',
        'GASINJ',
        'PRESS',
        'PTYPE',
    ]),
    'WD':
    pd.DataFrame(columns=[
        'PROPNUM',
        'AREA',
        'NET_PAY',
        'POROSITY',
        'WTR_SAT',
        'PREV_OIL_RECV',
        'RF',
        'FVF_OIL',
        'TSP_SUM',
        'TSP_AVG',
        'FEET_IN',
        'PRES_INIT',
        'PRES_INWH',
        'PZORIG',
        'TEMP_RES',
        'TEMP_GRAD',
        'TEMP_FLWWH',
        'GAS_GRAV',
        'OIL_CND_GR',
        'H2O_GRAV',
        'GOR',
        'GASINPLACE',
        'OILINPLACE',
        'DEPTH_MEAS',
        'DEPTH_TVD',
        'FLOW_ID',
        'FLOW_OD',
        'RUFNESS',
        'TEST_RATE',
        'TEST_PRES',
        'FIRST_PROD',
        'TEST_DATE',
        'AOF',
        'AOF_SLP_N',
        'AOF_SIBHP',
        'AOF_DATE',
        'W_PERM',
        'COMP_EFF',
        'RADIUS_RW',
        'RADIUS_RE',
        'N2_PCT',
        'CO2_PCT',
        'H2S_PCT',
        'COND_YIELD',
        'H2O_YIELD',
        'SKIN',
        'CONTR_SWNG',
        'PRES_BASE',
        'CRIT_TEMP',
        'CRIT_PRES',
        'FVF_GAS',
        'SOL_GOR',
        'PROJECT_AREA',
        'SPACING_ORIGINAL',
        'UPDATED_DATE',
    ]),
    'GRFCMT':
    pd.DataFrame(columns=[
        'PROPNUM',
        'SEQNUM',
        'HIDE',
        'SCENARIO',
        'XVALUE',
        'YVALUE',
        'COMMENT_TEXT',
        'UPDATE_DATE',
        'UPDATE_USER_ID',
    ]),
    'ARIBULK':
    pd.DataFrame(columns=[
        'PROPNUM',
        'SCENARIO',
        'PARM_NAME',
        'FORMAT',
        'DATA_OPTION',
        'DATA_SIZE',
        'BYTE_SIZE',
        'UPDATE_DATE',
        'ARIES_WELL_BLOB',
    ]),
    'RPTFMTS':
    pd.DataFrame(columns=[
        'FORMATTYPE',
        'NAME',
        'FORMATOWNER',
        'SOURCETABLE',
        'TARGETTABLE',
        'DATECREATED',
        'CREATEDBY',
        'DATEMODIFIED',
        'MODIFIEDBY',
        'DESCRIPTION',
        'REMARK',
        'DATA',
    ]),
    'BM':
    pd.DataFrame(columns=[
        'ENTRYKEY',
        'DBSKEY',
        'SCENARIO',
        'INPUT_SETTING',
        'REPORT_STYLE',
        'OUTPUT_TO',
        'DATA_PAGE',
        'REPORT_PAGE',
        'WEIGHT',
        'ONELINE',
        'MONTHLY',
        'DETAIL',
        'OWNER',
        'SUM_PROP',
        'SUM_GRPS',
        'SUM_SUBS',
        'TRACE',
        'MACRONAME',
        'PROJNAME',
    ]),
    'ES':
    pd.DataFrame(columns=[
        'KEYWORD',
        'CNTRY',
        'ARRAY',
        'ITEM_NUM',
        'DEPENDENT',
        'DATA_SECT',
        'DET_SUM',
        'HELP_TEXT',
    ]),
    'GPOOL':
    pd.DataFrame(columns=['GROUP_KEY', 'MEMBER', 'T_DATE', 'CUM_GAS']),
}
