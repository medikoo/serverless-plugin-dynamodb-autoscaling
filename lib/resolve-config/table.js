"use strict";

const isObject             = require("es5-ext/object/is-object")
    , isValue              = require("es5-ext/object/is-value")
    , resolveEntityConfig  = require("./entity")
    , resolveIndexesConfig = require("./indexes");

const entityDefaults = resolveEntityConfig()
    , indexesDefaults = { "*": entityDefaults }
    , defaults = { table: entityDefaults, indexes: indexesDefaults };

module.exports = config => {
	if (!isValue(config)) return defaults;
	if (!config) return false;
	if (!isObject(config)) return defaults;
	if (!isValue(config.table) && !isValue(config.indexes)) {
		const entitySettings = resolveEntityConfig(config);
		return { table: entitySettings, indexes: { "*": entitySettings } };
	}
	return {
		table: resolveEntityConfig(config.table),
		indexes: resolveIndexesConfig(config.indexes)
	};
};
