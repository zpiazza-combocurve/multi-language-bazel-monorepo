import re


def make_file_os_safe(name: str) -> str:
    '''
    Remove characters disallowed for filenames. System dependent, but I think it's fine to be safe and remove
    the reserved characters from all of *nix/Mac/Windows.
    '''
    # Remove trailing whitespace and get rid of the literals /*."\[]:;|,
    clean_name = re.sub(r'[/*."\\[\]:;|,]', '', name).strip()
    # Remove filenames reserved by Windows.
    if clean_name in ('', 'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8',
                      'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'):
        clean_name = 'DOWNLOAD'
    return clean_name
