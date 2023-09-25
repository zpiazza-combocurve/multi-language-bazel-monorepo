# normalize_tc
import pandas as pd
import numpy as np
from copy import deepcopy
import bson


def plus(a, b):
    return a + b


def minus(a, b):
    return a - b


def multiply(a, b):
    return a * b


def divide(a, b):
    if type(a) in [np.ndarray, pd.Series]:
        if type(b) in [np.ndarray, pd.Series]:
            ret = np.zeros(b.shape)
            range_1 = (b != 0)
            range_2 = ~range_1
            ret[range_1] = a[range_1] / b[range_1]
            ret[range_2] = np.nan
        else:
            if b == 0:
                ret = np.nan
            else:
                ret = a / b
    else:
        if type(b) in [np.ndarray, pd.Series]:
            ret = np.zeros(b.shape)
            range_1 = (b != 0)
            range_2 = ~range_1
            ret[range_1] = a / b[range_1]
            ret[range_2] = np.nan
        else:
            if b == 0:
                ret = np.nan
            else:
                ret = a / b

    return ret


ops = {'+': plus, '-': minus, '*': multiply, '/': divide}

inverse_ops = {'+': minus, '-': plus, '*': divide, '/': multiply}

# x_chain = {
#     'start_feature':
#     '$phase_eur',
#     'op_chain': [{
#         'op': '/',
#         'op_feature': 'LL'
#     }, {
#         'op': '/',
#         'op_feature': 'Prop'
#     }]
# }


class use_chain:
    def convert_header(self, header):
        ret = {}
        if type(header) == pd.DataFrame:
            for k in list(header.columns):
                ret[k] = np.array(header[k])
        else:
            ret = deepcopy(header)
        return ret

    def forward(self, input_header, chain):
        normalize_header = self.convert_header(input_header)

        start_feature = normalize_header[chain['start_feature']]
        this_val = deepcopy(start_feature)
        for step in chain['op_chain']:
            this_op = step['op']
            this_feature = normalize_header[step['op_feature']]
            this_val = ops[this_op](this_val, this_feature)
            # this_val = self.apply_op(this_val, this_feature, this_op)

        return this_val

    def backward(self, final_val, input_header, chain):
        normalize_header = self.convert_header(input_header)
        this_val = deepcopy(final_val)
        for step in chain['op_chain'][::-1]:
            this_op = step['op']
            this_feature = normalize_header[step['op_feature']]
            this_val = inverse_ops[this_op](this_val, this_feature)
            # this_val = self.inverse_op(this_val, this_feature, this_op)
        return this_val


def T1(obj, apply_input):
    x_chain = apply_input['x_chain']
    y_chain = apply_input['y_chain']
    chain_item = set([x_chain['start_feature']])
    for step in x_chain['op_chain']:
        chain_item.add(step['op_feature'])

    chain_item.add(y_chain['start_feature'])
    for step in y_chain['op_chain']:
        chain_item.add(step['op_feature'])
    chain_item_list = list(chain_item)

    ret = deepcopy(apply_input)
    normalize_header = pd.DataFrame(ret['normalize_header'])

    for k in chain_item_list:
        if k not in normalize_header.columns:
            normalize_header[k] = np.nan
        else:
            string_mask = np.array(list(map(type, np.array(normalize_header[k])))) == str
            normalize_header[string_mask] = None
            normalize_header[k] = normalize_header[k].astype(float)

    ret['normalize_header'] = normalize_header
    obj.eur_key = y_chain['start_feature']
    return ret


def T2_apply(ana_result):
    ret = deepcopy(ana_result)
    ret['adjusted_headers'] = ret['adjusted_headers'].to_dict('records')
    for i, this_record in enumerate(ret['adjusted_headers']):
        for k, v in this_record.items():
            if type(v) == str or v is None:
                continue
            elif type(v) == bson.objectid.ObjectId:
                this_record[k] = str(v)
            elif np.isnan(v):
                this_record[k] = None

    ret['multipliers'] = ret['multipliers'].tolist()
    return ret


