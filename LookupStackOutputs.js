/*
 * Copyright 2016 Tech Warriors, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

exports.handler = function(event, context) {

	console.log('REQUEST RECEIVED:\n', JSON.stringify(event));

	var response = require('cfn-response');
    var responseData = {};
	
	if (event.RequestType == 'Delete') {
		response.send(event, context, response.SUCCESS);
		return;
	}

	var stackName = event.ResourceProperties.StackName;
	if (stackName) {
		var aws = require('aws-sdk');
		var cfn = new aws.CloudFormation();
		cfn.describeStacks({StackName: stackName}, function(err, data) {
			if (err) {
				responseData = {Error: 'DescribeStacks call failed'};
				console.log(responseData.Error + ':\n', err);
				response.send(event, context, response.FAILED, responseData);
			}
			else {
				data.Stacks[0].Outputs.forEach(function(output) {
					responseData[output.OutputKey] = output.OutputValue;
				});
				response.send(event, context, response.SUCCESS, responseData);
			}
		});
	} else {
		responseData = {Error: 'Stack name not specified'};
		console.log(responseData.Error);
		response.send(event, context, response.FAILED, responseData);
	}
};
