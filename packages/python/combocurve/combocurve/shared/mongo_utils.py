def cursor_read_batches(cursor, batch_size):
    batch = []
    index = 0
    while True:
        try:
            document = cursor.next()
            batch.append(document)
            if index == batch_size:
                yield batch
                index = 0
                batch = []
            index += 1
        except StopIteration:
            break
    if len(batch) > 0:
        yield batch


def put_items_together(items_dict, key_word_dict, main_ids):
    ### also works for non sorted items
    main_ids = [str(main_id) for main_id in main_ids]
    main_ids_idx = {main_id: i for i, main_id in enumerate(main_ids)}
    ret = [{'main_id': x} for x in main_ids]
    for k, v in items_dict.items():
        this_key = key_word_dict[k]
        for value in v:
            this_id = str(value[this_key])
            if this_id in main_ids:
                this_id_idx = main_ids_idx[this_id]
                this_id_dict = ret[this_id_idx]
                this_id_dict[k] = value

    return ret


## a supporting function to add items to the return of put_items_together
def add_item_to_list(ret, items_dict, key_word_dict, main_ids):
    main_ids = [str(main_id) for main_id in main_ids]
    main_ids_idx = {main_id: i for i, main_id in enumerate(main_ids)}
    for k, v in items_dict.items():
        this_key = key_word_dict[k]
        for value in v:
            this_id = str(value[this_key])
            if this_id in main_ids:
                this_id_idx = main_ids_idx[this_id]
                this_id_dict = ret[this_id_idx]
                this_id_dict[k] = value

    return ret