class linear:
    def __init__(self):
        self.eur_key = None

    def T1(self, apply_input):
        return T1(self, apply_input)

    def fit(self, x_chain, y_chain, normalize_header, mask_fit):
        chain_tool = use_chain()
        x = chain_tool.forward(normalize_header, x_chain)
        y = chain_tool.forward(normalize_header, y_chain)
        if (x.shape[0] == 0) or (y.shape[0] == 0):
            return 0, 0

        valid_mask = (~np.isnan(x)) & (~np.isnan(y)) & mask_fit
        if np.sum(valid_mask) <= 1:
            slope = 0
            if np.isnan(y).all():
                intercept = 0
            else:
                intercept = np.nanmean(y)
        else:

            use_x = x[valid_mask]
            use_y = y[valid_mask]
            X = np.stack([np.ones(use_x.shape), use_x], axis=1)
            if ((X[:, 1] - X[0, 1]) == 0).all():
                slope = 0
                intercept = np.mean(use_y)
            else:
                Y = use_y.reshape(-1, 1)
                A = np.matmul(X.transpose(), X)
                B = np.matmul(X.transpose(), Y)
                beta = np.linalg.solve(A, B)
                intercept = beta[0, 0]
                slope = beta[1, 0]

        return float(intercept), float(slope)

    def apply(self, slope, x_chain, y_chain, normalize_header, target, mask):
        # normalize_header must be a data frame
        chain_tool = use_chain()
        target_x = chain_tool.forward(target, x_chain)
        if np.isnan(target_x):
            raise Exception('Target value not valid')
        else:
            x = chain_tool.forward(normalize_header, x_chain)
            y = chain_tool.forward(normalize_header, y_chain)
            if (x.shape[0] == 0) or (y.shape[0] == 0):
                return {'adjusted_headers': normalize_header, 'multipliers': np.ones(x.shape)}

            valid_mask = (~np.isnan(x)) & (~np.isnan(y)) & np.array(mask, dtype=bool)
            multiplier = np.ones(x.shape)
            if np.sum(valid_mask) > 0:
                use_x = x[valid_mask]
                use_y = y[valid_mask]
                use_x_prime = target_x
                use_y_prime = (use_x_prime - use_x) * slope + use_y

                scale_invalid_mask = use_y_prime <= 0

                use_y_prime[scale_invalid_mask] = use_y[scale_invalid_mask] * use_x_prime / use_x[scale_invalid_mask]
                use_scale_eur = chain_tool.backward(use_y_prime, target, y_chain)
                use_orig_eur = normalize_header.loc[valid_mask, self.eur_key]
                multiplier[valid_mask] = (use_scale_eur / use_orig_eur)
            multiplier[np.isnan(multiplier)] = 1
            multiplier[np.isinf(multiplier)] = 1
            multiplier[multiplier <= 0] = 1
            adjusted_header = deepcopy(normalize_header)
            for k in target.keys():
                adjusted_header[k] = target[k]

            adjusted_header[self.eur_key] = normalize_header[self.eur_key] * multiplier

            return {'adjusted_headers': adjusted_header, 'multipliers': multiplier}

    def T2_apply(self, ana_result):
        return T2_apply(ana_result)

    def inverse(self, slope, x_chain, y_chain, normalize_header, target, mask):
        # target should have the eur for type curve
        chain_tool = use_chain()
        target_x = chain_tool.forward(target, x_chain)
        target_y = chain_tool.forward(target, y_chain)
        if np.isnan(target_x) | np.isnan(target_y):
            raise Exception('Target value not valid')
        else:
            x = chain_tool.forward(normalize_header, x_chain)
            multiplier = np.ones(x.shape)
            valid_mask = np.array(mask, dtype=bool) & (~np.isnan(x))
            if np.sum(valid_mask):
                use_x = x[valid_mask]
                base_x = target_x
                base_y = target_y

                use_y = (use_x - base_x) * slope + base_y

                scale_invalid_mask = (use_y <= 0)
                use_y[scale_invalid_mask] = base_y * use_x[scale_invalid_mask] / base_x

                use_eur = chain_tool.backward(use_y, normalize_header.loc[valid_mask, :], y_chain)
                multiplier[valid_mask] = use_eur / target[self.eur_key]

            multiplier[np.isnan(multiplier)] = 1
            multiplier[np.isinf(multiplier)] = 1
            multiplier[multiplier <= 0] = 1
            return multiplier

    def body(self, input_dict, method):
        T1_ret = self.T1(input_dict)
        if method == 'fit':
            ana_result = self.fit(**T1_ret)
            T2_ret = ana_result
        elif method == 'apply':
            ana_result = self.apply(**T1_ret)
            T2_ret = self.T2_apply(ana_result)
        elif method == 'inverse':
            ana_result = self.inverse(**T1_ret)
            T2_ret = ana_result

        return T2_ret


