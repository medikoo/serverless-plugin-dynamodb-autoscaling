"use strict";

const generateEntityResources = require("./entity");

module.exports = (resource, config) => {
	const resources = {};
	if (config.table) {
		Object.assign(resources, generateEntityResources(config.table, resource.name));
	}
	if (!config.indexes) return resources;
	const globalSecondaryIndexes = resource.value.Properties.GlobalSecondaryIndexes;
	if (!Array.isArray(globalSecondaryIndexes)) return resources;
	for (const index of globalSecondaryIndexes) {
		const indexName = index.IndexName;
		Object.assign(
			resources,
			generateEntityResources(
				config.indexes[indexName] || config.indexes["*"],
				resource.name,
				indexName
			)
		);
	}
	return resources;
};
