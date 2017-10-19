[![Build status][circleci-image]][circleci-url]
[![Build status][appveyor-image]][appveyor-url]
[![Tests coverage][codecov-image]][codecov-url]

# serverless-plugin-dynamodb-autoscaling
## Autoscaling configuration for DynamoDB tables of Serverless project

- __Convention over configuration__ approach - automatically discovers configured tables and adds scaling resources. Still it's possible to [fine tune](#tables-configuration) settings per specific tables or indexes, or switch completely to [white list apprach](#white-list-approach)
- __Resources savvy__ - if possible exiting IAM role is reused for scaling target resources. It's only mandatory `ScalableTarget` and `ScalingPolicy` that are added to cloudformation stack

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

#### Eventual IAM policy update race condition issue

If at first deployment you're faced with `Unable to assume IAM role` or `Role is missing the following permissions` error, it can be result of a race condition issue,described as following by AWS team:

_It's a known situation and confirmed by the internal team that manages CloudFormation that the propagation of IAM policies and resources might take longer than CloudFormation to launch the dependent resources. This race condition happens now and then, and unfortunately CloudFormation team is not able to determine programmatically when a role is effectively available in a region._

To workaround it, the stack just with IAM polices update (and no autoscaling resources yet) needs to be deployed first, and then further deployment may carry the autoscaling resources update.

To make handling of that case easier this plugin enables the IAM only deployment via `iamOnly` option.
Therefore you may refer to this option as one-time mean

```yaml
custom:
  dynamodbAutoscaling:
    iamOnly: true
```

#### Tables configuration

__By default autoscaling configuration is automatically applied to all preconfigured DynamoDB tables and all its eventual global secondary indexes.__

We can exclude individual tables or tweak their configuration via configuration within`serverless.yml` config:

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

##### White list approach

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

Configurable settings:

- `maxCapacity` (defaults to `200`) refers to [`ScalableTarget.MaxCapacity`](http://docs.aws.amazon.com/ApplicationAutoScaling/latest/APIReference/API_RegisterScalableTarget.html#API_RegisterScalableTarget_RequestSyntax)
- `minCapacity` (defaults to `5`) refers to [`ScalableTarget.MinCapacity`](http://docs.aws.amazon.com/ApplicationAutoScaling/latest/APIReference/API_RegisterScalableTarget.html#API_RegisterScalableTarget_RequestSyntax)
- `targetUsage` (defaults to `0.75`) refers to [`ScalingPolicy.TargetTrackingScalingPolicyConfiguration.TargetValue`](http://docs.aws.amazon.com/ApplicationAutoScaling/latest/APIReference/API_TargetTrackingScalingPolicyConfiguration.html) (value is multiplied by `100` when assigned to `TargetValue` setting)

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
