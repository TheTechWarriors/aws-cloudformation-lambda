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

 /*
  * The following is a modified version of https://gist.github.com/fcheung/baec53381350a4b11037#file-nat_gateway-js 
  */

var response = require('cfn-response');
var aws = require('aws-sdk');
var ec2 = new aws.EC2();

exports.handler = function(event, context) {
	if (event.RequestType === 'Delete') {
		deleteGateway(event, context);
	} else if (event.RequestType === 'Update' || event.RequestType === 'Create') {
		createGateway(event, context);
	} else {
		response.send(event, context, {
			Error: "unknown type: " + event.RequestType
		}, response.FAILED);
	}
};

var createGateway = function(event, context) {
	var responseData = {};
	var subnetId = event.ResourceProperties.SubnetId;
	var allocationId = event.ResourceProperties.AllocationId;

	if (subnetId && allocationId) {
		ec2.createNatGateway({
			AllocationId: allocationId,
			SubnetId: subnetId
		}, function(err, data) {
			if (err) {
				responseData = {
					Error: "create gateway failed " + err
				};
				console.log(responseData.Error);
				response.send(event, context, response.FAILED, responseData);
			} else {
				
				waitForGatewayStateChange(data.NatGateway.NatGatewayId, ['available', 'failed'], function(state) {
					if (state == "failed") {
						response.send(event, context, response.FAILURE, {}, data.NatGateway.NatGatewayId);
					} else {
						response.send(event, context, response.SUCCESS, {}, data.NatGateway.NatGatewayId);
					}
				});
			}
		})
	} else {
		if (!subnetId) {
			responseData = {
				Error: 'subnet id not specified'
			};
			console.log(responseData.Error);
			response.send(event, context, response.FAILED, responseData);
		} else {
			responseData = {
				Error: 'allocationId not specified'
			};
			console.log(responseData.Error);
			response.send(event, context, response.FAILED, responseData);
		}
	}
};

var waitForGatewayStateChange = function (id, states, onComplete){
  ec2.describeNatGateways({NatGatewayIds: [id], Filter: [{Name: "state", Values: states}]}, function(err, data){
	if(err){
	  console.log("could not describeNatGateways " + err);
	  onComplete('failed');
	}else{
	  if(data.NatGateways.length > 0){
		onComplete(data.NatGateways[0].State)
	  }else{
		console.log("gateway not ready; waiting");
		setTimeout(function(){ waitForGatewayStateChange(id, states, onComplete);}, 15000);
	  }
	}
  });
};

var deleteGateway = function(event, context) {
	var responseData = {};
	if (event.PhysicalResourceId && event.PhysicalResourceId.match(/^nat-/)) {
		ec2.deleteNatGateway({
			NatGatewayId: event.PhysicalResourceId
		}, function(err, data) {
			if (err) {
				responseData = {
					Error: "delete gateway failed " + err
				};
				console.log(responseData.Error);
				response.send(event, context, response.FAILED, responseData, event.PhysicalResourceId);
			} else {
				waitForGatewayStateChange(event.PhysicalResourceId, ['deleted'], function(state){
					response.send(event, context, response.SUCCESS, {}, event.PhysicalResourceId);
				});
			}
		})
	} else {
		console.log("No valid physical resource id passed to destroy - ignoring " + event.PhysicalResourceId);
		response.send(event, context, response.SUCCESS, responseData, event.PhysicalResourceId);
	}
}
