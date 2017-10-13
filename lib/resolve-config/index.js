"use strict";

const compact            = require("es5-ext/array/#/compact")
    , objToArray         = require("es5-ext/object/to-array")
    , objMap             = require("es5-ext/object/map")
    , assignDeep         = require("es5-ext/object/assign-deep")
    , copyDeep           = require("es5-ext/object/copy-deep")
    , isValue            = require("es5-ext/object/is-value")
    , isObject           = require("es5-ext/object/is-object")
    , minimatch          = require("minimatch")
    , resolveTableConfig = require("./table");

const defaultTableConfig = resolveTableConfig();
module.exports = (resources, pluginConfig) => {
	if (!isValue(pluginConfig)) {
		pluginConfig = {};
	} else if (!isObject(pluginConfig)) {
		throw new Error(
			"Invalid 'dynamodbAutoscaling' configuration in serverless.yml. Expected an object"
		);
	}

	const resolvedPluginConfig = objMap(pluginConfig, config => resolveTableConfig(config));
	return Object.keys(resources)
		.map(resourceName => {
			const resource = resources[resourceName];
			if (resource.Type !== "AWS::DynamoDB::Table") return null;
			const configList = compact.call(
				objToArray(
					resolvedPluginConfig,
					(config, pattern) =>
						minimatch(resource.Properties.TableName, pattern) ? copyDeep(config) : null
				)
			);
			return {
				resource: { name: resourceName, value: resource },
				config: assignDeep({}, copyDeep(defaultTableConfig), ...configList)
			};
		})
		.filter(Boolean);
};
