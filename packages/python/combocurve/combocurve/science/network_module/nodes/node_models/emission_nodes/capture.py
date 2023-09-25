from combocurve.science.network_module.nodes.node_models.emission_nodes.atmosphere import Atmosphere


class Capture(Atmosphere):
    node_type = 'capture'
    multiplier = -1
    emission_type = 'capture'
