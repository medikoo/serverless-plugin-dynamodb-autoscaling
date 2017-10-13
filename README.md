[![Build status][circleci-image]][circleci-url]
[![Build status][appveyor-image]][appveyor-url]
[![Tests coverage][codecov-image]][codecov-url]

# serverless-plugin-dynamodb-autoscaling
## Automatic autoscaling configuration for DynamoDB tables
### Plugin for Serverless v1

Plugin searches for DynamoDB table resources within generated CloudFormation stack and adds to it eventual autoscaling resources configuration.

### Installation

	$ npm install serverless-plugin-dynamodb-autoscaling

### Configuration (within `serverless.yml`)

Activate plugin in `serverless.yml`

```yaml
plugins:
  - serverless-plugin-dynamodb-autoscaling
```

__By default autoscaling configuration is automatically applied to all preconfigured DynamoDB tables and all its eventual global secondary indexes.__

We can exclude individual tables or tweak their configuration via configuration within`serverless.yml` config:

```yaml
custom:
  dynamodbAutoscaling:
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

If you prefer _white list_ instead of _black list_ approach you can handle configuration as below

```yaml
custom:
  dynamodbAutoscaling:

    # Disable autoscaling for all
    "*": false

    # but enable for tableName1
    tableName1: true
```

The configurable settings:

- `maxCapacity` (defaults to `200`) refers to [`ScalableTarget.MaxCapacity`](http://docs.aws.amazon.com/ApplicationAutoScaling/latest/APIReference/API_RegisterScalableTarget.html#API_RegisterScalableTarget_RequestSyntax)
- `minCapacity` (defaults to `5`) refers to [`ScalableTarget.MinCapacity`](http://docs.aws.amazon.com/ApplicationAutoScaling/latest/APIReference/API_RegisterScalableTarget.html#API_RegisterScalableTarget_RequestSyntax)
- `targetUsage` (defaults to `0.75`) refers to [`ScalingPolicy.TargetTrackingScalingPolicyConfiguration.TargetValue`](http://docs.aws.amazon.com/ApplicationAutoScaling/latest/APIReference/API_TargetTrackingScalingPolicyConfiguration.html) (`targetUsage` value is multiplied by `100` when assigned to `TargetValue` setting)

### Tests

  $ npm test

[circleci-image]: https://img.shields.io/circleci/project/github/medikoo/serverless-plugin-dynamodb-autoscaling.svg
[circleci-url]: https://circleci.com/gh/medikoo/serverless-plugin-dynamodb-autoscaling
[appveyor-image]: https://img.shields.io/appveyor/ci/medikoo/serverless-plugin-dynamodb-autoscaling.svg
[appveyor-url]: https://ci.appveyor.com/project/medikoo/serverless-plugin-dynamodb-autoscaling
[codecov-image]: https://img.shields.io/codecov/c/github/medikoo/serverless-plugin-dynamodb-autoscaling.svg
[codecov-url]: https://codecov.io/gh/medikoo/serverless-plugin-dynamodb-autoscaling
