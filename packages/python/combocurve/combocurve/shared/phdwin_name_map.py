import os


def change_name(use_directory):
    use_directory = use_directory if use_directory.endswith('/') else f'{use_directory}/'
    # get all the files in the directory
    files = os.listdir(use_directory)

    # all the csv files in the directory
    csv_files = [f for f in files if '.csv' in f]

    # get all files in the csv_files list that match with the names in the FILE_NAME_MAP dictionary
    # this names need to be mapped to the conversion code accepted name
    # rename those names with the value in the FILE_NAME_MAP dictionary
    wrong_names = set(csv_files).intersection(set(FILE_NAME_MAP.keys()))
    for f_name in wrong_names:
        os.rename(os.path.join(use_directory, f_name), os.path.join(use_directory, FILE_NAME_MAP[f_name]))


def check_for_phdwin_required_tables(use_directory):
    # get list of all extracted files from the .mod and .phd files
    extracted_tables = os.listdir(use_directory)

    # check that all required PHD tables are among the extracted files
    for rqd_phd_table in PHDWIN_RQD_PHD_TABLES:
        if f'test.{rqd_phd_table}.csv' not in extracted_tables:
            print(f'MISSING {rqd_phd_table} TABLE')  # noqa: T001
            return False, rqd_phd_table

    # check that all required MOD tables are among the extracted files
    for rqd_mod_table in PHDWIN_RQD_MOD_TABLES:
        table = f'test.{rqd_mod_table}.csv'
        o_table = f'test.O{rqd_mod_table}.csv'
        if table not in extracted_tables and o_table not in extracted_tables:
            print(f'MISSING {rqd_mod_table} TABLE')  # noqa: T001
            return False, rqd_mod_table
    return True, None


# all required PHD Tables
PHDWIN_RQD_PHD_TABLES = [
    'ACT', 'IDC', 'PNF', 'ZON', 'VOL', 'CLA', 'CAT', 'TST', 'DAT', 'TIT', 'GCA', 'GCL', 'ECF', 'FLU', 'FOR', 'ARC',
    'GRP', 'LSG', 'LPV', 'INV', 'OWN', 'ADJ', 'UNI', 'MSC'
]

# all required MOD Tables
PHDWIN_RQD_MOD_TABLES = ['MSG', 'MPV']

ALL_PHDWIN_TABLES = PHDWIN_RQD_MOD_TABLES + PHDWIN_RQD_PHD_TABLES

# Dictionary with Key -> Old File Names, Value -> New File Names
FILE_NAME_MAP = {
    'test.ODJ.csv': 'test.ADJ.csv',
    'test.OAF.csv': 'test.ACT.csv',
    'test.OAL.csv': 'test.ALC.csv',
    'test.OAR.csv': 'test.ARC.csv',
    'test.OBSU.csv': 'test.BSU.csv',
    'test.OCA.csv': 'test.CAT.csv',
    'test.OCEF.csv': 'test.CEF.csv',
    'test.OCL.csv': 'test.CLA.csv',
    'test.OCNV.csv': 'test.CNV.csv',
    'test.OCO.csv': 'test.COM.csv',
    'test.OCF.csv': 'test.CUM.csv',
    'test.OCVT.csv': 'test.CVT.csv',
    'test.OCVU.csv': 'test.CVU.csv',
    'test.ODF.csv': 'test.DAT.csv',
    'test.OEF.csv': 'test.ECF.csv',
    'test.OEDF.csv': 'test.EDF.csv',
    'test.OFCC.csv': 'test.FCC.csv',
    'test.OFT.csv': 'test.FLL.csv',
    'test.OFI.csv': 'test.FLT.csv',
    'test.OFL.csv': 'test.FLU.csv',
    'test.OFF.csv': 'test.FOR.csv',
    'test.OGCA.csv': 'test.GCA.csv',
    'test.OGCL.csv': 'test.GCL.csv',
    'test.OGRA.csv': 'test.GRA.csv',
    'test.OGR.csv': 'test.GRF.csv',
    'test.OGF.csv': 'test.GRP.csv',
    'test.OID.csv': 'test.IDC.csv',
    'test.OIL.csv': 'test.ILF.csv',
    'test.OIF.csv': 'test.INV.csv',
    'test.OVC.csv': 'test.IVC.csv',
    'test.OLPV.csv': 'test.LPV.csv',
    'test.OLF.csv': 'test.LSE.csv',
    'test.OLSG.csv': 'test.LSG.csv',
    'test.OMSC.csv': 'test.MSC.csv',
    'test.ONF.csv': 'test.NET.csv',
    'test.OOR.csv': 'test.ORD.csv',
    'test.OOF.csv': 'test.OWN.csv',
    'test.OPCC.csv': 'test.PCC.csv',
    'test.OPHE.csv': 'test.PHE.csv',
    'test.OPHU.csv': 'test.PHU.csv',
    'test.OPNF.csv': 'test.PNF.csv',
    'test.OROA.csv': 'test.ROA.csv',
    'test.OROY.csv': 'test.ROY.csv',
    'test.ORF.csv': 'test.RPG.csv',
    'test.ORL.csv': 'test.RPL.csv',
    'test.ORI.csv': 'test.RSK.csv',
    'test.ORN.csv': 'test.RSN.csv',
    'test.OSP.csv': 'test.RSP.csv',
    'test.OSO.csv': 'test.SRT.csv',
    'test.OTI.csv': 'test.TIT.csv',
    'test.OTF.csv': 'test.TST.csv',
    'test.OUNI.csv': 'test.UNI.csv',
    'test.VER.csv': 'test.VER.csv',
    'test.OVF.csv': 'test.VOL.csv',
    'test.OZF.csv': 'test.ZON.csv',
}
