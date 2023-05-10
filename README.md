[![Build status][build-image]][build-url]
[![Tests coverage][cov-image]][cov-url]
[![npm version][npm-image]][npm-url]

# serverless-plugin-dynamodb-autoscaling

## Autoscaling configuration for DynamoDB tables

- **Convention over configuration approach** - Automatically discovers preconfigured tables and accompanies them with dedicated scaling resources. Configuration can be [fine tuned](#tables-configuration) addressing specific tables or indexes, or switched to [white list approach](#white-list-approach)
- **Resources savvy** - Existing project's IAM role is reused for handling scaling target resources. It's only mandatory `ScalableTarget` and `ScalingPolicy` resources that are added to CloudFormation stack

### Installation

```bash
npm install serverless-plugin-dynamodb-autoscaling
```

### Configuration

Activate plugin in `serverless.yml`

```yaml
plugins:
  - serverless-plugin-dynamodb-autoscaling
```

In most cases it's all you need to have autoscaling resources configured.
Still if you need to fine tune configuration for some reason see [tables](#tables-configuration) and [IAM role](#iam-role-configuration) configuration. Additionally if you approach any errors during CloudFormation deployment, refer to [troubleshooting](#troubleshooting)

#### Tables configuration

By default autoscaling configuration is automatically applied to all preconfigured DynamoDB tables and all its eventual global secondary indexes.

Still, we can exclude individual tables or tweak their configuration via configuration within`serverless.yml` config:

```yaml
resources:
  Resources:
    SomeTable1:
      Properties:
        TableName: foo
    SomeTable2:
      Properties:
        TableName: bar
    SomeTable3:
      Properties:
        TableName:
          Fn::Sub: ${AWS::Region}-test
custom:
  dynamodbAutoscaling:
    tablesConfig:
      # Disable autoscaling for table referenced by "SomeTable1" resource name
      SomeTable1: false

      # Disable autoscaling just for indexes of "SomeTable2" table
      SomeTable2:
        indexes: false

      # Tweak minCapacity setting for all tables of which resource names start with SomeTable
      # (glob patterns can be used)
      SomeTable*:
        minCapacity: 10

      SomeTable4:
        # Tweak maxCapacity setting for table referenced by "SomeTable4" (just table)
        table:
          maxCapacity: 300
        # Tweak targetUsage setting for SomeTable4 indexes
        indexes:
          targetUsage: 0.5

      SomeTable5:
        indexes:
          # Do not autoscale index 'foo'
          foo: false

      SomeTable6:
        indexes:
          # Do not autoscale any indexes but 'someIndex1' and 'someIndex2'
          "*": false
          someIndex1: true
          someIndex2:
            # Tweaking any of the configuration option will also whitelist the index
            minCapacity: 100
```

###### White list approach

If you prefer _white list_ instead of _black list_ approach you can handle configuration as below

```yaml
custom:
  dynamodbAutoscaling:
    tablesConfig:
      # Disable autoscaling for all
      "*": false

      # but enable for table referenced by resource name "SomeTable1"
      SomeTable1: true
```

##### Configurable settings:

- `maxCapacity` (defaults to `200`) refers to [`ScalableTarget.MaxCapacity`](https://docs.aws.amazon.com/autoscaling/application/APIReference/API_ScalableTarget.html)
- `minCapacity` (defaults to `5`) refers to [`ScalableTarget.MinCapacity`](https://docs.aws.amazon.com/autoscaling/application/APIReference/API_ScalableTarget.html)
- `targetUsage` (defaults to `0.75`) refers to [`ScalingPolicy.TargetTrackingScalingPolicyConfiguration.TargetValue`](https://docs.aws.amazon.com/autoscaling/application/APIReference/API_TargetTrackingScalingPolicyConfiguration.html) (value is multiplied by `100` when assigned to `TargetValue` setting)
- `scaleInCooldown` (defaults to `60`) refers to [`ScalingPolicy.TargetTrackingScalingPolicyConfiguration.ScaleInCooldown`](https://docs.aws.amazon.com/autoscaling/application/APIReference/API_TargetTrackingScalingPolicyConfiguration.html)
- `scaleOutCooldown` (defaults to `60`) refers to [`ScalingPolicy.TargetTrackingScalingPolicyConfiguration.ScaleOutCooldown`](https://docs.aws.amazon.com/autoscaling/application/APIReference/API_TargetTrackingScalingPolicyConfiguration.html)

#### `ScalingPolicy` chaining

By default `ScalingPolicy` resources are chained via `DependsOn` property, so they're deployed sequentially and not in parallel. It's to avoid reaching eventual CloudWatch rate limits.

Still it has a downside of slowing down the deployment. If number of tables in your stack is not large, or you've lifted rate limits on AWS side, then you can safely turn off that option to ensure more robust deployments:

```yaml
custom:
  dynamodbAutoscaling:
    chainScalingPolicies: false
```

#### IAM role configuration

By default existing lambda IAM role is reused (if recognized) or new dedicated IAM role is created.
Still it's possible to handle IAM configuration outside of this plugin, for that just pass ARN of externally configured IAM role via `iamRoleArn` setting:

```yaml
custom:
  dynamodbAutoscaling:
    iamRoleArn: "arn-of-iam-role-to-handle-tables"
```

### Troubleshooting

#### Eventual IAM policy update race condition issue

If at first deployment you're faced with one of the following errors:

- `Unable to assume IAM role`
- `Role is missing the following permissions`
- `The security token included in the request is invalid`

It can be result of a race condition issue described as following by AWS team:

_It's a known situation and confirmed by the internal team that manages CloudFormation that the propagation of IAM policies and resources might take longer than CloudFormation to launch the dependent resources. This race condition happens now and then, and unfortunately CloudFormation team is not able to determine programmatically when a role is effectively available in a region._

To workaround it, the stack with just IAM polices update (and no autoscaling resources yet) needs to be deployed first, and then further deployment may carry the autoscaling resources update (unfortunately just relying on `DependsOn` brings no rescue)

To make handling of that case easier this plugin enables the IAM only deployment via `iamOnly` option, you may refer to this option as one-time mean

```yaml
custom:
  dynamodbAutoscaling:
    iamOnly: true
```

### Tests

```bash
npm test
```

[build-image]: https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/workflows/Integrate/badge.svg
[build-url]: https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/actions?query=workflow%3AIntegrate
[cov-image]: https://img.shields.io/codecov/c/github/medikoo/serverless-plugin-dynamodb-autoscaling.svg
[cov-url]: https://codecov.io/gh/medikoo/serverless-plugin-dynamodb-autoscaling
[npm-image]: https://img.shields.io/npm/v/serverless-plugin-dynamodb-autoscaling.svg
[npm-url]: https://www.npmjs.com/package/serverless-plugin-dynamodb-autoscaling
