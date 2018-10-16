"use strict";

const compact       = require("es5-ext/array/#/compact")
    , assignDeep    = require("es5-ext/object/assign-deep")
    , copyDeep      = require("es5-ext/object/copy-deep")
    , isValue       = require("es5-ext/object/is-value")
    , isObject      = require("es5-ext/object/is-object")
    , objToArray    = require("es5-ext/object/to-array")
    , objForEach    = require("es5-ext/object/for-each")
    , objMap        = require("es5-ext/object/map")
    , capitalize    = require("es5-ext/string/#/capitalize")
    , hyphenToCamel = require("es5-ext/string/#/hyphen-to-camel")
    , d             = require("d")
    , lazy          = require("d/lazy")
    , minimatch     = require("minimatch");

const dimensionDefaults = { minCapacity: 5, maxCapacity: 200, targetUsage: 0.75 }
    , entityDefaults = { read: dimensionDefaults, write: dimensionDefaults }
    , indexesDefaults = { "*": entityDefaults }
    , tableDefaults = { table: entityDefaults, indexes: indexesDefaults };

const entitySettingNames = new Set(
	Object.keys(entityDefaults).concat(Object.keys(entityDefaults.read))
);

const resolveIndexToken = indexName =>
	indexName ? capitalize.call(hyphenToCamel.call(indexName).replace(/[^a-zA-Z0-9]/gu, "")) : "";

class ServerlessPluginDynamodbAutoscaling {
	constructor(serverless) {
		this.serverless = serverless;
		this.hooks = {
			"after:aws:package:finalize:mergeCustomProviderResources": this.configure.bind(this)
		};
	}
	configure() {
		if (!this.pluginConfig.iamRoleArn) {
			this.resources[this.iamRoleResourceId] = this.configureIamRole();
		}

		// IamOnly option offers workaround for race condition not handled as expected
		// by CloudFormation internals (more details on this case can be found in README.md)
		if (this.pluginConfig.iamOnly) return;

		Object.assign(this.resources, this.autoscalingResources);
	}

	// Configuration resolution
	resolveTableConfig(config) {
		if (!isValue(config)) return tableDefaults;
		if (!config) return false;
		if (!isObject(config)) return tableDefaults;
		if (!isValue(config.table) && !isValue(config.indexes)) {
			const entitySettings = this.resolveEntityConfig(config);
			return { table: entitySettings, indexes: { "*": entitySettings } };
		}
		return {
			table: this.resolveEntityConfig(config.table),
			indexes: this.resolveIndexesConfig(config.indexes)
		};
	}
	resolveIndexesConfig(config) {
		if (!isValue(config)) return indexesDefaults;
		if (!config) return false;
		if (!isObject(config)) return indexesDefaults;
		if (Object.keys(config).some(settingName => !entitySettingNames.has(settingName))) {
			const indexesSettings = { "*": this.resolveEntityConfig(config["*"]) };
			objForEach(config, (indexSettings, indexName) => {
				if (indexName === "*") return;
				indexesSettings[indexName] = this.resolveEntityConfig(indexSettings);
			});
			return indexesSettings;
		}
		return { "*": this.resolveEntityConfig(config) };
	}
	resolveEntityConfig(config) {
		if (!isValue(config)) return entityDefaults;
		if (!config) return false;
		if (!isObject(config)) return entityDefaults;
		if (!isValue(config.read) && !isValue(config.write)) {
			const dimensionSettings = this.resolveDimensionConfig(config);
			return { read: dimensionSettings, write: dimensionSettings };
		}
		return {
			read: this.resolveDimensionConfig(config.read),
			write: this.resolveDimensionConfig(config.write)
		};
	}
	resolveDimensionConfig(config) {
		if (!isValue(config)) return dimensionDefaults;
		if (!config) return false;
		if (!isObject(config)) return dimensionDefaults;
		return {
			minCapacity: config.minCapacity || dimensionDefaults.minCapacity,
			maxCapacity: config.maxCapacity || dimensionDefaults.maxCapacity,
			targetUsage: config.targetUsage || dimensionDefaults.targetUsage
		};
	}

