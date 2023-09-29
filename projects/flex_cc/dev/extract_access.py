import csv
import io
import os

import pyodbc

from dev.helpers import find_file_path_for_extraction

run_local_directory = "../run_local/"


def extract_aries_access_files(file_name):
    use_directory, created_folder_name, file_directory = find_file_path_for_extraction(file_name, phdwin=False)

    if use_directory is None and created_folder_name is None:
        return
    elif use_directory is None and created_folder_name is not None:
        return created_folder_name

    # link to db
    conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={file_directory};'
    cnxn = pyodbc.connect(conn_str)

    # get table name
    crsr = cnxn.cursor()
    aries_db_tables = list(crsr.tables(tableType='TABLE'))
    crsr.close()

    for table_info in aries_db_tables:
        table_name = table_info.table_name
        try:
            crsr = cnxn.cursor()
            crsr.execute(f'select * from {table_name};')
            csv_buffer = io.StringIO()
            csv_writer = csv.writer(csv_buffer, quoting=csv.QUOTE_NONNUMERIC)
            csv_writer.writerow([i[0] for i in crsr.description])
            csv_writer.writerows(crsr)
            crsr.close()

            # save to local
            csv_buffer.seek(0)
            with open(f'{use_directory}{table_name}.csv', 'w', newline='', errors="ignore") as f:
                for line in csv_buffer:
                    f.write(line)
        except Exception:
            pass
    cnxn.close()

    # move the phz file from the run_local directory to the newly created directory
    file_name = file_directory.split('/')[-1]
    os.rename(f'{file_directory}', f'{use_directory}{file_name}')

    return created_folder_name
