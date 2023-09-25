def check_near_equality(var1, var2, tolerance=5):
    """
    Check if two values are equal within range of tolerance

    Tolerance (%)
    var1, var2 (float)

    returns True(bool) if True and False if not
    """
    return_bool = False
    tolerance /= 100
    if (var1 >= var2 * (1 - tolerance)) and (var1 <= var2 * (1 + tolerance)):
        return_bool = True
    return return_bool
