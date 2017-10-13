"use strict";

const isObject               = require("es5-ext/object/is-object")
    , isValue                = require("es5-ext/object/is-value")
    , resolveDimensionConfig = require("./dimension");

const dimensionDefaults = resolveDimensionConfig();
const defaults = { read: dimensionDefaults, write: dimensionDefaults };

module.exports = config => {
	if (!isValue(config)) return defaults;
	if (!config) return false;
	if (!isObject(config)) return defaults;
	if (!isValue(config.read) && !isValue(config.write)) {
		const dimensionSettings = resolveDimensionConfig(config);
		return { read: dimensionSettings, write: dimensionSettings };
	}
	return {
		read: resolveDimensionConfig(config.read),
		write: resolveDimensionConfig(config.write)
	};
};