	// Autoscaling resources generation
	generateTableResources(resource, config) {
		const resources = {};
		if (config.table) {
			Object.assign(resources, this.generateEntityResources(config.table, resource.name));
		}
		if (!config.indexes) return resources;
		const globalSecondaryIndexes = resource.value.Properties.GlobalSecondaryIndexes;
		if (!Array.isArray(globalSecondaryIndexes)) return resources;
		for (const index of globalSecondaryIndexes) {
			const indexName = index.IndexName;
			Object.assign(
				resources,
				this.generateEntityResources(
					config.indexes[indexName] || config.indexes["*"], resource.name, indexName
				)
			);
		}
		return resources;
	}
	generateEntityResources(config, tableResourceName, indexName = null) {
		const resources = {};
		if (config.read) {
			Object.assign(
				resources,
				this.generateDimensionResources("read", config.read, tableResourceName, indexName)
			);
		}
		if (config.write) {
			Object.assign(
				resources,
				this.generateDimensionResources("write", config.write, tableResourceName, indexName)
			);
		}
		return resources;
	}
	generateDimensionResources(mode, config, tableResourceName, indexName = null) {
		const modeCapitalized = capitalize.call(mode);
		const resourceNamePrefix = `${ tableResourceName }${ resolveIndexToken(indexName) }${
			modeCapitalized
		}`;

		const targetResourceName = `${ resourceNamePrefix }ScalableTarget`;
		const policyResourceName = `${ resourceNamePrefix }ScalingPolicy`;
		const resourceAddress = ["table", { Ref: tableResourceName }];
		if (indexName) resourceAddress.push("index", indexName);

		const roleARN = this.pluginConfig.iamRoleArn || {
			"Fn::GetAtt": `${ this.iamRoleResourceId }.Arn`
		};

		const resources = {
			[targetResourceName]: {
				Type: "AWS::ApplicationAutoScaling::ScalableTarget",
				Properties: {
					MaxCapacity: config.maxCapacity,
					MinCapacity: config.minCapacity,
					ResourceId: { "Fn::Join": ["/", resourceAddress] },
					RoleARN: roleARN,
					ScalableDimension: `dynamodb:${ indexName ? "index" : "table" }:${
						modeCapitalized
					}CapacityUnits`,
					ServiceNamespace: "dynamodb"
				}
			},
			[policyResourceName]: {
				Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
				DependsOn: this.lastPolicyResourceId,
				Properties: {
					PolicyName: `${ modeCapitalized }AutoScalingPolicy`,
					PolicyType: "TargetTrackingScaling",
					ScalingTargetId: { Ref: targetResourceName },
					TargetTrackingScalingPolicyConfiguration: {
						TargetValue: config.targetUsage * 100,
						ScaleInCooldown: 60,
						ScaleOutCooldown: 60,
						PredefinedMetricSpecification: {
							PredefinedMetricType: `DynamoDB${ modeCapitalized }CapacityUtilization`
						}
					}
				}
			}
		};
		if (this.pluginConfig.chainScalingPolicies) this.lastPolicyResourceId = policyResourceName;
		return resources;
	}

	// IAM Role customization
	configureIamRoleResourceDynamodbAction() {
		const statements = this.iamRoleResource.Properties.Policies[0].PolicyDocument.Statement;
		let dynamodbStatement = statements.find(statement => {
			if (statement.Action.some(action => action === "dynamodb:*")) return true;
			return (
				statement.Action.some(action => action === "dynamodb:DescribeTable") &&
				statement.Action.some(action => action === "dynamodb:UpdateTable")
			);
		});
		if (!dynamodbStatement) {
			statements.push(
				dynamodbStatement = {
					Effect: "Allow",
					Action: ["dynamodb:DescribeTable", "dynamodb:UpdateTable"],
					Resource: "arn:aws:dynamodb:*"
				}
			);
		}
	}
	configureIamRoleResourceCloudwatchAction() {
		const statements = this.iamRoleResource.Properties.Policies[0].PolicyDocument.Statement;
		let cloudwatchStatement = statements.find(statement =>
			statement.Action.some(action => action === "cloudwatch:*")
		);
		if (!cloudwatchStatement) {
			statements.push(
				cloudwatchStatement = { Effect: "Allow", Action: ["cloudwatch:*"], Resource: "*" }
			);
		}
	}
	configureIamRole() {
		this.configureIamRolePolicyDocument();
		this.configureIamRolePolicies();
		return this.iamRoleResource;
	}
	configureIamRolePolicyDocument() {
		const services = this.iamRoleResource.Properties.AssumeRolePolicyDocument.Statement[0]
			.Principal.Service;
		if (services.includes("application-autoscaling.amazonaws.com")) return;
		services.push("application-autoscaling.amazonaws.com");
	}
	configureIamRolePolicies() {
		this.configureIamRoleResourceDynamodbAction();
		this.configureIamRoleResourceCloudwatchAction();
	}
}

