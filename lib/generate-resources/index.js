"use strict";

const isEmpty                = require("es5-ext/object/is-empty")
    , generateTableResources = require("./table")
    , dimensionReset         = require("./dimension").reset;

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

module.exports = config => {
	const addonResources = {};
	dimensionReset();
	for (const tableConfig of config) {
		if (tableConfig.config) {
			Object.assign(
				addonResources,
				generateTableResources(tableConfig.resource, tableConfig.config)
			);
		}
	}
	if (!isEmpty(addonResources)) addonResources.DynamodbAutoscalingRole = scalingRoleResource;
	return addonResources;
};
