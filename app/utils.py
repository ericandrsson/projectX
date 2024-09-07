def pb_to_dict(pb_object):
    """
    Convert a PocketBase object to a dictionary.
    """
    if not pb_object:
        return None
    
    result = {}
    for key in pb_object.__dict__:
        if not key.startswith('_'):  # Ignore private attributes
            value = getattr(pb_object, key)
            if hasattr(value, '__dict__'):  # Handle nested objects
                result[key] = pb_to_dict(value)
            else:
                result[key] = value
    return result