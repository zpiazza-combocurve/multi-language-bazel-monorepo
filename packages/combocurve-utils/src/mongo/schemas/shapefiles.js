// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const colorValidator = (v) => /^#([0-9a-f]{3}){1,2}$/i.test(v);

const ShapefileSchema = new Schema({
	active: { type: Boolean, default: false },
	color: { type: String, validate: colorValidator },
	name: String,
	description: { type: String },
	idShapefile: { type: String, required: true },
	label: { type: String, default: '' },
	opacity: { type: Number, default: 50 },
	position: { type: Number },
	projectIds: [String],
	shapeType: {
		type: String,
		required: true,
		// circle, line, fill and raster are kept for backwards compatibility, but new shapefiles should use the other types, which match the shapefile specification
		enum: ['POINT', 'POLYLINE', 'POLYGON', 'MULTIPOINT', 'circle', 'line', 'fill', 'raster'],
	},
	bbox: {
		type: [Number],
		validate: {
			validator: (v) => !v || v.length === 4,
			msg: (props) => `${props.path} must have length 4, got '${props.value}'`,
		},
		default: undefined,
	},
	shapesCount: Number,
	fields: [{ name: String, fieldType: { type: String, enum: ['string', 'number', 'boolean', 'date'] } }],
	gcpFolder: String,
	visibility: { type: [String], default: ['project'] },
	tooltipFields: [String],
	file: { type: Schema.ObjectId, ref: 'files' },
});

module.exports = { ShapefileSchema };
