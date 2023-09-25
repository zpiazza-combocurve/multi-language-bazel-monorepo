// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const SessionSchema = Schema({}, { strict: false, minimize: false, _id: false });

module.exports = { SessionSchema };
