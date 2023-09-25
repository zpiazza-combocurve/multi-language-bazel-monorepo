import logging

import pandas as pd
import numpy as np
from google.api_core.retry import Retry
from google.api_core.exceptions import NotFound

from .exceptions import get_exception_info


class MergeOps:
    def __init__(self, content_type, file_extension):
        self.content_type = content_type
        self.file_extension = file_extension
        self.intermediate_blobs = []
        self.intermediate_num = 0
        self.max_round = -1
        self.ops = {}
        self.size_lim = 32

    def construct_arr(self, ordered_blobs, sep_chunk):
        # arr initialization
        arr = []
        for i in range(len(sep_chunk) - 1):

            arr += [ordered_blobs[sep_chunk[i]:sep_chunk[i + 1]]]

        cur_arr = arr
        while len(cur_arr) > self.size_lim:
            this_len = len(cur_arr)
            this_loop_num = int(np.ceil(this_len / self.size_lim))
            new_arr = []
            for i in range(this_loop_num):
                new_arr += [cur_arr[i * 32:(i + 1) * 32]]

            cur_arr = new_arr
        return cur_arr

    def work_on_arr(self, bucket, blob_prefix, cur_round, arr):
        if len(arr) == 1 and type(arr[0]) == list:
            return self.work_on_arr(bucket, blob_prefix, cur_round, arr[0])
        elif len(arr) == 1 and type(arr[0]) != list:
            return arr[0]
        else:
            for i, v in enumerate(arr):
                if type(v) == list:
                    arr[i] = self.work_on_arr(bucket, blob_prefix, cur_round + 1, v)
            ret_blob_name = 'intermediate_{}_{:08d}{}'.format(blob_prefix, self.intermediate_num, self.file_extension)
            self.intermediate_num += 1
            ret_blob = bucket.blob(ret_blob_name)
            if self.content_type:
                ret_blob.content_type = self.content_type
            self.intermediate_blobs += [ret_blob]
            this_op = {'input': arr, 'output': ret_blob}

            round_name = 'round_{:08d}'.format(cur_round)
            if self.ops.get(round_name) is None:
                self.ops[round_name] = [this_op]
            else:
                self.ops[round_name] += [this_op]
            return ret_blob


@Retry()
def batch_operation_with_retry(storage_client, batches, operation):
    if len(batches) == 1:
        operation(batches[0])
        return
    with storage_client.batch():
        for batch in batches:
            operation(batch)


@Retry()
def batch_delete_with_retry(storage_client, batches):
    try:
        if len(batches) == 1:
            batches[0].delete()
            return
        with storage_client.batch():
            for batch in batches:
                batch.delete()
    except NotFound:
        pass


def combine_storage_files(
    storage_client,
    bucket,
    blob_prefix,  # Blob names do not include counter: f'{prefix}{suffix}0001' f'{prefix}{suffix}0002'...
    blob_suffix,  # Suffix will be omitted from result: f'{prefix}_final_0001' f'{prefix}_final_0002'...
    content_type,
    header_blob=None,
    file_extension='',
    combine_size_lim=500000,  # The result will be split into files of this size
    maximum_allowed_size=500000,  # Original files bigger than this will result in an error
):
    file_blob_list = list(bucket.list_blobs(prefix=blob_prefix + blob_suffix))

    file_info = pd.DataFrame(list(map(lambda x: {'size': x.size, 'name': x.name}, file_blob_list)))
    n_files = file_info.shape[0]
    file_ordering = np.argsort(np.array(file_info['name']))

    ordered_file_blobs = np.array(file_blob_list)[file_ordering].tolist()

    size_arr = np.array(file_info['size'])[file_ordering] / 1024 / 1024

    if (size_arr > maximum_allowed_size).any():
        raise FileTooBigError()

    sep_range = [[0, n_files]]
    cur_sum = size_arr[0]

    for i in range(1, n_files):
        cur_sum += size_arr[i]
        if cur_sum > combine_size_lim:
            new_one = [[sep_range[-1][0], i], [i, sep_range[-1][1]]]
            sep_range.pop(-1)
            sep_range += new_one
            cur_sum = size_arr[i]

    sep = []
    for i in range(len(sep_range)):
        this_range = sep_range[i]
        this_sep = list(range(this_range[0], this_range[1], 32)) + [this_range[1]]
        sep += [this_sep]

    merge = MergeOps(content_type, file_extension)
    finals = []
    for sep_chunk in sep:
        this_arr = merge.construct_arr(ordered_file_blobs, sep_chunk)
        #    ret = merge.work_on_arr(0, this_arr)
        finals += [merge.work_on_arr(bucket, blob_prefix, 0, this_arr)]

    n_rounds = len(merge.ops.keys())
    for i in list(range(n_rounds))[::-1]:
        round_name = 'round_{:08d}'.format(i)
        this_round_ops = merge.ops[round_name]
        n_loop = int(np.ceil(len(this_round_ops) / 100))
        for j in range(n_loop):
            batch_operation_with_retry(storage_client, this_round_ops[j * 100:(j + 1) * 100],
                                       lambda op: op['output'].compose(op['input']))

    # merge the finals with the header
    result_blob_names = []
    for i in range(len(finals)):
        this_name = '{}_final_{:08d}{}'.format(blob_prefix, i, file_extension)
        result_blob_names += [this_name]
        this_blob = bucket.blob(this_name)
        if content_type:
            this_blob.content_type = content_type
        content = []
        if header_blob:
            content = [header_blob]
        content += [finals[i]]
        batch_operation_with_retry(storage_client, [content], lambda cont: this_blob.compose(cont))

    # delete all intermediate blobs
    deleted_blobs = file_blob_list + merge.intermediate_blobs
    if header_blob:
        deleted_blobs += [header_blob]
    n_delete_loop = int(np.ceil(len(deleted_blobs) / 100))
    for i in range(n_delete_loop):
        try:
            batch_delete_with_retry(storage_client, deleted_blobs[i * 100:(i + 1) * 100])
        except Exception as e:
            error_info = get_exception_info(e)
            logging.error(error_info['message'], extra={'metadata': {'error': error_info}})

    return result_blob_names


class FileTooBigError(Exception):
    expected = True
