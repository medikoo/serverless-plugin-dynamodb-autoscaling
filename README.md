[![*nix build status][nix-build-image]][nix-build-url]
[![Windows build status][win-build-image]][win-build-url]
[![Tests coverage][cov-image]][cov-url]
![Transpilation status][transpilation-image]
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
    Table1:
      Properties:
        TableName: tableName1
    Table2:
      Properties:
        TableName: tableName2
    Table3:
      Properties:
        TableName: 
          Fn::Sub: ${AWS::Region}-table
custom:
  dynamodbAutoscaling:
    tablesConfig:
      # Disable autoscaling for Table1 table entirely
      Table1: false

      # Disable autoscaling just for indexes of Table2 table
      Table2:
        indexes: false

      # Tweak minCapacity setting for all tables that start with Table
      # (glob patterns can be used)
      Table*:
        minCapacity: 10

      Table4:
        # Tweak maxCapacity setting for Table4 (just table)
        table:
          maxCapacity: 300
        # Tweak targetUsage setting for Table4 indexes
        indexes:
          targetUsage: 0.5

      Table5:
        indexes:
          # Do not autoscale index 'foo'
          foo: false

      Table6:
        indexes:
          # Do not autoscale any indexes but 'foo' and 'bar'
          "*": false
          foo: true
          bar:
            # Tweaking one of the configuration option will also whitelist the index
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

      # but enable for Table1
      Table1: true
```

##### Configurable settings:

- `maxCapacity` (defaults to `200`) refers to [`ScalableTarget.MaxCapacity`](http://docs.aws.amazon.com/ApplicationAutoScaling/latest/APIReference/API_RegisterScalableTarget.html#API_RegisterScalableTarget_RequestSyntax)
- `minCapacity` (defaults to `5`) refers to [`ScalableTarget.MinCapacity`](http://docs.aws.amazon.com/ApplicationAutoScaling/latest/APIReference/API_RegisterScalableTarget.html#API_RegisterScalableTarget_RequestSyntax)
- `targetUsage` (defaults to `0.75`) refers to [`ScalingPolicy.TargetTrackingScalingPolicyConfiguration.TargetValue`](http://docs.aws.amazon.com/ApplicationAutoScaling/latest/APIReference/API_TargetTrackingScalingPolicyConfiguration.html) (value is multiplied by `100` when assigned to `TargetValue` setting)

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

[nix-build-image]: https://semaphoreci.com/api/v1/medikoo-org/serverless-plugin-dynamodb-autoscaling/branches/master/shields_badge.svg
[nix-build-url]: https://semaphoreci.com/medikoo-org/serverless-plugin-dynamodb-autoscaling
[win-build-image]: https://ci.appveyor.com/api/projects/status/nn6s7mu5f9e14h6o?svg=true
[win-build-url]: https://ci.appveyor.com/project/medikoo/serverless-plugin-dynamodb-autoscaling
[cov-image]: https://img.shields.io/codecov/c/github/medikoo/serverless-plugin-dynamodb-autoscaling.svg
[cov-url]: https://codecov.io/gh/medikoo/serverless-plugin-dynamodb-autoscaling
[transpilation-image]: https://img.shields.io/badge/transpilation-free-brightgreen.svg
[npm-image]: https://img.shields.io/npm/v/serverless-plugin-dynamodb-autoscaling.svg
[npm-url]: https://www.npmjs.com/package/serverless-plugin-dynamodb-autoscaling
