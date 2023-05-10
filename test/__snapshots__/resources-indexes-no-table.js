"use strict";

module.exports = {
	NextbikeCustomersLoginkeyReadScalableTarget: {
		Type: "AWS::ApplicationAutoScaling::ScalableTarget",
		Properties: {
			MaxCapacity: 200,
			MinCapacity: 5,
			ResourceId: {
				"Fn::Join": ["/", ["table", { Ref: "NextbikeCustomers" }, "index", "loginkey"]]
			},
			RoleARN: { "Fn::GetAtt": "DynamodbAutoscalingRole.Arn" },
			ScalableDimension: "dynamodb:index:ReadCapacityUnits",
			ServiceNamespace: "dynamodb"
		}
	},
	NextbikeCustomersLoginkeyReadScalingPolicy: {
		Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
		DependsOn: undefined,
		Properties: {
			PolicyName: "ReadAutoScalingPolicy",
			PolicyType: "TargetTrackingScaling",
			ScalingTargetId: { Ref: "NextbikeCustomersLoginkeyReadScalableTarget" },
			TargetTrackingScalingPolicyConfiguration: {
				TargetValue: 75,
				ScaleInCooldown: 60,
				ScaleOutCooldown: 60,
				PredefinedMetricSpecification: {
					PredefinedMetricType: "DynamoDBReadCapacityUtilization"
				}
			}
		}
	},
	NextbikeCustomersLoginkeyWriteScalableTarget: {
		Type: "AWS::ApplicationAutoScaling::ScalableTarget",
		Properties: {
			MaxCapacity: 200,
			MinCapacity: 5,
			ResourceId: {
				"Fn::Join": ["/", ["table", { Ref: "NextbikeCustomers" }, "index", "loginkey"]]
			},
			RoleARN: { "Fn::GetAtt": "DynamodbAutoscalingRole.Arn" },
			ScalableDimension: "dynamodb:index:WriteCapacityUnits",
			ServiceNamespace: "dynamodb"
		}
	},
	NextbikeCustomersLoginkeyWriteScalingPolicy: {
		Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
		DependsOn: "NextbikeCustomersLoginkeyReadScalingPolicy",
		Properties: {
			PolicyName: "WriteAutoScalingPolicy",
			PolicyType: "TargetTrackingScaling",
			ScalingTargetId: { Ref: "NextbikeCustomersLoginkeyWriteScalableTarget" },
			TargetTrackingScalingPolicyConfiguration: {
				TargetValue: 75,
				ScaleInCooldown: 60,
				ScaleOutCooldown: 60,
				PredefinedMetricSpecification: {
					PredefinedMetricType: "DynamoDBWriteCapacityUtilization"
				}
			}
		}
	}
};
