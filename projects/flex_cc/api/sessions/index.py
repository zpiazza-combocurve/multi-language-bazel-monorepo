class SessionService(object):
    def __init__(self, context):
        self.context = context

    def get_session(self, _id):
        session = self.context.session_collection.find_one({'_id': _id})
        return {} if session is None else session['session']
