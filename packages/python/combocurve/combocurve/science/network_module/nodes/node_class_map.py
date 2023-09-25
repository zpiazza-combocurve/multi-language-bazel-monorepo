from combocurve.science.network_module.nodes.node_models.well_group import WellGroup
from combocurve.science.network_module.nodes.node_models.econ_output import EconOutput

from combocurve.science.network_module.nodes.node_models.stream_nodes.associated_gas import AssociatedGas
from combocurve.science.network_module.nodes.node_models.stream_nodes.liquids_unloading import LiquidsUnloading
from combocurve.science.network_module.nodes.node_models.stream_nodes.oil_tank import OilTank
from combocurve.science.network_module.nodes.node_models.stream_nodes.flowback import Flowback
from combocurve.science.network_module.nodes.node_models.stream_nodes.custom_calculation import (
    CustomCalculation, calculate_custom_calculation_as_facility_node)

from combocurve.science.network_module.nodes.node_models.development_nodes.drilling import Drilling
from combocurve.science.network_module.nodes.node_models.development_nodes.completion import Completion

from combocurve.science.network_module.nodes.node_models.emission_nodes.atmosphere import Atmosphere
from combocurve.science.network_module.nodes.node_models.emission_nodes.capture import Capture
from combocurve.science.network_module.nodes.node_models.emission_nodes.flare import Flare

from combocurve.science.network_module.nodes.node_models.facility_nodes.combustion import calculate_combustion
## they are too long for line length requirement
from .node_models.facility_nodes.pneumatic_device import calculate_pneumatic_device
from .node_models.facility_nodes.pneumatic_pump import calculate_pneumatic_pump
from .node_models.facility_nodes.centrifugal_compressor import calculate_centrifugal_compressor
from .node_models.facility_nodes.reciprocating_compressor import calculate_reciprocating_compressor

NODE_CLASS_MAP = {
    'well_group': WellGroup,
    'liquids_unloading': LiquidsUnloading,
    'associated_gas': AssociatedGas,
    'flare': Flare,
    'oil_tank': OilTank,
    'econ_output': EconOutput,
    'atmosphere': Atmosphere,
    'drilling': Drilling,
    'completion': Completion,
    'flowback': Flowback,
    'capture': Capture,
    'custom_calculation': CustomCalculation
}

FACILITY_NODES_EMISSION_CALCULATION = {
    'combustion': calculate_combustion,
    'pneumatic_device': calculate_pneumatic_device,
    'pneumatic_pump': calculate_pneumatic_pump,
    'centrifugal_compressor': calculate_centrifugal_compressor,
    'reciprocating_compressor': calculate_reciprocating_compressor,
    'custom_calculation': calculate_custom_calculation_as_facility_node
}

FACILITY_ONLY_NODES = [
    'combustion',
    'pneumatic_device',
    'pneumatic_pump',
    'centrifugal_compressor',
    'reciprocating_compressor',
]
