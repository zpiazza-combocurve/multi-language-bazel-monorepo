def get_proper_qualifier_for_add_ons(df, index, section_index, qualifier_index, name):
    '''
    Changes the name of the Qualifier to the Sidefile, Lookup, or external file name,
    Does not change the name for forecast/stream properties section as that will lead to several issues related
    to mixing of rate forecast and ratio forecast
    '''
    try:
        section = int(float(df[index, section_index]))
    except ValueError:
        section = None
    if section == 4:
        return df[index, qualifier_index]
    return name
