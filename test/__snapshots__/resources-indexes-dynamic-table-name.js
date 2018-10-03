"use strict";

module.exports = {
    DynamicTableReadScalableTarget: {
      Type: "AWS::ApplicationAutoScaling::ScalableTarget",
      Properties: {
        MaxCapacity: 5,
        MinCapacity: 5,
        ResourceId: {
          "Fn::Join": [
            "/",
            [
              "table",
              {
                Ref: "DynamicTable"
              }
            ]
          ]
        },
        RoleARN: {
          "Fn::GetAtt": "DynamodbAutoscalingRole.Arn"
        },
        ScalableDimension: "dynamodb:table:ReadCapacityUnits",
        ServiceNamespace: "dynamodb"
      }
    },
    DynamicTableReadScalingPolicy: {
      Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
      DependsOn: undefined,
      Properties: {
        PolicyName: "ReadAutoScalingPolicy",
        PolicyType: "TargetTrackingScaling",
        ScalingTargetId: {
          Ref: "DynamicTableReadScalableTarget"
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
    DynamicTableWriteScalableTarget: {
      Type: "AWS::ApplicationAutoScaling::ScalableTarget",
      Properties: {
        MaxCapacity: 5,
        MinCapacity: 5,
        ResourceId: {
          "Fn::Join": [
            "/",
            [
              "table",
              {
                Ref: "DynamicTable"
              }
            ]
          ]
        },
        RoleARN: {
          "Fn::GetAtt": "DynamodbAutoscalingRole.Arn"
        },
        ScalableDimension: "dynamodb:table:WriteCapacityUnits",
        ServiceNamespace: "dynamodb"
      }
    },
    DynamicTableWriteScalingPolicy: {
      Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
      DependsOn: "DynamicTableReadScalingPolicy",
      Properties: {
        PolicyName: "WriteAutoScalingPolicy",
        PolicyType: "TargetTrackingScaling",
        ScalingTargetId: {
          Ref: "DynamicTableWriteScalableTarget"
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
