// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createReadStream } = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const FormData = require('form-data');

const getBufferFromStream = (stream) =>
	new Promise((resolve, reject) => {
		const chunks = [];
		stream.on('data', (data) => {
			chunks.push(data);
		});
		stream.on('end', () => {
			resolve(Buffer.concat(chunks));
		});
		stream.on('error', reject);
	});

const loadFormData = async (filePath, fileName) => {
	const stream = createReadStream(filePath);
	const buffer = await getBufferFromStream(stream);

	const form = new FormData();
	form.append(fileName, buffer);

	return form;
};

module.exports = { loadFormData };