class one_to_one:
    def __init__(self):
        self.eur_key = None

    def T1(self, apply_input):
        return T1(self, apply_input)

    def apply(self, x_chain, y_chain, normalize_header, target, mask):
        # normalize_header must be a data frame
        chain_tool = use_chain()
        target_x = chain_tool.forward(target, x_chain)
        if np.isnan(target_x):
            raise Exception('Target value not valid')
        else:
            x = chain_tool.forward(normalize_header, x_chain)
            y = chain_tool.forward(normalize_header, y_chain)
            valid_mask = (~np.isnan(x)) & (~np.isnan(y)) & np.array(mask, dtype=bool)
            multiplier = np.ones(x.shape)
            if valid_mask.sum() > 0:
                use_x = x[valid_mask]
                use_y = y[valid_mask]
                use_x_prime = target_x
                use_y_prime = use_y * use_x_prime / use_x
                if (use_y_prime < 0).sum() > 0:
                    raise Exception('target value invalid!')
                else:
                    use_scale_eur = chain_tool.backward(use_y_prime, target, y_chain)
                    use_orig_eur = np.array(normalize_header.loc[valid_mask, self.eur_key])
                    multiplier[valid_mask] = use_scale_eur / use_orig_eur

            multiplier[np.isnan(multiplier)] = 1
            multiplier[np.isinf(multiplier)] = 1
            multiplier[multiplier <= 0] = 1
            adjusted_header = deepcopy(normalize_header)
            for k in target.keys():
                adjusted_header[k] = target[k]

            adjusted_header[self.eur_key] = normalize_header[self.eur_key] * multiplier

            return {'adjusted_headers': adjusted_header, 'multipliers': multiplier}

    def inverse(self, x_chain, y_chain, normalize_header, target, mask):
        chain_tool = use_chain()
        target_x = chain_tool.forward(target, x_chain)
        target_y = chain_tool.forward(target, y_chain)
        if np.isnan(target_x) | np.isnan(target_y):
            raise Exception('Target value not valid')
        else:
            x = chain_tool.forward(normalize_header, x_chain)
            multiplier = np.ones(x.shape)
            valid_mask = np.array(mask, dtype=bool) & (~np.isnan(x))
            if np.sum(valid_mask):
                use_x = x[valid_mask]
                base_x = target_x
                base_y = target_y

                use_y = base_y * use_x / base_x
                if (use_y < 0).sum() > 0:
                    raise Exception('target value invalid!')
                else:
                    use_eur = chain_tool.backward(use_y, normalize_header.loc[valid_mask, :], y_chain)
                    multiplier[valid_mask] = use_eur / target[self.eur_key]

            multiplier[np.isnan(multiplier)] = 1
            multiplier[np.isinf(multiplier)] = 1
            multiplier[multiplier <= 0] = 1
            return multiplier

    def T2_apply(self, ana_result):
        return T2_apply(ana_result)

    def body(self, input_dict, method):
        T1_ret = self.T1(input_dict)
        if method == 'apply':
            ana_result = self.apply(**T1_ret)
            T2_ret = self.T2_apply(ana_result)
        elif method == 'inverse':
            ana_result = self.inverse(**T1_ret)
            T2_ret = ana_result

        return T2_ret


