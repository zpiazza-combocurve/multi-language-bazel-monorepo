const getValidAdjacentSegment = ({ segIdx, editSeries, dir, invalidNames = ['empty'] }) => {
	let curIdx = segIdx + dir;
	let adjacentSegment = editSeries[curIdx];
	while (adjacentSegment && invalidNames.includes(adjacentSegment.name)) {
		adjacentSegment = editSeries[(curIdx += dir)];
	}

	if (adjacentSegment) {
		return [adjacentSegment, curIdx];
	}
	throw new Error('No valid adjacent segments');
};

const checkAnchor = ({ adjacentSegment, segment, segIdx, maxIdx, dir }) => {
	if (adjacentSegment.name === 'empty') {
		throw new Error('Cannot anchor to empty segment');
	}
	if (segment.slope === 0) {
		throw new Error('Cannot anchor segment that is flat or shut-in');
	}
	if (dir < 0) {
		if (segIdx === 0) {
			throw new Error('No previous segments available');
		}
		if (segment.slope < 0 && adjacentSegment.q_end < segment.q_end) {
			throw new Error("Cannot anchor to previous segment whose q end is less than current segment's q end");
		}
		if (segment.slope > 0 && adjacentSegment.q_end > segment.q_end) {
			throw new Error("Cannot anchor to previous segment whose q end is greater than current segment's q end");
		}
	}

	if (dir > 0) {
		if (segIdx === maxIdx) {
			throw new Error('No following segments available');
		}
		if (segment.slope < 0 && adjacentSegment.q_start > segment.q_start) {
			throw new Error("Cannot anchor to next segment whose q start is greater than current segment's q start");
		}
		if (segment.slope > 0 && adjacentSegment.q_start < segment.q_start) {
			throw new Error("Cannot anchor to next segment whose q start is less than current segment's q start");
		}
	}
};

const checkConnect = ({ adjacentSegment, segment, segIdx, maxIdx, dir }) => {
	if (segment.name === 'empty') {
		throw new Error(`Cannot connect shut-in segment to ${dir < 0 ? 'previous' : 'next'} segment`);
	}
	if (segIdx === 0 && dir < 0) {
		throw new Error('There is no previous segment to connect to');
	}
	if (segIdx === maxIdx && dir > 0) {
		throw new Error('There is no following segment to connect to');
	}
	if (adjacentSegment.name === 'empty') {
		throw new Error('Cannot connect current segment to shut-in segment');
	}
};

const checkValidSegmentIndices = (segments) => {
	let hasInvalidSegmentIndices = false;

	segments.forEach((segment) => {
		const { start_idx, end_idx } = segment;
		if (!(Number.isInteger(start_idx) && Number.isInteger(end_idx))) {
			hasInvalidSegmentIndices = true;
		}
	});

	if (hasInvalidSegmentIndices) {
		throw new Error('Invalid segment start and end indices');
	}
	return true;
};

export { checkValidSegmentIndices, checkAnchor, checkConnect, getValidAdjacentSegment };
