// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ignoreIndexNotFound, ignoreCollectionNotFound } = require('../services/helpers/mongo');

const OLD_ID_SHAPEFILE_INDEX = 'idShapefile_1';

async function up({ db }) {
	const shapefilesCollection = db.collection('shapefiles');
	await ignoreCollectionNotFound(() =>
		ignoreIndexNotFound(() => shapefilesCollection.dropIndex(OLD_ID_SHAPEFILE_INDEX))
	);
}

module.exports = { up, uses: ['mongodb'] };
