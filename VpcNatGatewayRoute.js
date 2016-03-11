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
	var destinationCidrBlock = event.ResourceProperties.DestinationCidrBlock;
	var routeTableId = event.ResourceProperties.RouteTableId;
	var responseData = {};
	if (!destinationCidrBlock) {
		responseData = {
			Error: "missing parameter DestinationCidrBlock "
		};
		console.log(responseData.Error);
		response.send(event, context, response.FAILED, responseData);
		return;
	}
	else {
		if (!routeTableId) {
		  responseData = {
			  Error: "missing parameter RouteTableId "
		  };
		  console.log(responseData.Error);
		  response.send(event, context, response.FAILED, responseData);
		  return;
	  }
	}

	if (event.RequestType === 'Delete') {
		deleteRoute(event, context);
	} else if (event.RequestType === 'Create') {
		createRoute(event, context);
	} else if (event.RequestType === 'Update') {
		if (event.ResourceProperties.DestinationCIDRBlock === event.OldResourceProperties.DestinationCIDRBlock &&
			event.ResourceProperties.RouteTableId === event.OldResourceProperties.RouteTableId) {
			replaceRoute(event, context);
		} else {
			createRoute(event, context);
		}
	} else {
		console.log("Unknown request type " + event.RequestType);
		response.send(event, context, {
			Error: "unknown request type: " + event.RequestType
		}, response.FAILED);
	}
};

var deleteRoute = function(event, context) {
	var responseData = {};
	var destinationCidrBlock = event.ResourceProperties.DestinationCidrBlock;
	var routeTableId = event.ResourceProperties.RouteTableId;

	if(event.PhysicalResourceId.match(/^gateway-route-/)){

	  ec2.deleteRoute({
		  RouteTableId: routeTableId,
		  DestinationCidrBlock: destinationCidrBlock
	  }, function(err, data) {
		  if (err) {
			  responseData = {
				  Error: "delete route failed " + err
			  };
			  console.log(responseData.Error);
			  response.send(event, context, response.FAILED, responseData);

		  } else {
			  response.send(event, context, response.SUCCESS, {}, physicalId(event.ResourceProperties));
		  }
	  });
	}else{
	  console.log("unexpected physical id for route " + event.PhysicalResourceId + " - ignoring");
	  response.send(event, context, response.SUCCESS, {});
	}
};


var createRoute = function(event, context) {
	var responseData = {};
	var destinationCidrBlock = event.ResourceProperties.DestinationCidrBlock;
	var routeTableId = event.ResourceProperties.RouteTableId;
	var natGatewayId = event.ResourceProperties.NatGatewayId;

	if (natGatewayId) {
		ec2.createRoute({
			RouteTableId: routeTableId,
			DestinationCidrBlock: destinationCidrBlock,
			NatGatewayId: natGatewayId
		}, function(err, data) {
			if (err) {
				responseData = {
					Error: "create route failed " + err
				};
				console.log(responseData.Error);
				response.send(event, context, response.FAILED, responseData);

			} else {
				response.send(event, context, response.SUCCESS, {}, physicalId(event.ResourceProperties));
			}
		});
	} else {
		responseData = {
			Error: "missing parameter natGatewayId "
		};
		console.log(responseData.Error);
		response.send(event, context, response.FAILED, responseData);
		return;
	}
};

var replaceRoute = function(event, context) {
	var responseData = {};
	var destinationCidrBlock = event.ResourceProperties.DestinationCidrBlock;
	var routeTableId = event.ResourceProperties.RouteTableId;
	var natGatewayId = event.ResourceProperties.NatGatewayId;

	if (natGatewayId) {
		ec2.replaceRoute({
			RouteTableId: routeTableId,
			DestinationCidrBlock: destinationCidrBlock,
			NatGatewayId: natGatewayId
		}, function(err, data) {
			if (err) {
				responseData = {
					Error: "create route failed " + err
				};
				console.log(responseData.Error);
				response.send(event, context, response.FAILED, responseData);

			} else {
				response.send(event, context, response.SUCCESS, {}, physicalId(event.ResourceProperties));
			}
		});
	} else {
		responseData = {
			Error: "missing parameter natGatewayId "
		};
		console.log(responseData.Error);
		response.send(event, context, response.FAILED, responseData);
		return;
	}
};


var physicalId = function(properties) {
	return 'gateway-route-' + properties.RouteTableId + '-' + properties.DestinationCIDRBlock;
};
