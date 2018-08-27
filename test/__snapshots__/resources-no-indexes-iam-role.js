"use strict";

module.exports = {
	EnterpriseBookingsReadScalableTarget: {
		Type: "AWS::ApplicationAutoScaling::ScalableTarget",
		Properties: {
			MaxCapacity: 200,
			MinCapacity: 5,
			ResourceId: {
				"Fn::Join": [
					"/",
					[
						"table",
						{
							Ref: "EnterpriseBookings"
						}
					]
				]
			},
			RoleARN: "autoscaling-role-arn",
			ScalableDimension: "dynamodb:table:ReadCapacityUnits",
			ServiceNamespace: "dynamodb"
		}
	},
	EnterpriseBookingsReadScalingPolicy: {
		Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
		DependsOn: undefined,
		Properties: {
			PolicyName: "ReadAutoScalingPolicy",
			PolicyType: "TargetTrackingScaling",
			ScalingTargetId: {
				Ref: "EnterpriseBookingsReadScalableTarget"
			},
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
	EnterpriseBookingsWriteScalableTarget: {
		Type: "AWS::ApplicationAutoScaling::ScalableTarget",
		Properties: {
			MaxCapacity: 200,
			MinCapacity: 5,
			ResourceId: {
				"Fn::Join": [
					"/",
					[
						"table",
						{
							Ref: "EnterpriseBookings"
						}
					]
				]
			},
			RoleARN: "autoscaling-role-arn",
			ScalableDimension: "dynamodb:table:WriteCapacityUnits",
			ServiceNamespace: "dynamodb"
		}
	},
	EnterpriseBookingsWriteScalingPolicy: {
		Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
		DependsOn: "EnterpriseBookingsReadScalingPolicy",
		Properties: {
			PolicyName: "WriteAutoScalingPolicy",
			PolicyType: "TargetTrackingScaling",
			ScalingTargetId: {
				Ref: "EnterpriseBookingsWriteScalableTarget"
			},
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
