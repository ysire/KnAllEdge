var mongoose = require('mongoose');

/* SCHEMA */
var whoAmISchema = mongoose.Schema({
	firstname: String,
	familyname: String,
	e_mail: String,
	passw: String,
	displayName: String,
	gender: { type: Number, default: 0 }, //0-undefined, 1-female, 2-male
	birthday: Date,
	coordX: Number,
	coordY: Number,
	locationType: Number,
	mySearchAreaVisible: { type: Boolean, default: true },
	myLocationVisible: { type: Boolean, default: true },
	accessedAt: Date,
	locationUpdatedAt: Date,
	language: String,
	origin: String,
	extensions: {
		contacts:{}
	}
});

var pluginAuditing = require('./pluginAuditing');
whoAmISchema.plugin(pluginAuditing, {});

exports.Schema = whoAmISchema;