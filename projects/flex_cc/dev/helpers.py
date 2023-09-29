import os

# Set the Maximum Number of try to rename duplicate Folder
MAX_LOOP_COUNT = 50


def find_file_path_for_extraction(file_name, run_local_directory="../run_local/", phdwin=True):
    created_folder_name = None
    file_directory = None

    # get all the files in run_local directory (make all lower-case)
    files = [str(dir_name).lower() for dir_name in os.listdir(run_local_directory)]

    # if .phz file in directory continue to next process
    file_types = ['phz'] if phdwin else ['accdb', 'mdb']

    if any(f'{str(file_name).lower()}.{file_type}' in files for file_type in file_types):
        full_file_name = next(f'{file_name}.{file_type}' for file_type in file_types
                              if f'{str(file_name).lower()}.{file_type}' in files)
        file_directory = f'{run_local_directory}{full_file_name}'
    # if the folder with the same name is found, validate all tables in folder and retuen given folder name
    elif f'{str(file_name).lower()}' in files:
        print(f'USING EXISTING FOLDER: {file_name}')  # noqa: T001
        return None, file_name, None
    # if none of the above criteria are met, print error message and stop
    else:
        print('FILE NAME NOT IN RUN_LOCAL DIRECTORY')  # noqa: T001
        return

    # Remove all spaces from the file name (required to call extraction code)
    clean_file_name = file_name.replace(' ', '_')

    # set iterations to zero for first iteration
    iterations = 0
    # create a loop with a max of 50 iteration
    while iterations <= MAX_LOOP_COUNT:
        try:
            if iterations == 0:
                # create new directory in run_local with the formated file name
                os.mkdir(f'{run_local_directory}{clean_file_name}')

                # set created_folder_name to the clean file name
                created_folder_name = clean_file_name
            else:
                # create new directory in run_local with an updated name based on the formated file name
                os.mkdir(f'{run_local_directory}{clean_file_name}_{iterations}')

                # set created_folder_name to the clean file name plus the accepted iterations
                created_folder_name = f"{clean_file_name}_{iterations}"
                print(f'DUPLICATE FILE(S) DETECTED, FILE RENAMED TO: {created_folder_name}')  # noqa: T001
        except FileExistsError:
            iterations += 1
            continue
        # if folder name is successfully created break loop
        break

    # set the use_directory variable to the directory of the newly created folder
    use_directory = f'{run_local_directory}{created_folder_name}/'

    return use_directory, created_folder_name, file_directory
