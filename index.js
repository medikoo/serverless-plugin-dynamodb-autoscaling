"use strict";

const resolveConfig     = require("./lib/resolve-config")
    , generateResources = require("./lib/generate-resources");

module.exports = class ServerlessPluginDynamodbAutoscaling {
	constructor(serverless) {
		this.serverless = serverless;
		this.hooks = {
			"after:aws:package:finalize:mergeCustomProviderResources": this.configure.bind(this)
		};
	}
	configure() {
		const resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
		Object.assign(
			resources,
			generateResources(
				resolveConfig(resources, this.serverless.service.custom.dynamodbAutoscaling)
			)
		);
	}
};
