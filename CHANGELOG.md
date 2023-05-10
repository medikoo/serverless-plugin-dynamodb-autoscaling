# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.1.1](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/compare/v3.1.0...v3.1.1) (2023-05-10)

### Maintenance Improvements

- Confirm compatibitlity with versions v2 and v3 of the Framework ([644a952](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/644a95267136c5fec73c42c223b699a04d25550b))

<a name="3.1.0"></a>

# [3.1.0](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/compare/v3.0.0...v3.1.0) (2019-01-22)

### Features

- make ScaleInCooldown and ScaleOutCooldown configurable ([fd3e365](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/fd3e365))

<a name="3.0.0"></a>

# [3.0.0](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/compare/v2.2.0...v3.0.0) (2018-10-22)

### Features

- address tables by resource names in custom config ([286f1d5](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/286f1d5))

### BREAKING CHANGES

- Tables in configuration should now be addressed by CloudFormation resource name and not as it was so far table name (as passed in `TableName` property)

<a name="2.2.0"></a>

# [2.2.0](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/compare/v2.1.1...v2.2.0) (2018-08-28)

### Features

- added iamRole option ([dfbdb84](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/dfbdb84))

<a name="2.1.1"></a>

## [2.1.1](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/compare/v2.1.0...v2.1.1) (2018-02-08)

### Bug Fixes

- support serverless.yml with no custom block ([f412fd1](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/f412fd1))

<a name="2.1.0"></a>

# [2.1.0](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/compare/v2.0.3...v2.1.0) (2017-10-30)

### Features

- Allow to surpass ScalingPolicy chaining ([5812ca1](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/5812ca1))

<a name="2.0.3"></a>

## [2.0.3](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/compare/v2.0.2...v2.0.3) (2017-10-23)

### Bug Fixes

- remove not necessary "autoscaling:\*" policy ([4e4a2ac](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/4e4a2ac))

<a name="2.0.2"></a>

## [2.0.2](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/compare/v2.0.1...v2.0.2) (2017-10-20)

### Bug Fixes

- ensure to grant "autoscaling:\*" rights ([f01ca10](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/f01ca10))

<a name="2.0.1"></a>

## [2.0.1](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/compare/v2.0.0...v2.0.1) (2017-10-20)

### Bug Fixes

- generalize cloudwatch resources access ([7f8b302](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/7f8b302))

<a name="2.0.0"></a>

# [2.0.0](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/compare/v1.0.1...v2.0.0) (2017-10-19)

### Bug Fixes

- narrow policy range ([7117722](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/7117722))
- remove "autoscaling:\*" policy from role ([5da01d0](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/5da01d0))

### Features

- allow non tables config related plugin settings ([5e29f67](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/5e29f67))
- apply policies unconditionally ([b0bffa7](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/b0bffa7))
- iamOnly option to address CF race condition ([7286716](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/7286716))
- improve IAM role handling ([193c55d](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/193c55d))
- reuse lambda role ([68ff842](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/68ff842))

### BREAKING CHANGES

- tables config was additionally nested with plugin settings at `tablesConfig` property.

Before:
custom:
dynamodbAutoscaling:
someTable: false

After:
custom:
dynamodbAutoscaling:
tablesConfig:
someTable: false

<a name="1.0.1"></a>

## [1.0.1](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/compare/v1.0.0...v1.0.1) (2017-10-16)

<a name="1.0.0"></a>

# 1.0.0 (2017-10-13)

### Bug Fixes

- CloudFormation no value handling ([16fa1ad](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/16fa1ad))
