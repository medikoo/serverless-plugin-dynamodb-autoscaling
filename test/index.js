"use strict";

const assignDeep = require("es5-ext/object/assign-deep")
    , copyDeep = require("es5-ext/object/copy-deep")
    , test     = require("tape")
    , Plugin   = require("../");

const roleResource                = require("./__snapshots__/role-resource")
    , lambdaRoleResourceBare      = require("./__snapshots__/lambda-role-resource-bare")
    , lambdaRoleResourcePatched   = require("./__snapshots__/lambda-role-resource-patched")
    , lambdaRoleResourceBare2     = require("./__snapshots__/lambda-role-resource-bare-2")
    , lambdaRoleResourcePatched2  = require("./__snapshots__/lambda-role-resource-patched-2")
    , tableNoIndexes              = require("./__snapshots__/table-no-indexes")
    , tableIndexes                = require("./__snapshots__/table-indexes")
    , resourcesNoIndexes          = require("./__snapshots__/resources-no-indexes-default")
    , resourcesNoIndexesLambdaIam = require("./__snapshots__/resources-no-indexes-lambda-iam")
    , resourcesNoIndexesIAMRole   = require("./__snapshots__/resources-no-indexes-iam-role")
    , resourcesIndexes            = require("./__snapshots__/resources-indexes-default")
    , resourcesIndexesNoChaining  = require("./__snapshots__/resources-indexes-no-chaining")
    , resourcesIndexesNoIndexes   = require("./__snapshots__/resources-indexes-no-indexes")
    , resourcesIndexesNoTable     = require("./__snapshots__/resources-indexes-no-table")
    , resourcesIndexesCustom      = require("./__snapshots__/resources-indexes-custom")
    , resourcesIndexesCustom2     = require("./__snapshots__/resources-indexes-custom-2");

test("Serverless Plugin Dynamodb Autoscaling", t => {
	const templateMock = {}, configMock = {};
	const serverlessMock = {
		service: { provider: { compiledCloudFormationTemplate: templateMock }, custom: configMock }
	};

	let plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableNoIndexes);
	delete serverlessMock.service.custom;
	plugin.configure();
	t.deepEqual(
		templateMock.Resources, Object.assign({}, roleResource, tableNoIndexes, resourcesNoIndexes),
		"Automatically creates scaling resources for a table"
	);
	serverlessMock.service.custom = configMock;

	plugin = new Plugin(serverlessMock);
	const resourceOverride = {
		DynamodbAutoscalingRole: {
			Properties: {
				RoleName: "NextbikeCustomersAutoscalingRole"
			}
		}
	};
	templateMock.Resources = Object.assign({}, tableNoIndexes, resourceOverride);
	delete serverlessMock.service.custom;
	plugin.configure();
	t.deepEqual(
		templateMock.Resources,
		assignDeep({}, roleResource, tableNoIndexes, resourcesNoIndexes, resourceOverride),
		"Respects resource overrides when creating scaling resources for a table"
	);
	serverlessMock.service.custom = configMock;

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = {};
	plugin.configure();
	t.deepEqual(
		templateMock.Resources, Object.assign({}, roleResource, tableIndexes, resourcesIndexes),
		"Automatically creates scaling resources for a table with indexes"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { chainScalingPolicies: false };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexesNoChaining),
		"Does not chain ScalingPolicy resources with `chainScalingPolicies: false`"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { tablesConfig: { "*": { indexes: false } } };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexesNoIndexes),
		"Does not autoscale indexes with indexes: false"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableNoIndexes);
	configMock.dynamodbAutoscaling = { tablesConfig: { "*": { read: false, write: false } } };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources, Object.assign({}, tableNoIndexes, roleResource),
		"Does not autoscale with read: false and write: false"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({ Foo: {} }, tableIndexes);
	configMock.dynamodbAutoscaling = { tablesConfig: { "*": false } };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources, Object.assign({ Foo: {} }, tableIndexes, roleResource),
		"Does not autoscale with *: false"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { tablesConfig: { "*": true } };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources, Object.assign({}, roleResource, tableIndexes, resourcesIndexes),
		"Apply defaults on *: true setting"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { tablesConfig: { "*": null } };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources, Object.assign({}, roleResource, tableIndexes, resourcesIndexes),
		"Apply defaults on *: null setting"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { tablesConfig: { "*": { minCapacity: 100 } } };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexesCustom),
		"Apply global custom settings"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = {
		tablesConfig: {
			"maas-tsp-dev-nextbike-customers": { table: { maxCapacity: 800 } },
			"elo": { minCapactity: 30 }
		}
	};
	plugin.configure();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexesCustom2),
		"Apply specific table custom settings"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { tablesConfig: { "*": { indexes: true } } };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources, Object.assign({}, roleResource, tableIndexes, resourcesIndexes),
		"Apply defaults on indexes: true setting"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { tablesConfig: { "*": { indexes: { "*": true } } } };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources, Object.assign({}, roleResource, tableIndexes, resourcesIndexes),
		"Apply defaults on indexes: { *: true } setting"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { tablesConfig: { "*": { indexes: { read: true } } } };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources, Object.assign({}, roleResource, tableIndexes, resourcesIndexes),
		"Apply defaults on indexes: { read: true } setting"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { tablesConfig: { "*": { indexes: { marko: true } } } };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources, Object.assign({}, roleResource, tableIndexes, resourcesIndexes),
		"Apply defaults on indexes: { indexName: true } setting"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { tablesConfig: { "*": { table: false } } };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexesNoTable),
		"Does not autoscale table with table: false"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableNoIndexes, copyDeep(lambdaRoleResourceBare));
	delete configMock.dynamodbAutoscaling;
	plugin.configure();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, lambdaRoleResourcePatched, tableNoIndexes, resourcesNoIndexesLambdaIam),
		"Automatically adds settings to lambda IAM role"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableNoIndexes, copyDeep(lambdaRoleResourceBare));
	configMock.dynamodbAutoscaling = { tablesConfig: { miszka: { table: false } } };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, lambdaRoleResourcePatched, tableNoIndexes, resourcesNoIndexesLambdaIam),
		"Does not apply not addressed patterns"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableNoIndexes, copyDeep(lambdaRoleResourceBare2));
	delete configMock.dynamodbAutoscaling;
	plugin.configure();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, lambdaRoleResourcePatched2, tableNoIndexes, resourcesNoIndexesLambdaIam),
		"Automatically adds settings to lambda IAM role with no Dynamodb rights"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableNoIndexes);
	configMock.dynamodbAutoscaling = { iamOnly: true };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources, Object.assign({}, roleResource, tableNoIndexes),
		"Do not add autoscaling resources with iamOnly option"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = Object.assign({}, tableNoIndexes);
	configMock.dynamodbAutoscaling = { iamRoleArn: "autoscaling-role-arn" };
	plugin.configure();
	t.deepEqual(
		templateMock.Resources, Object.assign({}, tableNoIndexes, resourcesNoIndexesIAMRole),
		"Do not add iam resources with iamRoleArn option"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = {};
	configMock.dynamodbAutoscaling = 20;
	t.throws(
		() => plugin.configure(), /Invalid 'dynamodbAutoscaling' configuration/u,
		"Throws on invalid plugin configuration"
	);

	plugin = new Plugin(serverlessMock);
	templateMock.Resources = {};
	configMock.dynamodbAutoscaling = { tablesConfig: 20 };
	t.throws(
		() => plugin.configure(), /Invalid 'dynamodbAutoscaling.tablesConfig' configuration/u,
		"Throws on invalid plugin configuration"
	);
	t.end();
});
