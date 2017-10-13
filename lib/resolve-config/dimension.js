"use strict";

const isValue  = require("es5-ext/object/is-value")
    , isObject = require("es5-ext/object/is-object");

const defaults = { minCapacity: 5, maxCapacity: 200, targetUsage: 0.75 };

module.exports = config => {
	if (!isValue(config)) return defaults;
	if (!config) return false;
	if (!isObject(config)) return defaults;
	return {
		minCapacity: config.minCapacity || defaults.minCapacity,
		maxCapacity: config.maxCapacity || defaults.maxCapacity,
		targetUsage: config.targetUsage || defaults.targetUsage
	};
};
