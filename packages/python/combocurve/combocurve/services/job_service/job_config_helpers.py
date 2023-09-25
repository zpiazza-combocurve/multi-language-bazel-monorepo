# k8s node affinity resource: https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/

# default node affinity is set in econ_job.yaml and carbon_job.yaml
PREFER_MEDIUM_POOL = {
    'preferredDuringSchedulingIgnoredDuringExecution': [{
        'weight': 1,
        'preference': {
            'matchExpressions': [{
                'key': 'size',
                'operator': 'In',
                'values': ['medium']
            }]
        }
    }]
}

REQUIRE_MEDIUM_POOL = {
    'requiredDuringSchedulingIgnoredDuringExecution': {
        'nodeSelectorTerms': [{
            'matchExpressions': [{
                'key': 'size',
                'operator': 'In',
                'values': ['medium']
            }]
        }]
    }
}

REQUIRE_LARGE_POOL = {
    'requiredDuringSchedulingIgnoredDuringExecution': {
        'nodeSelectorTerms': [{
            'matchExpressions': [{
                'key': 'size',
                'operator': 'In',
                'values': ['large']
            }]
        }]
    }
}

# request >50% of medium node resources and limit up to 90% of medium node resources
medium_pool_resources = {'requests': {'cpu': '16', 'memory': '128Gi'}, 'limits': {'cpu': '28.8', 'memory': '230.4Gi'}}

# request and limit near 100% or large node resources
large_pool_resources = {'requests': {'cpu': '50', 'memory': '400Gi'}, 'limits': {'cpu': '50', 'memory': '400Gi'}}
