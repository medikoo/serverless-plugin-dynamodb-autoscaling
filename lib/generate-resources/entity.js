"use strict";

const generateDimensionResources = require("./dimension");

module.exports = (config, tableResourceName, indexName) => {
	const resources = {};
	if (config.read) {
		Object.assign(
			resources,
			generateDimensionResources("read", config.read, tableResourceName, indexName)
		);
	}
	if (config.write) {
		Object.assign(
			resources,
			generateDimensionResources("write", config.write, tableResourceName, indexName)
		);
	}
	return resources;
};
