"use strict";

const capitalize    = require("es5-ext/string/#/capitalize")
    , hyphenToCamel = require("es5-ext/string/#/hyphen-to-camel");

let lastPolicyResourceName = null;
const resolveIndexToken = indexName =>
	indexName ? capitalize.call(hyphenToCamel.call(indexName).replace(/[^a-zA-Z0-9]/g, "")) : "";

module.exports = (mode, config, tableResourceName, indexName = null) => {
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
			DependsOn: lastPolicyResourceName,
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
	lastPolicyResourceName = policyResourceName;
	return resources;
};

module.exports.reset = () => lastPolicyResourceName = null;
