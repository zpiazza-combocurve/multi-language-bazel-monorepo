// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Destroyer } = require('./destroyer');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Executor, nameAttr } = require('./executor');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { getAutoIncrementedName } = require('../text');

const clone = (object) => JSON.parse(JSON.stringify(object));

module.exports = { clone, Destroyer, Executor, getAutoIncrementedName, nameAttr };
