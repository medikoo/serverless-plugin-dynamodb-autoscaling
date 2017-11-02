[![Build status][circleci-image]][circleci-url]
[![Build status][appveyor-image]][appveyor-url]
[![Tests coverage][codecov-image]][codecov-url]
![Transpilation status][transpilation-image]
[![npm version][npm-image]][npm-url]

# serverless-plugin-dynamodb-autoscaling
## Autoscaling configuration for DynamoDB tables

- __Convention over configuration approach__ - Automatically discovers preconfigured tables and accompanies them with dedicated scaling resources. Configuration can be [fine tuned](#tables-configuration) addressing specific tables or indexes, or switched to [white list approach](#white-list-approach)
- __Resources savvy__ - Existing project's IAM role is reused for handling scaling target resources. It's only mandatory `ScalableTarget` and `ScalingPolicy` resources that are added to CloudFormation stack

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
Still if you need to fine tune configuration for some reason see [below section](#tables-configuration). Additionally if you approach any errors during CloudFormation deployment, refer to [troubleshooting](#troubleshooting)

#### Tables configuration

By default autoscaling configuration is automatically applied to all preconfigured DynamoDB tables and all its eventual global secondary indexes.

Still, we can exclude individual tables or tweak their configuration via configuration within`serverless.yml` config:

```yaml
custom:
  dynamodbAutoscaling:
    tablesConfig:
      # Disable autoscaling for tableName1 table entirely
      tableName1: false 

      # Disable autoscaling just for indexes of tableName2 table
      tableName2:
        indexes: false 

      # Tweak minCapacity setting for tableName3 (for both table and indexes)
      tableName3:
        minCapacity: 10

      tableName4:
        # Tweak maxCapacity setting for tableName4 (just table)
        table:
          maxCapacity: 300
        # Tweak targetUsage setting for tableName4 indexes
        indexes:
          targetUsage: 0.5

      tableName5:
        indexes:
          # Do not autoscale index 'foo'
          foo: false

      tableName6:
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

      # but enable for tableName1
      tableName1: true
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

[circleci-image]: https://img.shields.io/circleci/project/github/medikoo/serverless-plugin-dynamodb-autoscaling.svg
[circleci-url]: https://circleci.com/gh/medikoo/serverless-plugin-dynamodb-autoscaling
[appveyor-image]: https://img.shields.io/appveyor/ci/medikoo/serverless-plugin-dynamodb-autoscaling.svg
[appveyor-url]: https://ci.appveyor.com/project/medikoo/serverless-plugin-dynamodb-autoscaling
[codecov-image]: https://img.shields.io/codecov/c/github/medikoo/serverless-plugin-dynamodb-autoscaling.svg
[codecov-url]: https://codecov.io/gh/medikoo/serverless-plugin-dynamodb-autoscaling
[transpilation-image]: https://img.shields.io/badge/transpilation-free-brightgreen.svg
[npm-image]: https://img.shields.io/npm/v/serverless-plugin-dynamodb-autoscaling.svg
[npm-url]: https://www.npmjs.com/package/serverless-plugin-dynamodb-autoscaling
