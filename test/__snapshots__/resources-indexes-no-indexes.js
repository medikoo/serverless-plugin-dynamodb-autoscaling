"use strict";

module.exports = {
	NextbikeCustomersReadScalableTarget: {
		Type: "AWS::ApplicationAutoScaling::ScalableTarget",
		Properties: {
			MaxCapacity: 200,
			MinCapacity: 5,
			ResourceId: { "Fn::Join": ["/", ["table", { Ref: "NextbikeCustomers" }]] },
			RoleARN: { "Fn::GetAtt": "DynamodbAutoscalingRole.Arn" },
			ScalableDimension: "dynamodb:table:ReadCapacityUnits",
			ServiceNamespace: "dynamodb"
		}
	},
	NextbikeCustomersReadScalingPolicy: {
		Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
		DependsOn: undefined,
		Properties: {
			PolicyName: "ReadAutoScalingPolicy",
			PolicyType: "TargetTrackingScaling",
			ScalingTargetId: { Ref: "NextbikeCustomersReadScalableTarget" },
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
	NextbikeCustomersWriteScalableTarget: {
		Type: "AWS::ApplicationAutoScaling::ScalableTarget",
		Properties: {
			MaxCapacity: 200,
			MinCapacity: 5,
			ResourceId: { "Fn::Join": ["/", ["table", { Ref: "NextbikeCustomers" }]] },
			RoleARN: { "Fn::GetAtt": "DynamodbAutoscalingRole.Arn" },
			ScalableDimension: "dynamodb:table:WriteCapacityUnits",
			ServiceNamespace: "dynamodb"
		}
	},
	NextbikeCustomersWriteScalingPolicy: {
		Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
		DependsOn: "NextbikeCustomersReadScalingPolicy",
		Properties: {
			PolicyName: "WriteAutoScalingPolicy",
			PolicyType: "TargetTrackingScaling",
			ScalingTargetId: { Ref: "NextbikeCustomersWriteScalableTarget" },
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
