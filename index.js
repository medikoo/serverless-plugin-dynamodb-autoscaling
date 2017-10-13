"use strict";

const resolveConfig     = require("./lib/resolve-config")
    , generateResources = require("./lib/generate-resources");

module.exports = class ServerlessPluginDynamodbAutoscaling {
	constructor(serverless) {
		this.hooks = {
			"after:aws:package:finalize:mergeCustomProviderResources": () => {
				const resources =
					serverless.service.provider.compiledCloudFormationTemplate.Resources;
				Object.assign(
					resources,
					generateResources(
						resolveConfig(resources, serverless.service.custom.dynamodbAutoscaling)
					)
				);
			}
		};
	}
};
