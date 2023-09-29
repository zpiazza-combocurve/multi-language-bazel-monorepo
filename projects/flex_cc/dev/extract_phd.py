import os
from zipfile import ZipFile

from combocurve.shared.phdwin_name_map import change_name, check_for_phdwin_required_tables
from dev.helpers import find_file_path_for_extraction

# JAVA Path, please modify to your location!
JAVA_PATH = r'"C:\Program Files\Java\jre1.8.0_291\bin\java.exe"'


def extract_phdwin_files(file_name):
    """
        Input(s):
            file_name (str): Name of .phz file to be imported

        Description:
            Unzipz PHZ file, extracts csvs from the gotten MOD and PHD file and stores the csvs in a created folder
            in the run_local directory
            If the file_name given is already a folder in the run_local directory with the required tables,
            upload directly from the table
            Note: Created folder is named based on the file-name

        Output(s):
            return_folder_name (str): Name of Created Folder in Run Local Directory with all created files
    """

    # set initial value of return_folder_name as None
    run_local_directory = "../run_local/"
    use_directory, created_folder_name, _ = find_file_path_for_extraction(file_name)

    if use_directory is None and created_folder_name is None:
        return
    elif use_directory is None and created_folder_name is not None:
        return created_folder_name

    # unzip .phz file into the newly created folder
    with ZipFile(f'{run_local_directory}{file_name}.phz', 'r') as zip:
        zip.extractall(use_directory)

    # get all the files
    phd_files = os.listdir(use_directory)

    # check that the .mod and .phd file is in the extracted files
    if all(any(str(phd_file).lower().endswith(f_type) for phd_file in phd_files) for f_type in ['.mod', '.phd']):
        # rename the .phd and .mod files to remove spaces
        phd_file_dict = {phd_file: str(phd_file).lower().replace(' ', '_').replace('&', '_') for phd_file in phd_files}
        for old_file_name, new_file_name in phd_file_dict.items():
            os.rename(f'{use_directory}{old_file_name}', f'{use_directory}{new_file_name}')

        # move the phz file from the run_local directory to the newly created directory
        os.rename(f'{run_local_directory}{file_name}.phz', f'{use_directory}{file_name}.phz')

        # extract .phd and .mod file
        for file in phd_file_dict.values():
            file_type = 'MOD' if str(file).endswith('.mod') else 'PHD'
            # tps_dir: directory to the tps-to-csv java conversion code
            tps_dir = 'apps/flex_cc/dev/tps-to-csv.jar'
            # run code
            syntax = (f'{JAVA_PATH} -jar {tps_dir} -s {use_directory}{file} -t {use_directory}test.csv -direct')
            print(f'Extracting {file_type} file')  # noqa: T001
            return_code = os.system(syntax)
            # print error msg if extraction fails (0 indicates successful extraction)
            if return_code != 0:
                print(f'FAILED TO EXTRACT {file_type} FILE')  # noqa: T001
                return
            print(f'Successfully Extracted {file_type} file')  # noqa: T001

        # rename certain tables in PHDWIN to meet code requirements
        change_name(use_directory)

        valid, _ = check_for_phdwin_required_tables(use_directory)

        if not valid:
            return
        return created_folder_name
    else:
        print('MISSING MOD AND/OR PHD FILE')  # noqa: T001
