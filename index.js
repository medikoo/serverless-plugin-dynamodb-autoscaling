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
		this.resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
		this.userConfig = this.serverless.service.custom.dynamodbAutoscaling;
		Object.assign(
			this.resources,
			generateResources(resolveConfig(this.resources, this.userConfig))
		);
	}
};
