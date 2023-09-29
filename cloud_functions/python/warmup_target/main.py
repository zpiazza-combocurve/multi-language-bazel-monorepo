from flask import jsonify


def handle(request):
    return jsonify({'message': 'Warmup call received'}), 200
