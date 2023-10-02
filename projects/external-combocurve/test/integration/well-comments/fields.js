const toApiWellComment = (wellComment) => ({
	commentedAt: wellComment.createdAt,
	commentedBy: wellComment.createdBy,
	forecast: wellComment.forecast && wellComment.forecast.toString(),
	project: wellComment.project && wellComment.project.toString(),
	text: wellComment.text,
	well: wellComment.well.toString(),
});

module.exports = {
	toApiWellComment,
};
