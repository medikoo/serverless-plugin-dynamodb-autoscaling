"use strict";

const objForEach          = require("es5-ext/object/for-each")
    , isObject            = require("es5-ext/object/is-object")
    , isValue             = require("es5-ext/object/is-value")
    , resolveEntityConfig = require("./entity");

const entityDefaults = resolveEntityConfig(), defaults = { "*": entityDefaults };

const settingNames = new Set(Object.keys(entityDefaults).concat(Object.keys(entityDefaults.read)));

module.exports = config => {
	if (!isValue(config)) return defaults;
	if (!config) return false;
	if (!isObject(config)) return defaults;
	if (Object.keys(config).some(settingName => !settingNames.has(settingName))) {
		const indexesSettings = { "*": resolveEntityConfig(config["*"]) };
		objForEach(config, (indexSettings, indexName) => {
			if (indexName === "*") return;
			indexesSettings[indexName] = resolveEntityConfig(indexSettings);
		});
		return indexesSettings;
	}
	return { "*": resolveEntityConfig(config) };
};
