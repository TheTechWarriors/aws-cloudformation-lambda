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

    var vpcId = event.ResourceProperties.VpcId;
    if (vpcId) {

		var aws = require('aws-sdk');
        var ec2 = new aws.EC2();
		
		if (event.RequestType == 'Delete') {

			ec2.disableVpcClassicLinkDnsSupport({VpcId: vpcId}, function(err, data) {
				if (err) {
					responseData = {Error: 'EnableVpcClassicLinkDnsSupport call failed'};
					console.log(responseData.Error + ':\n', err);
					response.send(event, context, response.FAILED, responseData);
				}
				else {
					ec2.disableVpcClassicLink({VpcId: vpcId}, function(err, data) {
						if (err) {
							responseData = {Error: 'EnableVpcClassicLink call failed'};
							console.log(responseData.Error + ':\n', err);
							response.send(event, context, response.FAILED, responseData);
						}
						else {
							response.send(event, context, response.SUCCESS, responseData);
						}
					});
				}
			});


		} else {

			ec2.enableVpcClassicLink({VpcId: vpcId}, function(err, data) {
				if (err) {
					responseData = {Error: 'EnableVpcClassicLink call failed'};
					console.log(responseData.Error + ':\n', err);
					response.send(event, context, response.FAILED, responseData);
				}
				else {
					ec2.enableVpcClassicLinkDnsSupport({VpcId: vpcId}, function(err, data) {
						if (err) {
							responseData = {Error: 'EnableVpcClassicLinkDnsSupport call failed'};
							console.log(responseData.Error + ':\n', err);
							response.send(event, context, response.FAILED, responseData);
						}
						else {
							response.send(event, context, response.SUCCESS, responseData, vpcId + "-classic-link");
						}
					});
				}
			});

		}
		
    } else {
        responseData = {Error: 'VpcId not specified'};
        console.log(responseData.Error);
        response.send(event, context, response.FAILED, responseData);
    }
};
