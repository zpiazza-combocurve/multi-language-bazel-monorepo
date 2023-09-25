import pytest

from combocurve.shared.collections import first_increasing_sequence


@pytest.mark.unittest
def test_first_increasing_sequence():
    assert list(first_increasing_sequence(iter([1, 2, 3, 1]))) == [1, 2, 3]
    assert list(first_increasing_sequence(iter([1, 2, 3, 1, 2]))) == [1, 2, 3]
    assert list(first_increasing_sequence(iter([1, 3, 7, 13, 100, 2, 4, 200, 1, 2, 3]))) == [1, 3, 7, 13, 100]
    assert list(first_increasing_sequence(iter([1, 2, 3, 3, 4, 5]))) == [1, 2, 3]
    assert list(first_increasing_sequence(iter([3, 2, 1]))) == [3]
    assert list(first_increasing_sequence(iter([]))) == []
    assert list(first_increasing_sequence(iter([2]))) == [2]
