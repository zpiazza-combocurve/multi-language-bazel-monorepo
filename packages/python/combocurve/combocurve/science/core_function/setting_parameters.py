import numpy as np

error_type = 'log_mpe_add_eps'
cum_error_type = 'log_mpe_add_eps'
error_power = 1.5
holidays = ['new_year', 'martin_luther_king', 'memorial', 'independence', 'labor', 'thanks_giving', 'christmas']

BASE_TIME_STR = '1900-01-01'
BASE_TIME = np.datetime64(BASE_TIME_STR)