# y = a * x^b
class power_law:
    def __init__(self):
        self.eur_key = None

    def T1(self, apply_input):
        return T1(self, apply_input)

    def fit(self, x_chain, y_chain, normalize_header, mask_fit):
        chain_tool = use_chain()
        x = chain_tool.forward(normalize_header, x_chain)
        y = chain_tool.forward(normalize_header, y_chain)
        if (x.shape[0] == 0) or (y.shape[0] == 0):
            return 0, 0

        valid_mask = (x > 0) & (y > 0) & (~np.isnan(x)) & (~np.isnan(y)) & mask_fit
        if np.sum(valid_mask) <= 1:
            b = 0
            if np.isnan(y).all():
                a = 0
            else:
                a = np.nanmean(y)
        else:

            use_x = np.log(x[valid_mask])
            use_y = np.log(y[valid_mask])
            X = np.stack([np.ones(use_x.shape), use_x], axis=1)
            if ((X[:, 1] - X[0, 1]) == 0).all():
                b = 0
                a = np.mean(use_y)
            else:
                Y = use_y.reshape(-1, 1)
                A = np.matmul(X.transpose(), X)
                B = np.matmul(X.transpose(), Y)
                beta = np.linalg.solve(A, B)
                a = beta[0, 0]
                b = beta[1, 0]
                a = np.exp(a)

        return float(b), float(a)

    def apply(self, a, b, x_chain, y_chain, normalize_header, target, mask):
        # normalize_header must be a data frame
        chain_tool = use_chain()
        target_x = chain_tool.forward(target, x_chain)
        if np.isnan(target_x):
            raise Exception('Target value not valid')
        else:
            x = chain_tool.forward(normalize_header, x_chain)
            y = chain_tool.forward(normalize_header, y_chain)
            if (x.shape[0] == 0) or (y.shape[0] == 0):
                return {'adjusted_headers': normalize_header, 'multipliers': np.ones(x.shape)}

            valid_mask = (x > 0) & (y > 0) & (~np.isnan(x)) & (~np.isnan(y)) & np.array(mask, dtype=bool)
            multiplier = np.ones(x.shape)
            if np.sum(valid_mask) > 0:
                use_x = x[valid_mask]
                use_y = y[valid_mask]
                use_x_prime = target_x
                use_y_prime = a * (np.power(use_x_prime, b) - np.power(use_x, b)) + use_y

                scale_invalid_mask = use_y_prime <= 0

                use_y_prime[scale_invalid_mask] = use_y[scale_invalid_mask] * use_x_prime / use_x[scale_invalid_mask]
                use_scale_eur = chain_tool.backward(use_y_prime, target, y_chain)
                use_orig_eur = normalize_header.loc[valid_mask, self.eur_key]
                multiplier[valid_mask] = (use_scale_eur / use_orig_eur)
            multiplier[np.isnan(multiplier)] = 1
            multiplier[np.isinf(multiplier)] = 1
            multiplier[multiplier <= 0] = 1
            adjusted_header = deepcopy(normalize_header)
            for k in target.keys():
                adjusted_header[k] = target[k]

            adjusted_header[self.eur_key] = normalize_header[self.eur_key] * multiplier

            return {'adjusted_headers': adjusted_header, 'multipliers': multiplier}

    def T2_apply(self, ana_result):
        return T2_apply(ana_result)

    def inverse(self, a, b, x_chain, y_chain, normalize_header, target, mask):
        # target should have the eur for type curve
        # can not be directly taking reciprocal of the apply, because 'eur'
        # is not in the normalize_header
        chain_tool = use_chain()
        target_x = chain_tool.forward(target, x_chain)
        target_y = chain_tool.forward(target, y_chain)
        if np.isnan(target_x) | np.isnan(target_y):
            raise Exception('Target value not valid')
        else:
            x = chain_tool.forward(normalize_header, x_chain)
            multiplier = np.ones(x.shape)
            valid_mask = np.array(mask, dtype=bool) & (~np.isnan(x)) & (x > 0)
            if np.sum(valid_mask):
                use_x = x[valid_mask]
                base_x = target_x
                base_y = target_y
                use_y = a * (np.power(use_x, b) - np.power(base_x, b)) + base_y

                scale_invalid_mask = (use_y <= 0)
                use_y[scale_invalid_mask] = base_y * use_x[scale_invalid_mask] / base_x

                use_eur = chain_tool.backward(use_y, normalize_header.loc[valid_mask, :], y_chain)
                multiplier[valid_mask] = use_eur / target[self.eur_key]

            multiplier[np.isnan(multiplier)] = 1
            multiplier[np.isinf(multiplier)] = 1
            multiplier[multiplier <= 0] = 1
            return multiplier

    def body(self, input_dict, method):
        T1_ret = self.T1(input_dict)
        if method == 'fit':
            ana_result = self.fit(**T1_ret)
            T2_ret = ana_result
        elif method == 'apply':
            ana_result = self.apply(**T1_ret)
            T2_ret = self.T2_apply(ana_result)
        elif method == 'inverse':
            ana_result = self.inverse(**T1_ret)
            T2_ret = ana_result

        return T2_ret
