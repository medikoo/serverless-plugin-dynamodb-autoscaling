# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="2.0.1"></a>
## [2.0.1](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/compare/v2.0.0...v2.0.1) (2017-10-20)


### Bug Fixes

* generalize cloudwatch resources access ([7f8b302](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/7f8b302))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/compare/v1.0.1...v2.0.0) (2017-10-19)


### Bug Fixes

* narrow policy range ([7117722](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/7117722))
* remove "autoscaling:*" policy from role ([5da01d0](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/5da01d0))


### Features

* allow non tables config related plugin settings ([5e29f67](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/5e29f67))
* apply policies unconditionally ([b0bffa7](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/b0bffa7))
* iamOnly option to address CF race condition ([7286716](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/7286716))
* improve IAM role handling ([193c55d](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/193c55d))
* reuse lambda role ([68ff842](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/68ff842))


### BREAKING CHANGES

* tables config was additionally nested with plugin settings at `tablesConfig` property.

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

* CloudFormation no value handling ([16fa1ad](https://github.com/medikoo/serverless-plugin-dynamodb-autoscaling/commit/16fa1ad))