Object.defineProperties(
	ServerlessPluginDynamodbAutoscaling.prototype,
	lazy({
		resources: d(function () {
			return this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
		}),
		pluginConfig: d(function () {
			let pluginConfig = (this.serverless.service.custom || {}).dynamodbAutoscaling;
			if (!isValue(pluginConfig)) return { tablesConfig: {}, chainScalingPolicies: true };
			if (!isObject(pluginConfig)) {
				throw new Error(
					"Invalid 'dynamodbAutoscaling' configuration in serverless.yml. " +
						"Expected an object"
				);
			}
			pluginConfig = copyDeep(pluginConfig);
			if (!isValue(pluginConfig.tablesConfig)) {
				pluginConfig.tablesConfig = {};
			} else if (!isObject(pluginConfig.tablesConfig)) {
				throw new Error(
					"Invalid 'dynamodbAutoscaling.tablesConfig' configuration in serverless.yml. " +
						"Expected an object"
				);
			}
			if (!isValue(pluginConfig.chainScalingPolicies)) {
				pluginConfig.chainScalingPolicies = true;
			}
			return pluginConfig;
		}),
		tablesConfig: d(function () {
			const resolvedPluginConfig = objMap(this.pluginConfig.tablesConfig, config =>
				this.resolveTableConfig(config)
			);
			return Object.keys(this.resources)
				.map(resourceName => {
					const resource = this.resources[resourceName];
					if (resource.Type !== "AWS::DynamoDB::Table") return null;
					const configList = compact.call(
						objToArray(
							resolvedPluginConfig,
							(config, pattern) =>
								minimatch(resource.Properties.TableName, pattern)
									? copyDeep(config)
									: null
						)
					);
					return {
						resource: { name: resourceName, value: resource },
						config: assignDeep({}, copyDeep(tableDefaults), ...configList)
					};
				})
				.filter(Boolean);
		}),
		autoscalingResources: d(function () {
			const autoscalingResources = {};
			for (const tableConfig of this.tablesConfig) {
				if (tableConfig.config) {
					Object.assign(
						autoscalingResources,
						this.generateTableResources(tableConfig.resource, tableConfig.config)
					);
				}
			}
			return autoscalingResources;
		}),
		iamRoleResourceId: d(function () {
			return this.resources.IamRoleLambdaExecution
				? "IamRoleLambdaExecution"
				: "DynamodbAutoscalingRole";
		}),
		iamRoleResource: d(function () {
			const defaultRole = {
				Type: "AWS::IAM::Role",
				Properties: {
					AssumeRolePolicyDocument: {
						Version: "2012-10-17",
						Statement: [
							{
								Effect: "Allow",
								Principal: { Service: [] },
								Action: ["sts:AssumeRole"]
							}
						]
					},
					Path: "/",
					Policies: [
						{
							PolicyName: "root",
							PolicyDocument: { Version: "2012-10-17", Statement: [] }
						}
					]
				}
			};
			return (this.resources[this.iamRoleResourceId] =
				this.resources.IamRoleLambdaExecution
					? this.resources[this.iamRoleResourceId]
					: assignDeep({}, defaultRole, this.resources[this.iamRoleResourceId] || {})
			);
		})
	})
);

module.exports = ServerlessPluginDynamodbAutoscaling;
