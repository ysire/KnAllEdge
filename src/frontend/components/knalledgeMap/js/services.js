(function () { // This prevents problems when concatenating scripts that aren't strict.
'use strict';
//this function is strict...

//TODO: how to create this Object and where to put it?
// var kNode = {
// 	_id: String, //TODO: type? ObjectId or Number?
// 	name: String,
// 	mapId: String,
// 	iAmId: Number,
// 	activeVersion: Number,
// 	ideaId: Number,
// 	version: Number,
// 	isPublic: Boolean,
// 	dataContentSerialized: String,
// 	visual: {
// 		isOpen: Boolean,
// 		manualX: Number,
// 		manualY: Number
// 	}
// };

var removeJsonProtected = function(ENV, jsonStr){
	if(ENV.server.jsonPrefixed && jsonStr.indexOf(ENV.server.jsonPrefixed) === 0){
		jsonStr = jsonStr.substring(ENV.server.jsonPrefixed.length);
	}
	return jsonStr;
};

var knalledgeMapServices = angular.module('knalledgeMapServices', ['ngResource', 'Config']);

knalledgeMapServices.factory('KnalledgeNodeService', ['$resource', '$q', 'ENV', function($resource, $q, ENV){
	console.log("[knalledgeMapServices] server backend: %s", ENV.server.backend);
	// creationId is parameter that will be replaced with real value during the service call from controller
	var url = ENV.server.backend + '/knodes/:type/:searchParam.json';
	var resource = $resource(url, {}, {
		// extending the query action
		// method has to be defined
		// we are setting creationId as a pre-bound parameter. in that way url for the query action is equal to: data/creations/creations.json
		// we also need to set isArray to true, since that is the main difference with get action that also uses GET method
		getPlain: {method:'GET', params:{type:'one', searchParam:''}, isArray:false,
			transformResponse: function(serverResponseNonParsed, headersGetter){ /*jshint unused:false*/
			var serverResponse;
			if(ENV.server.parseResponse){
				serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
				serverResponse = JSON.parse(serverResponseNonParsed);
				// console.log("[KnalledgeNodeService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[knalledgeMapServices] accessId: %s", serverResponse.accessId);
				var data = serverResponse.data;
				return data[0];
			}else{
				serverResponse = JSON.parse(serverResponseNonParsed);
				return serverResponse;
			}
		}},
		
		queryPlain: {method:'GET', params:{type:'', searchParam:''}, isArray:true, 
			transformResponse: function(serverResponseNonParsed, headersGetter){ /*jshint unused:false*/
			var serverResponse;
			if(ENV.server.parseResponse){
				serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
				serverResponse = JSON.parse(serverResponseNonParsed);
				console.log("[KnalledgeNodeService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[KnalledgeNodeService] accessId: %s", serverResponse.accessId);
				var data = serverResponse.data;
				var VOs = new Array();
				for(var datumId in serverResponse.data){
					var VO = knalledge.KNode.createNode(data[datumId]);
					VO.state = knalledge.KNode.STATE_SYNCED;
					VOs.push(VO);
				}
				//console.log("[KnalledgeNodeService] data: %s", JSON.stringify(data));
				return VOs;
			}else{
				serverResponse = JSON.parse(serverResponseNonParsed);
				return serverResponse;
			}
		}},
		
		createPlain: {method:'POST', params:{}/*{type:'', searchParam: '', extension:""}*/, 
			transformResponse: function(serverResponseNonParsed/*, headersGetter*/){
			var serverResponse;
			if(ENV.server.parseResponse){
				serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
				serverResponse = JSON.parse(serverResponseNonParsed);
				//console.log("[KnalledgeNodeService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[KnalledgeNodeService::createPlain] accessId: %s", serverResponse.accessId);
				var data = serverResponse.data;
				console.log("[KnalledgeNodeService::createPlain] data: %s", JSON.stringify(data));
				return data;
			}else{
				//console.log("ENV.server.parseResponse = false");
				serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
				serverResponse = JSON.parse(serverResponseNonParsed);
				return serverResponse;
			}
		}},
		
		updatePlain: {method:'PUT', params:{type:'one', searchParam:''},
			transformResponse: function(serverResponseNonParsed/*, headersGetter*/){
				var serverResponse;
				if(ENV.server.parseResponse){
					serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
					serverResponse = JSON.parse(serverResponseNonParsed);
					//console.log("[KnalledgeNodeService] serverResponse: %s", JSON.stringify(serverResponse));
					console.log("[KnalledgeNodeService:create] accessId: %s", serverResponse.accessId);
					var data = serverResponse.data;
					return data;
				}else{
					serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
					serverResponse = JSON.parse(serverResponseNonParsed);
					return serverResponse;					
				}
			}
		},
		
		destroyPlain: {method:'DELETE', params:{type:'one'},
			transformResponse: function(serverResponseNonParsed/*, headersGetter*/){
				var serverResponse;
				if(ENV.server.parseResponse){
					serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
					serverResponse = JSON.parse(serverResponseNonParsed);
					//console.log("[KnalledgeNodeService] serverResponse: %s", JSON.stringify(serverResponse));
					console.log("[KnalledgeNodeService:create] accessId: %s", serverResponse.accessId);
					var data = serverResponse.data;
					return data;
				}else{
					serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
					serverResponse = JSON.parse(serverResponseNonParsed);
					return serverResponse;					
				}
			}
		}
	});

	resource.query = function(){
		var data = {
			$promise: null,
			$resolved: false
		};

		data.$promise = $q(function(resolve, reject) { /*jshint unused:false*/
			var jsonUrl = ENV.server.backend + "/sample-small.json";
			$.getJSON(jsonUrl, null, function(jsonContent){
				console.log("Loaded: %s, map (nodes: %d, edges: %d)", jsonUrl,
				jsonContent.map.nodes.length, jsonContent.map.edges.length);
				for(var id in jsonContent){
					data[id] = jsonContent[id];
				}
				data.$resolved = true;
				resolve(jsonContent);
			});
		// reject('Greeting ' + name + ' is not allowed.');
		});
		return data;
	};

	resource.getById = function(id, callback)
	{
		var node = this.getPlain({ searchParam:id, type:'one' }, callback);
		return node;
	};
	
	resource.queryInMap = function(id, callback)
	{
		var nodes = this.queryPlain({ searchParam:id, type:'in_map' }, callback);
		// for(var i in nodes){
		// 	//TODO fix nodes.state, etc
		// }
		return nodes;
	};
	
	resource.create = function(kNode, callback)
	{
		console.log("resource.create");
		var node = this.createPlain({}, kNode, callback);
		return node;
	};
	
	resource.update = function(kNode, callback)
	{
		var kNodeClone = {};
		// kNodeClone = (JSON.parse(JSON.stringify(kNode)));
		// delete kNodeClone.children;
		// delete kNodeClone.parent;

		for(var id in kNode){
			if(id == 'children') continue;
			if(id == 'parent') continue;
			if(id[0] == '$') continue;
			if(id == 'children') continue;
			if (typeof kNode[id] == 'function') continue;
			//console.log("cloning: %s", id);
			kNodeClone[id] = (JSON.parse(JSON.stringify(kNode[id])));// kNode[id];
		}
		//TODO: check the name of param: id or ObjectId or _id?
		return this.updatePlain({searchParam:kNodeClone._id, type:'one'}, kNodeClone, callback); //TODO: does it return node so we should fix it like in create?
	};
	
	resource.destroy = function(id, callback)
	{
		return this.destroyPlain({searchParam:id, type:'one'}, callback);
	};

	return resource;
	
}]);

knalledgeMapServices.factory('KnalledgeEdgeService', ['$resource', '$q', 'ENV', function($resource, $q, ENV){
	console.log("[atGsServices] server backend: %s", ENV.server.backend);
	// creationId is parameter that will be replaced with real value during the service call from controller
	var url = ENV.server.backend + '/kedges/:type/:searchParam.json';
	var resource = $resource(url, {}, {
		// extending the query action
		// method has to be defined
		// we are setting creationId as a pre-bound parameter. in that way url for the query action is equal to: data/creations/creations.json
		// we also need to set isArray to true, since that is the main difference with get action that also uses GET method
		getPlain: {method:'GET', params:{type:'one', searchParam:''}, isArray:false,
			transformResponse: function(serverResponseNonParsed, headersGetter){ /*jshint unused:false*/
			var serverResponse;
			if(ENV.server.parseResponse){
				serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
				serverResponse = JSON.parse(serverResponseNonParsed);
				// console.log("[KnalledgeEdgeService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[knalledgeMapServices] accessId: %s", serverResponse.accessId);
				var data = serverResponse.data;
				return data[0];
			}else{
				serverResponse = JSON.parse(serverResponseNonParsed);
				return serverResponse;
			}
		}},
		
		queryPlain: {method:'GET', params:{type:'', searchParam:''}, isArray:true, 
			transformResponse: function(serverResponseNonParsed, headersGetter){ /*jshint unused:false*/
			var serverResponse;
			if(ENV.server.parseResponse){
				serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
				serverResponse = JSON.parse(serverResponseNonParsed);
				console.log("[KnalledgeEdgeService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[KnalledgeEdgeService] accessId: %s", serverResponse.accessId);
				var data = serverResponse.data;
//				for(var datumId in data){
//					var data = data[datumId];
//				}
				//console.log("[KnalledgeEdgeService] data: %s", JSON.stringify(data));
				return data;
			}else{
				serverResponse = JSON.parse(serverResponseNonParsed);
				return serverResponse;
			}
		}},
		
		createPlain: {method:'POST', params:{}/*{type:'', searchParam: '', extension:""}*/, 
			transformResponse: function(serverResponseNonParsed/*, headersGetter*/){
			var serverResponse;
			if(ENV.server.parseResponse){
				serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
				serverResponse = JSON.parse(serverResponseNonParsed);
				//console.log("[KnalledgeEdgeService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[KnalledgeEdgeService::create] accessId: %s", serverResponse.accessId);
				var data = serverResponse.data;
				console.log("[KnalledgeEdgeService::create] data: %s", JSON.stringify(data));
				return data;
			}else{
				serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
				serverResponse = JSON.parse(serverResponseNonParsed);
				return serverResponse;
			}
		}},
		
		updatePlain: {method:'PUT', params:{type:'one', searchParam:''},
			transformResponse: function(serverResponseNonParsed/*, headersGetter*/){
				var serverResponse;
				if(ENV.server.parseResponse){
					serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
					serverResponse = JSON.parse(serverResponseNonParsed);
					//console.log("[KnalledgeEdgeService] serverResponse: %s", JSON.stringify(serverResponse));
					console.log("[KnalledgeEdgeService:create] accessId: %s", serverResponse.accessId);
					var data = serverResponse.data;
					return data;
				}else{
					serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
					serverResponse = JSON.parse(serverResponseNonParsed);
					return serverResponse;					
				}
			}
		},
		
		destroyPlain: {method:'DELETE', params:{type:'one'},
			transformResponse: function(serverResponseNonParsed/*, headersGetter*/){
				var serverResponse;
				if(ENV.server.parseResponse){
					serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
					serverResponse = JSON.parse(serverResponseNonParsed);
					//console.log("[KnalledgeEdgeService] serverResponse: %s", JSON.stringify(serverResponse));
					console.log("[KnalledgeEdgeService:create] accessId: %s", serverResponse.accessId);
					var data = serverResponse.data;
					return data;
				}else{
					serverResponseNonParsed = removeJsonProtected(ENV, serverResponseNonParsed);
					serverResponse = JSON.parse(serverResponseNonParsed);
					return serverResponse;					
				}
			}
		}
	});
	
	resource.getById = function(id, callback)
	{
		return this.getPlain({ searchParam:id, type:'one' }, callback);
	};
	
	resource.queryInMap = function(id, callback)
	{
		return this.queryPlain({ searchParam:id, type:'in_map' }, callback);
	};
	
	resource.queryBetween = function(id, callback)
	{
		return this.queryPlain({ searchParam:id, type:'between' }, callback);
	};
	
	resource.queryConnected = function(id, callback)
	{
		return this.queryPlain({ searchParam:id, type:'connected' }, callback);
	};
	
	resource.create = function(kEdge, callback)
	{
		return this.createPlain({}, kEdge, callback);
	};
	
	resource.update = function(kEdge, callback)
	{
		//TODO: check the name of param: id or ObjectId or _id?
		return this.updatePlain({searchParam:kEdge._id, type:'one'}, kEdge, callback);
	};
	
	resource.destroy = function(id, callback)
	{
		return this.destroyPlain({searchParam:id, type:'one'}, callback);
	};
	
	return resource;
	
}]);

knalledgeMapServices.provider('KnalledgeMapService', {
	// privateData: "privatno",
	$get: ['$q', 'KnalledgeNodeService', 'KnalledgeEdgeService', function($q, KnalledgeNodeService, KnalledgeEdgeService) {
		// var that = this;
		return {
			mapId: "552678e69ad190a642ad461c",
			rootNode: null,
			selectedNode: null,
			nodesById: {},
			edgesById: {},
			properties: {},

			unsetSelectedNode: function(){
				this.selectedNode = null;
			},

			setSelectedNode: function(selectedNode){
				this.selectedNode = selectedNode;
			},

			getSelectedNode: function(){
				return this.selectedNode;
			},

			hasChildren: function(d){
				for(var i in this.edgesById){
					if(this.edgesById[i].sourceId == d._id){
						return true;
					}
				}
				return false;
			},

			getEdge: function(sourceId, targetId){
				// that.privateData;
				for(var i in this.edgesById){
					if(this.edgesById[i].sourceId == sourceId && this.edgesById[i].targetId == targetId){
						return this.edgesById[i];
					}
				}
				return null;
			},

			// collapses children of the provided node
			collapse: function(d) {
				d.isOpen = false;
			},

			// toggle children of the provided node
			toggle: function(d) {
				d.isOpen = !d.isOpen;
			},

			//should be migrated to some util .js file:
			cloneObject: function(obj){
				return (JSON.parse(JSON.stringify(obj)));
			},
	
			createNode: function() {
				
				var nodeCreated = function(nodeFromServer) {
					console.log("[Map] nodeCreated" + JSON.stringify(nodeFromServer));
					var edgeUpdatedNodeRef = function(edgeFromServer){
						console.log("[Map] edgeUpdatedNodeRef" + JSON.stringify(edgeFromServer));
					};
					
					// updating all references to node on fronted with server-created id:
					var oldId = newNode._id;
					delete this.nodesById.oldId;//		this.nodesById.splice(oldId, 1);
					this.nodesById[nodeFromServer._id] = newNode; //TODO: we should set it to 'nodeFromServer'?! But we should synchronize also local changes from 'newNode' happen in meantime
					newNode._id = nodeFromServer._id; //TODO: same as above
					
					//fixing edges:: sourceId & targetId:
					for(var i in this.edgesById){
						var changed = false;
						var edge = this.edgesById[i];
						if(edge.sourceId == oldId){edge.sourceId = nodeFromServer._id; changed = true;}
						if(edge.targetId == oldId){edge.targetId = nodeFromServer._id; changed = true;}
						if(changed){
							//TODO: should we clone it or call vanilla object creation:
							KnalledgeEdgeService.update(edge, edgeUpdatedNodeRef.bind(this)); //saving changes in edges's node refs to server
						}
					}
				};

				console.log("[Map] createNode");
				var maxId = -1;
				for(var i in this.nodesById){
					if(maxId < this.nodesById[i]._id){
						maxId = this.nodesById[i]._id;
					}
				}

				var newNode = new knalledge.KNode();
				newNode._id = maxId+1;
				newNode.mapId = this.mapId;

				this.nodesById[newNode._id] = newNode;
				var nodeCloned = this.cloneObject(newNode);
				delete nodeCloned._id;
				KnalledgeNodeService.create(nodeCloned, nodeCreated.bind(this)); //saving on server service.
				return newNode;
			},

			updateNode: function(node) {
				KnalledgeNodeService.update(node); //updating on server service
			},

			createEdge: function(sourceNode, targetNode) {
				var edgeCreated = function(edgeFromServer) {
					console.log("[Map] edgeCreated" + JSON.stringify(edgeFromServer));
					
					// updating all references to edge on fronted with server-created id:
					var oldId = newEdge._id;
					delete this.edgesById[oldId];//		this.nodesById.splice(oldId, 1);
					this.edgesById[edgeFromServer._id] = newEdge; //TODO: we should set it to 'edgeFromServer'?! But we should synchronize also local changes from 'newEdge' happen in meantime
					newEdge._id = edgeFromServer._id; //TODO: same as above
				};
				
				console.log("[Map] createEdge");
				var maxId = -1;
				for(var i in this.edgesById){
					if(maxId < this.edgesById[i]._id){
						maxId = this.edgesById[i]._id;
					}
				}
				
				var newEdge = new knalledge.KEdge();
				newEdge._id = maxId+1;
				newEdge.mapId = this.mapId;
				newEdge.sourceId = sourceNode._id;
				newEdge.targetId = targetNode._id;

				this.edgesById[newEdge._id] = newEdge;
				
				//preparing and saving on server service:
				var edgeCloned = this.cloneObject(newEdge);
				if(newEdge.state == knalledge.KEdge.STATE_LOCAL){
					delete edgeCloned._id;
				}
				if(sourceNode.state == knalledge.KNode.STATE_LOCAL) //TODO: not working till state is not set for resources retreived from server
				{
					delete edgeCloned.sourceId; // this is still not set to server Id
				}
				if(targetNode.state == knalledge.KNode.STATE_LOCAL)
				{
					delete edgeCloned.targetId; // this is still not set to server Id
				}
				KnalledgeEdgeService.create(edgeCloned, edgeCreated.bind(this));
				
				return newEdge;
			},

			processData: function(treeData, rootNodeX, rootNodeY) {
				//this.properties = treeData.properties;
				var rootId = "55268521fb9a901e442172f9";
				var i=0;
				var node = null;
				var edge = null;
				for(i=0; i<treeData.nodes.length; i++){
					node = treeData.nodes[i];
					if(!("isOpen" in node)){
						node.isOpen = false;
					}
					this.nodesById[node._id] = node;
				}

				for(i=0; i<treeData.edges.length; i++){
					edge = treeData.edges[i];
					this.edgesById[edge._id] = edge;
				}

				// this.rootNode = this.nodesById[this.properties.rootNodeId];
				this.rootNode = this.nodesById[rootId];
				this.rootNode.x0 = rootNodeY;
				this.rootNode.y0 = rootNodeX;

				this.selectedNode = this.rootNode;

				// this.clickNode(this.rootNode);
				// this.update(this.rootNode);
			}
		};
	}]
});

}()); // end of 'use strict';