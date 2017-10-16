"use strict";

const compact       = require("es5-ext/array/#/compact")
    , assignDeep    = require("es5-ext/object/assign-deep")
    , copyDeep      = require("es5-ext/object/copy-deep")
    , isEmpty       = require("es5-ext/object/is-empty")
    , isValue       = require("es5-ext/object/is-value")
    , isObject      = require("es5-ext/object/is-object")
    , objToArray    = require("es5-ext/object/to-array")
    , objForEach    = require("es5-ext/object/for-each")
    , objMap        = require("es5-ext/object/map")
    , capitalize    = require("es5-ext/string/#/capitalize")
    , hyphenToCamel = require("es5-ext/string/#/hyphen-to-camel")
    , minimatch     = require("minimatch");

const dimensionDefaults = { minCapacity: 5, maxCapacity: 200, targetUsage: 0.75 }
    , entityDefaults = { read: dimensionDefaults, write: dimensionDefaults }
    , indexesDefaults = { "*": entityDefaults }
    , tableDefaults = { table: entityDefaults, indexes: indexesDefaults };

const entitySettingNames = new Set(
	Object.keys(entityDefaults).concat(Object.keys(entityDefaults.read))
);

const resolveIndexToken = indexName =>
	indexName ? capitalize.call(hyphenToCamel.call(indexName).replace(/[^a-zA-Z0-9]/g, "")) : "";

const scalingRoleResource = {
	Type: "AWS::IAM::Role",
	Properties: {
		AssumeRolePolicyDocument: {
			Version: "2012-10-17",
			Statement: [
				{
					Effect: "Allow",
					Principal: { Service: ["application-autoscaling.amazonaws.com"] },
					Action: ["sts:AssumeRole"]
				}
			]
		},
		Path: "/",
		Policies: [
			{
				PolicyName: "root",
				PolicyDocument: {
					Version: "2012-10-17",
					Statement: [
						{
							Effect: "Allow",
							Action: [
								"dynamodb:DescribeTable",
								"dynamodb:UpdateTable",
								"cloudwatch:PutMetricAlarm",
								"cloudwatch:DescribeAlarms",
								"cloudwatch:GetMetricStatistics",
								"cloudwatch:SetAlarmState",
								"cloudwatch:DeleteAlarms",
								"autoscaling:*"
							],
							Resource: "*"
						}
					]
				}
			}
		]
	}
};

module.exports = class ServerlessPluginDynamodbAutoscaling {
	constructor(serverless) {
		this.serverless = serverless;
		this.hooks = {
			"after:aws:package:finalize:mergeCustomProviderResources": this.configure.bind(this)
		};
	}
	get resources() {
		return this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
	}
	get pluginConfig() {
		const pluginConfig = this.serverless.service.custom.dynamodbAutoscaling;
		if (!isValue(pluginConfig)) return {};
		if (!isObject(pluginConfig)) {
			throw new Error(
				"Invalid 'dynamodbAutoscaling' configuration in serverless.yml. Expected an object"
			);
		}
		return pluginConfig;
	}
	configure() {
		Object.assign(this.resources, this.generateResources());
	}

	// Configuration resolution
	get config() {
		const resolvedPluginConfig = objMap(this.pluginConfig, config =>
			this.resolveTableConfig(config));
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
	}
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
	generateResources() {
		const addonResources = {};
		delete this.lastPolicyResourceName;
		for (const tableConfig of this.config) {
			if (tableConfig.config) {
				Object.assign(
					addonResources,
					this.generateTableResources(tableConfig.resource, tableConfig.config)
				);
			}
		}
		if (!isEmpty(addonResources)) addonResources.DynamodbAutoscalingRole = scalingRoleResource;
		return addonResources;
	}

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
					config.indexes[indexName] || config.indexes["*"],
					resource.name,
					indexName
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
		const resourceNamePrefix = `${ tableResourceName }${ resolveIndexToken(
			indexName
		) }${ modeCapitalized }`;

		const targetResourceName = `${ resourceNamePrefix }ScalableTarget`;
		const policyResourceName = `${ resourceNamePrefix }ScalingPolicy`;
		const resourceAddress = ["table", { Ref: tableResourceName }];
		if (indexName) resourceAddress.push("index", indexName);

		const resources = {
			[targetResourceName]: {
				Type: "AWS::ApplicationAutoScaling::ScalableTarget",
				Properties: {
					MaxCapacity: config.maxCapacity,
					MinCapacity: config.minCapacity,
					ResourceId: { "Fn::Join": ["/", resourceAddress] },
					RoleARN: { "Fn::GetAtt": "DynamodbAutoscalingRole.Arn" },
					ScalableDimension: `dynamodb:${ indexName
						? "index"
						: "table" }:${ modeCapitalized }CapacityUnits`,
					ServiceNamespace: "dynamodb"
				}
			},
			[policyResourceName]: {
				Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
				DependsOn: this.lastPolicyResourceName,
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
		this.lastPolicyResourceName = policyResourceName;
		return resources;
	}
};
