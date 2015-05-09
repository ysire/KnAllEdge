(function () { // This prevents problems when concatenating scripts that aren't strict.
'use strict';
//this function is strict...

var QUEUE = 
//false;
true;

var removeJsonProtected = function(ENV, jsonStr){
	if(ENV.server.jsonPrefixed && jsonStr.indexOf(ENV.server.jsonPrefixed) === 0){
		jsonStr = jsonStr.substring(ENV.server.jsonPrefixed.length);
	}
	return jsonStr;
};

var rimaServices = angular.module('rimaServices', ['ngResource', 'Config']);

/**
* 	factory 'WhoAmIService'
*/

rimaServices.factory('WhoAmIService', ['$resource', '$q', 'ENV', 'KnalledgeMapQueue', function($resource, $q, ENV, KnalledgeMapQueue){
	console.log("[WhoAmIService] server backend: %s", ENV.server.backend);
	// creationId is parameter that will be replaced with real value during the service call from controller
	var url = ENV.server.backend + '/whoAmIs/:type/:searchParam/:searchParam2.json';
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
				// console.log("[WhoAmIService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[WhoAmIService] accessId: %s", serverResponse.accessId);
				return serverResponse.data;
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
				console.log("[WhoAmIService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[WhoAmIService] accessId: %s", serverResponse.accessId);
				return serverResponse.data;
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
				//console.log("[WhoAmIService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[ng-WhoAmIService::createPlain] accessId: %s", serverResponse.accessId);
				var data = serverResponse.data;
				console.log("ng-[WhoAmIService::createPlain] data: %s", JSON.stringify(data));
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
					//console.log("[WhoAmIService] serverResponse: %s", JSON.stringify(serverResponse));
					console.log("[WhoAmIService:create] accessId: %s", serverResponse.accessId);
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
					//console.log("[WhoAmIService] serverResponse: %s", JSON.stringify(serverResponse));
					console.log("[WhoAmIService:create] accessId: %s", serverResponse.accessId);
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

	resource.RESOURCE_TYPE = 'WhoAmI';

	resource.getById = function(id, callback)
	{
		var whoAmI = this.getPlain({ searchParam:id, type:'one' }, callback);
		return whoAmI;
	};
	
	resource.getByIds = function(whoAmIsIds, callback){ //TODO: fix not to return all, but only those in the whoAmIsIds list
		var whoAmIs = this.queryPlain({ searchParam:whoAmIsIds, type:'in_list'},
			function(whoAmIsFromServer){
				for(var id=0; id<whoAmIsFromServer.length; id++){
					var whoAmI = knalledge.WhoAmI.whoAmIFactory(whoAmIsFromServer[id]);
					whoAmI.state = knalledge.WhoAmI.STATE_SYNCED;
					whoAmIsFromServer[id] = whoAmI;
				}
				if(callback) callback(whoAmIsFromServer);
		});
		return whoAmIs;
	};
	
	resource.create = function(whoAmI, callback)
	{
		console.log("resource.create");
		
		if(QUEUE){
			whoAmI.$promise = null;
			whoAmI.$resolved = false;

			whoAmI.$promise = $q(function(resolve, reject) {
				KnalledgeMapQueue.execute({data: whoAmI, callback:callback, resource_type:resource.RESOURCE_TYPE, method: "create", processing: {"RESOLVE":resolve, "REJECT":reject, "EXECUTE": resource.execute, "CHECK": resource.check}});
			});
		}
		else{
			var whoAmIForServer = whoAmI.toServerCopy();
			//we return whoAmI:whoAmI, because 'whoAmI' is of type 'Resource'  
			var whoAmI = this.createPlain({}, whoAmIForServer, function(whoAmIFromServer){
				whoAmI.$resolved = whoAmI.$resolved;
				whoAmI.overrideFromServer(whoAmIFromServer);
				if(callback) callback(whoAmI);
			});
			
			//createPlain manages promises for its returning value, in our case 'whoAmI', so we need to  set its promise to the value we return
			whoAmI.$promise = whoAmI.$promise;
			whoAmI.$resolved = whoAmI.$resolved;
			
			if(whoAmI.$resolved){// for the case promise was resolved immediatelly (in synchonous manner) instead synchronously 
				whoAmI.overrideFromServer(whoAmI);
			}
		}
		//we return this value to caller as a dirty one, and then set its value to whoAmIFromServer when upper callback is called
		//TODO: a problem may occur if promise is resolved BEFORE callback is called 
		return whoAmI;
	};
	
	resource.update = function(whoAmI, callback)
	{
		console.log("resource.update");
		if(whoAmI.state == knalledge.WhoAmI.STATE_LOCAL){//TODO: fix it by going throgh queue 
			window.alert("Please, wait while entity is being saved, before updating it:\n"+whoAmI.name);
			return null;
		}
		var id = whoAmI._id;
		var whoAmIForServer = whoAmI.toServerCopy(); //TODO: move it to transformRequest ?
		if(QUEUE && false){
			KnalledgeMapQueue.execute({data: whoAmI, callback:callback, resource_type:resource.RESOURCE_TYPE, method: "create"});
			return this.updatePlain({searchParam:id, type:'one'}, whoAmIForServer, callback); //TODO: does it return whoAmI so we should fix it like in create?
		}
		else{
			return this.updatePlain({searchParam:id, type:'one'}, whoAmIForServer, callback); //TODO: does it return whoAmI so we should fix it like in create?
		}
	};
	
	resource.destroy = function(id, callback)
	{
		return this.destroyPlain({searchParam:id, type:'one'}, callback);
	};
	
	resource.execute = function(request){ //example:: request = {data: whoAmI, callback:callback, resource_type:resource.RESOURCE_TYPE, method: "create", processing: {"RESOLVE":resolve, "REJECT":reject, "EXECUTE": resource.execute, "CHECK": resource.check}};
		// var whoAmI;
		switch(request.method){
		case 'create':
			//window.alert('create skipped ;)'); break;
			var whoAmIForServer = request.data.toServerCopy();
			var whoAmIReturn = request.data;
			var callback = request.callback;
			
			var whoAmI = resource.createPlain({}, whoAmIForServer, function(whoAmIFromServer){
				whoAmIReturn.$resolved = whoAmI.$resolved;
				whoAmIReturn.overrideFromServer(whoAmIFromServer);
				request.processing.RESOLVE(whoAmIReturn);//whoAmIReturn.resolve()
				if(callback) callback(whoAmIReturn);
				KnalledgeMapQueue.executed(request);
			});
			
			//createPlain manages promises for its returning value, in our case 'whoAmI', so we need to  set its promise to the value we return
			whoAmIReturn.$promise = whoAmI.$promise;
			whoAmIReturn.$resolved = whoAmI.$resolved;
			
			if(whoAmI.$resolved){// for the case promise was resolved immediatelly (in synchonous manner) instead synchronously 
				whoAmIReturn.overrideFromServer(whoAmI);
			}
			break;
		case 'update':
			this.update;
			break;
		}
	}
	
	/* checks if request can be sent to server */
	resource.check = function(request){
		return true;
	}
	
	//KnalledgeMapQueue.link(resource.RESOURCE_TYPE, {"EXECUTE": resource.execute, "CHECK": resource.check});

	return resource;
	
}]);

/**
* 	factory 'WhatService'
*/

rimaServices.provider('WhatService', {
	// privateData: "privatno",
	$get: ['$q', 'ENV', /*'$rootScope', */
	function($q, ENV /*, $rootScope*/) {
		var provider = {
			whats: [
				{
					name: "peace"
				},
				{
					name: "life"
				},
				{
					name: "love"
				},
				{
					name: "dance"
				}
			],
			init: function(){
			},
				
			loadWhatsFromList: function(usersIds, callback){
				var that = this;
				var whats = WhoAmIService.getByIds(usersIds,
					function(whatsFromServer){
						that.whats = whatsFromServer;
						//that.selectedWhoAmI = (that.whats && that.whats.length) ? that.whats[0] : null; //TODO: set it to logged-in user
						if(callback){callback();}
					});
				return whats;
			},

			getWhats: function(){
				return this.whats;
			},

			getWhatById: function(id){
				for(var i in this.whats){
					if(this.whats[i]._id == id){
						return this.whats[i];
					}
				}
				return null;
			},

			selectActiveWhat: function(whoAmI){
				this.selectedWhoAmI = whoAmI;
			},

			getActiveWhat: function(){
				return this.selectedWhoAmI;
			},

			getActiveWhatId: function(){
				return this.selectedWhoAmI ? this.selectedWhoAmI._id : undefined;
			},

			getMaxWhatNum: function(){
				var gridMaxNum = 0;
				var whats = this.whats();
				for(var i in whats){
					var grid = whats[i];
					var gridId = parseInt(grid.name.substring(2));
					if(gridId > gridMaxNum){
						gridMaxNum = gridId;
					}
				}
				return gridMaxNum;
			},

			/*
			finds all users whos name contains *nameSubSt
			*/
			getWhatsByName: function(nameSubStr){
				var returnedGrids = [];
				var whats = this.whats();
				for(var i in whats){
					var grid = whats[i];
					if(grid.name.indexOf(nameSubStr) > -1){
						returnedGrids.push(grid);
					}
				}
				return returnedGrids;
			}
		};
		provider.init();
		return provider;
	}]
});

/**
* 	factory 'WhatAmIService'
*/

rimaServices.factory('WhatAmIService', ['$resource', '$q', 'ENV', 'KnalledgeMapQueue', function($resource, $q, ENV, KnalledgeMapQueue){
	console.log("[WhatAmIService] server backend: %s", ENV.server.backend);
	// creationId is parameter that will be replaced with real value during the service call from controller
	var url = ENV.server.backend + '/whatAmIs/:type/:searchParam/:searchParam2.json';
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
				// console.log("[WhatAmIService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[WhatAmIService] accessId: %s", serverResponse.accessId);
				return serverResponse.data;
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
				console.log("[WhatAmIService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[WhatAmIService] accessId: %s", serverResponse.accessId);
				return serverResponse.data;
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
				//console.log("[WhatAmIService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[ng-WhatAmIService::createPlain] accessId: %s", serverResponse.accessId);
				var data = serverResponse.data;
				console.log("ng-[WhatAmIService::createPlain] data: %s", JSON.stringify(data));
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
					//console.log("[WhatAmIService] serverResponse: %s", JSON.stringify(serverResponse));
					console.log("[WhatAmIService:create] accessId: %s", serverResponse.accessId);
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
					//console.log("[WhatAmIService] serverResponse: %s", JSON.stringify(serverResponse));
					console.log("[WhatAmIService:create] accessId: %s", serverResponse.accessId);
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

	resource.RESOURCE_TYPE = 'WhatAmI';

	resource.getById = function(id, callback)
	{
		var whatAmI = this.getPlain({ searchParam:id, type:'one' }, callback);
		return whatAmI;
	};
	
	resource.getByIds = function(whatAmIsIds, callback){ //TODO: fix not to return all, but only those in the whatAmIsIds list
		var whatAmIs = this.queryPlain({ searchParam:whatAmIsIds, type:'in_list'},
			function(whatAmIsFromServer){
				for(var id=0; id<whatAmIsFromServer.length; id++){
					var whatAmI = knalledge.WhatAmI.whatAmIFactory(whatAmIsFromServer[id]);
					whatAmI.state = knalledge.WhatAmI.STATE_SYNCED;
					whatAmIsFromServer[id] = whatAmI;
				}
				if(callback) callback(whatAmIsFromServer);
		});
		return whatAmIs;
	};
	
	resource.getByNameContains = function(namePart, callback){ //TODO: fix not to return all, but only those in the whatAmIsIds list
		var whatAmIs = this.queryPlain({ searchParam:namePart, type:'name-contains'},
			function(whatAmIsFromServer){
				for(var id=0; id<whatAmIsFromServer.length; id++){
					var whatAmI = knalledge.WhatAmI.whatAmIFactory(whatAmIsFromServer[id]);
					whatAmI.state = knalledge.WhatAmI.STATE_SYNCED;
					whatAmIsFromServer[id] = whatAmI;
				}
				if(callback) callback(whatAmIsFromServer);
		});
		return whatAmIs;
	};
	
	resource.create = function(whatAmI, callback)
	{
		console.log("resource.create");
		
		if(QUEUE){
			whatAmI.$promise = null;
			whatAmI.$resolved = false;

			whatAmI.$promise = $q(function(resolve, reject) {
				KnalledgeMapQueue.execute({data: whatAmI, callback:callback, resource_type:resource.RESOURCE_TYPE, method: "create", processing: {"RESOLVE":resolve, "REJECT":reject, "EXECUTE": resource.execute, "CHECK": resource.check}});
			});
		}
		else{
			var whatAmIForServer = whatAmI.toServerCopy();
			//we return whatAmI:whatAmI, because 'whatAmI' is of type 'Resource'  
			var whatAmI = this.createPlain({}, whatAmIForServer, function(whatAmIFromServer){
				whatAmI.$resolved = whatAmI.$resolved;
				whatAmI.overrideFromServer(whatAmIFromServer);
				if(callback) callback(whatAmI);
			});
			
			//createPlain manages promises for its returning value, in our case 'whatAmI', so we need to  set its promise to the value we return
			whatAmI.$promise = whatAmI.$promise;
			whatAmI.$resolved = whatAmI.$resolved;
			
			if(whatAmI.$resolved){// for the case promise was resolved immediatelly (in synchonous manner) instead synchronously 
				whatAmI.overrideFromServer(whatAmI);
			}
		}
		//we return this value to caller as a dirty one, and then set its value to whatAmIFromServer when upper callback is called
		//TODO: a problem may occur if promise is resolved BEFORE callback is called 
		return whatAmI;
	};
	
	resource.update = function(whatAmI, callback)
	{
		console.log("resource.update");
		if(whatAmI.state == knalledge.WhatAmI.STATE_LOCAL){//TODO: fix it by going throgh queue 
			window.alert("Please, wait while entity is being saved, before updating it:\n"+whatAmI.name);
			return null;
		}
		var id = whatAmI._id;
		var whatAmIForServer = whatAmI.toServerCopy(); //TODO: move it to transformRequest ?
		if(QUEUE && false){
			KnalledgeMapQueue.execute({data: whatAmI, callback:callback, resource_type:resource.RESOURCE_TYPE, method: "create"});
			return this.updatePlain({searchParam:id, type:'one'}, whatAmIForServer, callback); //TODO: does it return whatAmI so we should fix it like in create?
		}
		else{
			return this.updatePlain({searchParam:id, type:'one'}, whatAmIForServer, callback); //TODO: does it return whatAmI so we should fix it like in create?
		}
	};
	
	resource.destroy = function(id, callback)
	{
		return this.destroyPlain({searchParam:id, type:'one'}, callback);
	};
	
	resource.execute = function(request){ //example:: request = {data: whatAmI, callback:callback, resource_type:resource.RESOURCE_TYPE, method: "create", processing: {"RESOLVE":resolve, "REJECT":reject, "EXECUTE": resource.execute, "CHECK": resource.check}};
		// var whatAmI;
		switch(request.method){
		case 'create':
			//window.alert('create skipped ;)'); break;
			var whatAmIForServer = request.data.toServerCopy();
			var whatAmIReturn = request.data;
			var callback = request.callback;
			
			var whatAmI = resource.createPlain({}, whatAmIForServer, function(whatAmIFromServer){
				whatAmIReturn.$resolved = whatAmI.$resolved;
				whatAmIReturn.overrideFromServer(whatAmIFromServer);
				request.processing.RESOLVE(whatAmIReturn);//whatAmIReturn.resolve()
				if(callback) callback(whatAmIReturn);
				KnalledgeMapQueue.executed(request);
			});
			
			//createPlain manages promises for its returning value, in our case 'whatAmI', so we need to  set its promise to the value we return
			whatAmIReturn.$promise = whatAmI.$promise;
			whatAmIReturn.$resolved = whatAmI.$resolved;
			
			if(whatAmI.$resolved){// for the case promise was resolved immediatelly (in synchonous manner) instead synchronously 
				whatAmIReturn.overrideFromServer(whatAmI);
			}
			break;
		case 'update':
			this.update;
			break;
		}
	}
	
	/* checks if request can be sent to server */
	resource.check = function(request){
		return true;
	}
	
	//KnalledgeMapQueue.link(resource.RESOURCE_TYPE, {"EXECUTE": resource.execute, "CHECK": resource.check});

	return resource;
	
}]);

/**
* 	factory 'HowAmIService'
*/

rimaServices.factory('HowAmIService', ['$resource', '$q', 'ENV', 'KnalledgeMapQueue', function($resource, $q, ENV, KnalledgeMapQueue){
	console.log("[HowAmIService] server backend: %s", ENV.server.backend);
	// creationId is parameter that will be replaced with real value during the service call from controller
	var url = ENV.server.backend + '/howAmIs/:type/:searchParam/:searchParam2.json';
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
				// console.log("[HowAmIService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[HowAmIService] accessId: %s", serverResponse.accessId);
				return serverResponse.data;
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
				console.log("[HowAmIService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[HowAmIService] accessId: %s", serverResponse.accessId);
				return serverResponse.data;
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
				//console.log("[HowAmIService] serverResponse: %s", JSON.stringify(serverResponse));
				console.log("[ng-HowAmIService::createPlain] accessId: %s", serverResponse.accessId);
				var data = serverResponse.data;
				console.log("ng-[HowAmIService::createPlain] data: %s", JSON.stringify(data));
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
					//console.log("[HowAmIService] serverResponse: %s", JSON.stringify(serverResponse));
					console.log("[HowAmIService:create] accessId: %s", serverResponse.accessId);
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
					//console.log("[HowAmIService] serverResponse: %s", JSON.stringify(serverResponse));
					console.log("[HowAmIService:create] accessId: %s", serverResponse.accessId);
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

	resource.RESOURCE_TYPE = 'HowAmI';

	resource.hows = [
		{	
			id:1,
			title:'like',
		},
		{
			id:2,
			title:'am specialized in'
		}
	];

	resource.getHows = function(){
		return this.hows;
	};

	resource.getHowForId = function(id){
		for(var i in this.hows){
			if(this.hows[i].id == id) {
				var how = this.hows[i];
				return how;
			}
		}
		return null;
	};
	
	resource.getUsersHows = function(id, callback){
		var howAmIs = this.queryPlain({ searchParam:id, type:'who_am_i'},
			function(howAmIsFromServer){
				for(var id=0; id<howAmIsFromServer.length; id++){
					var howAmI = knalledge.HowAmI.howAmIFactory(howAmIsFromServer[id]);
					howAmI.state = knalledge.HowAmI.STATE_SYNCED;
					howAmIsFromServer[id] = howAmI;
				}
				if(callback) callback(howAmIsFromServer);
		});
		return howAmIs;
	};
	
	resource.create = function(howAmI, callback)
	{
		console.log("resource.create");
		
		if(QUEUE){
			howAmI.$promise = null;
			howAmI.$resolved = false;

			howAmI.$promise = $q(function(resolve, reject) {
				KnalledgeMapQueue.execute({data: howAmI, callback:callback, resource_type:resource.RESOURCE_TYPE, method: "create", processing: {"RESOLVE":resolve, "REJECT":reject, "EXECUTE": resource.execute, "CHECK": resource.check}});
			});
		}
		else{
			var howAmIForServer = howAmI.toServerCopy();
			//we return howAmI:howAmI, because 'howAmI' is of type 'Resource'  
			var howAmI = this.createPlain({}, howAmIForServer, function(howAmIFromServer){
				howAmI.$resolved = howAmI.$resolved;
				howAmI.overrideFromServer(howAmIFromServer);
				if(callback) callback(howAmI);
			});
			
			//createPlain manages promises for its returning value, in our case 'howAmI', so we need to  set its promise to the value we return
			howAmI.$promise = howAmI.$promise;
			howAmI.$resolved = howAmI.$resolved;
			
			if(howAmI.$resolved){// for the case promise was resolved immediatelly (in synchonous manner) instead synchronously 
				howAmI.overrideFromServer(howAmI);
			}
		}
		//we return this value to caller as a dirty one, and then set its value to howAmIFromServer when upper callback is called
		//TODO: a problem may occur if promise is resolved BEFORE callback is called 
		return howAmI;
	};
	
	resource.update = function(howAmI, callback)
	{
		console.log("resource.update");
		if(howAmI.state == knalledge.HowAmI.STATE_LOCAL){//TODO: fix it by going throgh queue 
			window.alert("Please, wait while entity is being saved, before updating it:\n"+howAmI.name);
			return null;
		}
		var id = howAmI._id;
		var howAmIForServer = howAmI.toServerCopy(); //TODO: move it to transformRequest ?
		if(QUEUE && false){
			KnalledgeMapQueue.execute({data: howAmI, callback:callback, resource_type:resource.RESOURCE_TYPE, method: "create"});
			return this.updatePlain({searchParam:id, type:'one'}, howAmIForServer, callback); //TODO: does it return howAmI so we should fix it like in create?
		}
		else{
			return this.updatePlain({searchParam:id, type:'one'}, howAmIForServer, callback); //TODO: does it return howAmI so we should fix it like in create?
		}
	};
	
	resource.destroy = function(id, callback)
	{
		return this.destroyPlain({searchParam:id, type:'one'}, callback);
	};
	
	resource.execute = function(request){ //example:: request = {data: howAmI, callback:callback, resource_type:resource.RESOURCE_TYPE, method: "create", processing: {"RESOLVE":resolve, "REJECT":reject, "EXECUTE": resource.execute, "CHECK": resource.check}};
		// var howAmI;
		switch(request.method){
		case 'create':
			//window.alert('create skipped ;)'); break;
			var howAmIForServer = request.data.toServerCopy();
			var howAmIReturn = request.data;
			var callback = request.callback;
			
			var howAmI = resource.createPlain({}, howAmIForServer, function(howAmIFromServer){
				howAmIReturn.$resolved = howAmI.$resolved;
				howAmIReturn.overrideFromServer(howAmIFromServer);
				request.processing.RESOLVE(howAmIReturn);//howAmIReturn.resolve()
				if(callback) callback(howAmIReturn);
				KnalledgeMapQueue.executed(request);
			});
			
			//createPlain manages promises for its returning value, in our case 'howAmI', so we need to  set its promise to the value we return
			howAmIReturn.$promise = howAmI.$promise;
			howAmIReturn.$resolved = howAmI.$resolved;
			
			if(howAmI.$resolved){// for the case promise was resolved immediatelly (in synchonous manner) instead synchronously 
				howAmIReturn.overrideFromServer(howAmI);
			}
			break;
		case 'update':
			this.update;
			break;
		}
	}
	
	/* checks if request can be sent to server */
	resource.check = function(request){
		return true;
	}
	
	//KnalledgeMapQueue.link(resource.RESOURCE_TYPE, {"EXECUTE": resource.execute, "CHECK": resource.check});

	return resource;
	
}]);

rimaServices.provider('RimaService', {
	// privateData: "privatno",
	$get: ['$q', 'ENV', 'WhoAmIService', 'WhatAmIService', 'HowAmIService', /*'$rootScope', */
	function($q, ENV, WhoAmIService, WhatAmIService, HowAmIService /*, $rootScope*/) {
		var provider = {
			ANONYMOUS_USER_ID: "55268521fb9a901e442172f9",
			whoAmIs: [],
			loggedInWhoAmI: new knalledge.WhoAmI(),
			selectedWhoAmI: null,

			init: function(){
				this.loggedInWhoAmI._id = this.ANONYMOUS_USER_ID;
				this.loggedInWhoAmI.displayName = "anonymous";
				this.selectedWhoAmI = this.loggedInWhoAmI;
			},
				
			loadUsersFromList: function(usersIds, callback){
				var that = this;
				var whoAmIs = WhoAmIService.getByIds(usersIds,
					function(whoAmIsFromServer){
						that.whoAmIs = whoAmIsFromServer;
						//that.selectedWhoAmI = (that.whoAmIs && that.whoAmIs.length) ? that.whoAmIs[0] : null; //TODO: set it to logged-in user
						if(callback){callback();}
					});
				return whoAmIs;
			},

			getUsers: function(){
				return this.whoAmIs;
			},

			getUserById: function(id){
				for(var i in this.whoAmIs){
					if(this.whoAmIs[i]._id == id){
						return this.whoAmIs[i];
					}
				}
				return null;
			},

			selectActiveUser: function(whoAmI){
				this.selectedWhoAmI = whoAmI;
			},

			getActiveUser: function(){
				return this.selectedWhoAmI;
			},

			getActiveUserId: function(){
				return this.selectedWhoAmI ? this.selectedWhoAmI._id : undefined;
			},

			getMaxUserNum: function(){
				var gridMaxNum = 0;
				var whoAmIs = this.whoAmIs();
				for(var i in whoAmIs){
					var grid = whoAmIs[i];
					var gridId = parseInt(grid.name.substring(2));
					if(gridId > gridMaxNum){
						gridMaxNum = gridId;
					}
				}
				return gridMaxNum;
			},

			getHows: function(){
				return HowAmIService.getHows();
			},

			getHowForId: function(id){
				var how = HowAmIService.getHowForId(id);
				return how;
			},

			getUsersHows: function(id, callback){
				var hows = HowAmIService.getUsersHows(id, function(hows){
					if(callback){callback(hows);}
				});
				return hows;
			},

			createHowAmI: function(howAmI, callback){
				var howAmI = HowAmIService.create(howAmI, function(howAmIFromServer){
					if(callback){callback(howAmIFromServer);}
				});
				return howAmI;
			},

			/*
			finds all users whos name contains *nameSubSt
			*/
			getUsersByName: function(nameSubStr){
				var returnedGrids = [];
				var whoAmIs = this.whoAmIs();
				for(var i in whoAmIs){
					var grid = whoAmIs[i];
					if(grid.name.indexOf(nameSubStr) > -1){
						returnedGrids.push(grid);
					}
				}
				return returnedGrids;
			}
		};
		provider.init();
		return provider;
	}]
});

}()); // end of 'use strict';