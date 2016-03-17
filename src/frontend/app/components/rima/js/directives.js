(function () { // This prevents problems when concatenating scripts that aren't strict.
'use strict';

var guidanceCurrentStep = 0;
var guidanceSteps = [
	{
		name: 'enter_what',
		classes: ['enter_what_1', 'enter_what_2']
	},
	{
		name: 'enter_how',
		classes: ['enter_how']
	},
	{
		name: 'add_who',
		classes: ['add_who']
	}
];

var getIdFromStep = function(stepName){
	for(var i=0; i<guidanceSteps.length; i++){
		if(guidanceSteps[i].name == stepName) return i;
	}
	return -1;
};

var guidanceStart = function($timeout, $element){
	guidanceCurrentStep = 0;
	for(var i in guidanceSteps[guidanceCurrentStep].classes){
		triggerPopup($timeout, $element, '.guidance_'+guidanceSteps[guidanceCurrentStep].classes[i], 'openTrigger', guidanceCurrentStep, 1500);
	}
};

var guidanceProcessStep = function($timeout, $element, stepName){
	var id = getIdFromStep(stepName);
	if(id == guidanceCurrentStep){
		var i;
		for(var i in guidanceSteps[guidanceCurrentStep].classes){
			triggerPopup($timeout, $element, '.guidance_'+guidanceSteps[guidanceCurrentStep].classes[i], 'closeTrigger', guidanceCurrentStep);
		}
		if(guidanceCurrentStep < guidanceSteps.length-1){
			guidanceCurrentStep++;
			var newStepName = guidanceSteps[guidanceCurrentStep].name;
			for(var i in guidanceSteps[guidanceCurrentStep].classes){
				triggerPopup($timeout, $element, '.guidance_'+guidanceSteps[guidanceCurrentStep].classes[i], 'openTrigger', guidanceCurrentStep);
			}
		}
	}
};

var triggerPopup = function($timeout, $element, selector, event, stepNo, delay){
	if (typeof delay == 'undefined') delay = 25;
	// http://stackoverflow.com/questions/12729122/prevent-error-digest-already-in-progress-when-calling-scope-apply
	// http://stackoverflow.com/questions/22447374/how-to-trigger-ng-click-angularjs-programmatically
	// https://docs.angularjs.org/api/ng/function/angular.element
	$timeout(function () {
		if(stepNo >= guidanceCurrentStep || event != 'openTrigger')
		$element.find(selector).triggerHandler( event );
	}, delay);
};

angular.module('rimaDirectives', ['Config', 'knalledgeMapServices'])
	.directive('rimaRelevantList', ['$rootScope',
		function($rootScope){
		console.log("[rimaRelevantList] loading directive");
		return {
			restrict: 'AE',
			scope: {
				'readonly': '=',
				'node': "="
			},
			// ng-if directive: http://docs.angularjs.org/api/ng.directive:ngIf
			// expression: http://docs.angularjs.org/guide/expression
			templateUrl: 'components/rima/partials/rima_relevant_list.tpl.html',
			controller: function ( $scope, $element) {
				$scope.bindings = {
				};
			}
		};
	}])

	.directive('rimaUsersList', ["$rootScope", "$timeout", '$injector', "RimaService",
		function($rootScope, $timeout, $injector, RimaService){
		console.log("[rimaUsersList] loading directive");
		var GlobalEmitterServicesArray = $injector.get('GlobalEmitterServicesArray');
		var mapStylingChangedEventName = "mapStylingChangedEvent";
		GlobalEmitterServicesArray.register(mapStylingChangedEventName);

		return {
			restrict: 'AE',
			scope: {
			},
			// ng-if directive: http://docs.angularjs.org/api/ng.directive:ngIf
			// expression: http://docs.angularjs.org/guide/expression
			templateUrl: 'components/rima/partials/rimaUsers-list.tpl.html',
			controller: function ( $scope, $element) {
				var init = function(){
					$scope.items = [];

					$scope.$watch(function () {
						return RimaService.whoAmIs;
					},
					function(newValue){
						$scope.items.length = 0;
						//alert("RimaService.howAmIs changed: " + JSON.stringify(newValue));
						for(var i=0; i<RimaService.whoAmIs.length; i++){
							var item = RimaService.whoAmIs[i];
							// @TODO: Fix to filter by authors that belong to the map
							//TODO: ??? @SASHA dodao ovo??: if(item.origin === 'TTT'){
								$scope.items.push(item);
							//}
						}
					}, true);

					// var compare = function(a,b) {
					//   if (a.displayName < b.displayName)
					//     return 1;
					//   if (a.displayName > b.displayName)
					//     return -1;
					//   return 0;
					// }
					// $scope.items.sort(compare);
					$scope.selectedItem = RimaService.getActiveUser();
					$scope.howAmIs = RimaService.getAllHows();
				};
				$scope.config = RimaService.config;
				$scope.configChanged = function(){
					GlobalEmitterServicesArray.get(mapStylingChangedEventName).broadcast('rimaUsersList');
				};
				$scope.items = null;
				$scope.selectedItem = null;
				 //TODO: select from map.dataContent.mcm.authors list
				//RimaService.loadUsersFromList().$promise.then(init); //TODO: change to load from MAP

				init();
				$scope.selectItem = function(item) {
					$scope.selectedItem = item;
					console.log("$scope.selectedItem = " + $scope.selectedItem.displayName + ": " + $scope.selectedItem._id);
					RimaService.selectActiveUser(item);
				};
				$scope.switchClicked = function($el){
					var elSwitch = $element.find('.content');
					$(elSwitch).slideToggle();
					// console.log("Switching: ", $el);
				}
			}
		};
	}])

	.directive('rimaRelevantWhatsList', ['$rootScope', '$injector', 'KnalledgeMapVOsService', 'RimaService',
		function($rootScope, $injector, KnalledgeMapVOsService, RimaService){
		console.log("[rimaRelevantWhatsList] loading directive");
		var GlobalEmitterServicesArray = $injector.get('GlobalEmitterServicesArray');
		var changeSelectedNodeEventName = "changeSelectedNodeEvent";
		GlobalEmitterServicesArray.register(changeSelectedNodeEventName);
		return {
			restrict: 'AE',
			scope: {
				'readonly': '=',
				'node': "="
			},
			// ng-if directive: http://docs.angularjs.org/api/ng.directive:ngIf
			// expression: http://docs.angularjs.org/guide/expression
			templateUrl: 'components/rima/partials/rima-relevant_whats_list.tpl.html',
			controller: function ( $scope, $element) {
				$scope.bindings = {
				};

				$scope.items = [];

				var updateList = function(){
					$scope.items.length = 0;

					var userHows = RimaService.howAmIs[RimaService.getActiveUserId()]; // TODO: Sasa want logged in user also [RimaService.loggedInWhoAmI._id];
					for (var i in KnalledgeMapVOsService.mapStructure.nodesById){
						var vkNode = KnalledgeMapVOsService.mapStructure.nodesById[i];
						var nodeWhats = (vkNode && vkNode.kNode.dataContent && vkNode.kNode.dataContent.rima && vkNode.kNode.dataContent.rima.whats) ?
							vkNode.kNode.dataContent.rima.whats : [];

						var relevantWhats = [];
						// TODO: can be optimized by hash of userHows
						for(var i=0;i<nodeWhats.length;i++){
							var nodeWhat = nodeWhats[i];
							for(var j in userHows){
								var userHow = userHows[j];
								if (userHow && userHow.whatAmI && (userHow.whatAmI.name == nodeWhat.name))
								{
									relevantWhats.push(userHow.whatAmI);
								}
							}
						}
						if(relevantWhats.length!=0){
							var whats = [
								{
									name: "knalledge",
									relevant: true
								},
								{
									name: "science",
									relevant: false
								}
							]
							$scope.items.push(
								{
									_id: vkNode.kNode._id,
									name: vkNode.kNode.name,
									vkNode: vkNode,
									whats: relevantWhats
								}
							);
						}
					}
				};

				$scope.$watch(function () {
					return RimaService.howAmIs;
				},
				function(newValue){
					//alert("RimaService.howAmIs changed: " + JSON.stringify(newValue));
					updateList();
				}, true);

				$scope.$watch(function () {
					// return KnalledgeMapVOsService.mapStructure.nodesById;
					return KnalledgeMapVOsService.nodesById;
				},
				function(newValue){
					//alert("RimaService.howAmIs changed: " + JSON.stringify(newValue));
					console.log("[KnalledgeMapVOsService.mapStructure.nodesById watch]: elements no: %d", Object.keys(newValue).length);
					updateList();
				}, true);
				$scope.$watch(function () {
					// return KnalledgeMapVOsService.mapStructure.nodesById;
					return RimaService.getActiveUser();
				},
				function(newValue){
					//alert("RimaService.howAmIs changed: " + JSON.stringify(newValue));
					console.log("[KnalledgeMapVOsService.mapStructure.nodesById watch]: elements no: %d", Object.keys(newValue).length);
					updateList();
				}, true);

				// $scope.$watch(function () {
				//  return KnalledgeMapVOsService.mapStructure.selectedNode;
				// },
				// function(newValue){
				//  //alert("RimaService.howAmIs changed: " + JSON.stringify(newValue));
				//  updateList();
				// }, true);

				$scope.selectItem = function(item) {
					$scope.selectedItem = item;
					console.log("$scope.selectedItem = %s", $scope.selectedItem.name);
					GlobalEmitterServicesArray.get(changeSelectedNodeEventName).broadcast('rimaWhats', item.vkNode);
				};

				updateList();
			}
		};
	}])

	.directive('rimaUsersConnections', ['$rootScope', 'KnalledgeMapVOsService', 'RimaService',
		function($rootScope, KnalledgeMapVOsService, RimaService){
		console.log("[rimaRelevantWhatsList] loading directive");
		return {
			restrict: 'AE',
			scope: {
				'readonly': '=',
				'node': "="
			},
			// ng-if directive: http://docs.angularjs.org/api/ng.directive:ngIf
			// expression: http://docs.angularjs.org/guide/expression
			templateUrl: 'components/rima/partials/rima-users-connections.tpl.html',
			controller: function ( $scope, $element) {
				$scope.bindings = {
				};

				var usersAll = RimaService.getUsers();
				var users_ignored = {"55268521fb9a901e442172f8":true,"556760847125996dc1a4a219":true};
				var hows_ignored = {"4":true}; //TODO: temp - ignoring because of overconnectedness through this - people have chosen topics of TNC Online dialogue through this how-verb
				var force = null;

				var width = 960, height = 600;
				var svg = d3.select("div.users-graph").append("svg")
							.attr("width", width)
							.attr("height", height);

				var update = function(){

					//!!! TODO: check for improving performance of this algorithm!! it is ~ O(n4)!!

					var links = [];
					var users=[];

					for(var i = 0; i<usersAll.length; i++){
						if(users_ignored.hasOwnProperty(usersAll[i]._id) || usersAll[i].displayName == "" || typeof usersAll[i].displayName == undefined){continue;}
						users.push({_id:usersAll[i]._id, name:usersAll[i].displayName});
					}

					for(var i = 0; i<users.length; i++){ // we go through all users

						var userI = users[i];
						if(!RimaService.howAmIs.hasOwnProperty(userI._id)){continue;}
						var userIHows = RimaService.howAmIs[userI._id]; //take their userHows
						for(var ih = 0; ih<userIHows.length; ih++){ // go through all their userHows
							var userIHow = userIHows[ih]; //and for each of their hows
							for(var j = i; j<users.length; j++){ // we check in all other users (except those already passed)
								if(i == j){continue;}
								//if(users_ignored.hasOwnProperty(users[j]._id) || users[j].displayName == "" || typeof users[j].displayName == undefined){continue;}
								var userJ = users[j];
								if(!RimaService.howAmIs.hasOwnProperty(userJ._id)){continue;}
								var userJHows = RimaService.howAmIs[userJ._id]; //by taking their userHows
								for(var jh = 0; jh<userJHows.length; jh++){ // go through all their userHows
									var userJHow = userJHows[jh]; //and for each of their hows
									if (userIHow.whatAmI._id == userJHow.whatAmI._id && (!hows_ignored.hasOwnProperty(userIHow.how) && !hows_ignored.hasOwnProperty(userJHow.how)))
									{
										var foundLink = false;
										for(var l=0;l<links.length; l++){ // we go through existing links among users:
											var link = links[l];
											//TODO: check if we should increase it for multiple how_verb connections with the same WhatAmI
											//if((link.source == userI._id && link.target == userJ._id) || (link.source == userJ._id && link.target == userI._id)){ //if we find one, we increas its value
											if((link.source == users[i] && link.target == users[j]) || (link.source == users[j] && link.target == users[i])){ //if we find one, we increas its value
												link.value+=1;
												foundLink = true;
												break;
											}
										}
										if(!foundLink){
											links.push({source:users[i], target:users[j], value:1, whatAmI:userIHow.whatAmI.name});
											//links.push({source:userI._id, target:userJ._id, value:1});
										}
									}
								}
							}
						}
					}


					if(users.length>1){

						//users = [{name:"2", value:1},{name:"dd", value:2},{name:"dde", value:3}];
						//links = [{source:users[0],target:users[1],value:1},{source:users[1],target:users[2],value:5}];
						//links = [{source:0,target:1,value:1},{source:1,target:2,value:5}];
						//links = [];

						force = d3.layout.force()
							.nodes(d3.values(users))
							.links(links)
							.size([width, height])
							.linkDistance(300)
							.charge(-100)
							.on("tick", tick)
							.start();

						//console.log("force:" + force);



						// build the arrow.
						// svg.append("svg:defs").selectAll("marker")
						//     .data(["end"])      // Different link/path types can be defined here
						//   .enter().append("svg:marker")    // This section adds in the arrows
						//     .attr("id", String)
						//     .attr("viewBox", "0 -5 10 10")
						//     .attr("refX", 15)
						//     .attr("refY", -1.5)
						//     .attr("markerWidth", 6)
						//     .attr("markerHeight", 6)
						//     .attr("orient", "auto")
						//   .append("svg:path")
						//     .attr("d", "M0,-5L10,0L0,5");

						// add the links and the arrows
						var path = svg.append("svg:g").selectAll("path")
							.data(force.links())
						  .enter().append("svg:path")
						//    .attr("class", function(d) { return "link " + d.type; })
							.attr("class", "link")
							.attr('stroke-width', function(d) { return d.value; })
							.attr("marker-end", "url(#end)");

						var linktext = svg.append("svg:g").selectAll("g.linklabelholder").data(force.links());

					    linktext.enter().append("g").attr("class", "linklabelholder")
					     .append("text")
					     .attr("class", "linklabel")
						 .style("font-size", "13px")
					     .attr("x", "50")
						 .attr("y", "-20")
					     .attr("text-anchor", "start")
						   .style("fill","#000")
						 .append("textPath")
					   // .attr("xlink:href",function(d,i) { return "#linkId_" + i;})
					     .text(function(d) {
						 return "ldf";//d.type;
						 });

						// path.append("text")
						// 	.attr("x", 12)
						// 	.attr("dy", ".35em")
						// 	.text(function(d) { return "d.whatAmI"; });

						 // path
						 // .attr('stroke-width', function(d) { return d.value; }); //TODO - not working

						// define the nodes
						var node = svg.selectAll(".node")
							.data(force.nodes())
						  .enter().append("g")
							.attr("class", "node")
							.on("click", click)
    						//.on("dblclick", dblclick)
							.call(force.drag);

						// add the nodes
						node.append("circle")
						    .attr("r", 7);

						// add the text
						node.append("text")
							.attr("x", 12)
							.attr("dy", ".35em")
							.text(function(d) { return d.name; });

						// action to take on mouse click
						var click = function() {
							this.__data__.selected = !this.__data__.selected;
							if(this.__data__.selected){

							    //d3.select(node).selectedNode(this);
							    selectNode(this);
							    var selectedNode = this;
							    d3.selectAll("path").attr("class", function(d) {
							    	if(d.target._id == selectedNode.__data__._id || d.source._id == selectedNode.__data__._id){return "selected";}else{return "unselected";}
							    });
	                    		//d3.select(this).style("fill", "black");
                    		}
                    		else{
                    			d3.select(this).select("circle").transition()
							        .duration(750)
							        .attr("r", 6)
							        .style("fill", "#ccc");
							    d3.select(this).select("text").transition()
							        .duration(750)
							        .attr("x", 12)
							        .style("stroke", "none")
							        .style("fill", "black")
							        .style("stroke", "none")
							        .style("font", "10px sans-serif");
							    d3.selectAll("path").attr("class", 'unselected');
                    		}
						}

						var selectNode = function(node){
							d3.select(node).select("text").transition()
							        .duration(750)
							        .attr("x", 22)
							        .style("fill", "steelblue")
							        .style("stroke", "lightsteelblue")
							        .style("stroke-width", ".5px")
							        .style("font", "20px sans-serif");
							    d3.select(node).select("circle").transition()
							        .duration(750)
							        .attr("r", 16)
							        .style("fill", "lightsteelblue");
						}

						// action to take on mouse double click
						var dblclick = function() {

						}

						var tick = function() {
							// add the curvy lines:
						    path.attr("d", function(d) {
						        var dx = d.target.x - d.source.x,
						            dy = d.target.y - d.source.y,
						            dr = Math.sqrt(dx * dx + dy * dy);
						        return "M" +
						            d.source.x + "," +
						            d.source.y + "A" +
						            dr + "," + dr + " 0 0,1 " +
						            d.target.x + "," +
						            d.target.y;
						    });

						    node
						        .attr("transform", function(d) {
						  	    return "translate(" + d.x + "," + d.y + ")"; });
						}
					}

					// Compute the distinct nodes from the links.
					// links.forEach(function(link) {
					//     link.source = nodes[link.source] ||
					//         (nodes[link.source] = {name: link.source});
					//     link.target = nodes[link.target] ||
					//         (nodes[link.target] = {name: link.target});
					//     link.value = +link.value;
					// });
				};

				$scope.$watch(function () {
					return RimaService.howAmIs;
				},
				function(newValue){
					//alert("RimaService.howAmIs changed: " + JSON.stringify(newValue));
					update();
				}, true);

				$scope.$watch(function () {
					// return KnalledgeMapVOsService.mapStructure.nodesById;
					return RimaService.whoAmIs;
				},
				function(newValue){
					//alert("RimaService.howAmIs changed: " + JSON.stringify(newValue));
					// console.log("[KnalledgeMapVOsService.mapStructure.nodesById watch]: elements no: %d", Object.keys(newValue).length);
					update();
				}, true);

				update();
			}
		};
	}])

	.directive('rimaUsersConnectionsMap', ['$rootScope', 'KnalledgeMapVOsService', 'RimaService',
		function($rootScope, KnalledgeMapVOsService, RimaService){
		console.log("[rimaRelevantWhatsList] loading directive");
		return {
			restrict: 'AE',
			scope: {
				'readonly': '=',
				'node': "="
			},
			// ng-if directive: http://docs.angularjs.org/api/ng.directive:ngIf
			// expression: http://docs.angularjs.org/guide/expression
			templateUrl: 'components/rima/partials/rima-users-connections-map.tpl.html',
			controller: function ( $scope, $element) {
				$scope.bindings = {
				};

				var nodes=[];
				var edges = [];
				var pathSvg = null;
				var nodeSvg = null;

				$scope.mapConfigForInjecting = {
					tree: {
						viewspec: "viewspec_graph", // "viewspec_tree" // "viewspec_manual"
						fixedDepth: {
							enabled: false,
							levelDepth: 150
						},
						sizing: {
							setNodeSize: true,
							nodeSize: [200, 100]
						},
						margin: {
							top: 10,
							left: 20,
							right: 100,
							bottom: 10
						},
						mapService: {
							enabled: false
						}
					},
					nodes: {
						html: {
							dimensions: {
								sizes: {
									width: 100
								}
							}
						},
					},
					keyboardInteraction: {
						enabled: false
					},
					draggingConfig: {
						enabled: false
					}
				};

				var properties = {
					name: "Users-graph",
					date: "",
					authors: "CollaboScience Module",
					mapId: null,
					rootNodeId: null
				};
				$scope.mapDataForInjecting = {
					properties: properties,
					map: {
						nodes: nodes, // kNodesById,
						edges: edges, // kEdgesById
					},
					selectedNode: null // the root node in the map
				};

				var usersAll = RimaService.getUsers();
				var users_ignored = {"55268521fb9a901e442172f8":true, "556760847125996dc1a4a219":true};
				var hows_ignored = {"4":true}; //TODO: temp - ignoring because of overconnectedness through this - people have chosen topics of TNC Online dialogue through this how-verb

				var generateNodesAndEdges = function(nodes, edges){
					//!!! TODO: check for improving performance of this algorithm!! it is ~ O(n4)!!

					nodes.length = 0;
					edges.length = 0;

					for(var i = 0; i<usersAll.length; i++){
						if(users_ignored.hasOwnProperty(usersAll[i]._id) || usersAll[i].displayName == "" || typeof usersAll[i].displayName == undefined){continue;}
						var kNode = new knalledge.KNode();
						kNode._id = usersAll[i]._id;
						kNode.name = usersAll[i].displayName;
						if(!kNode.visual) kNode.visual = {};
						kNode.visual.selectable = true;
						nodes.push(kNode);
					}

					for(var i = 0; i<nodes.length; i++){ // we go through all users
						var userI = nodes[i];
						if(!RimaService.howAmIs.hasOwnProperty(userI._id)){continue;}
						var userIHows = RimaService.howAmIs[userI._id]; //take their userHows
						for(var ih = 0; ih<userIHows.length; ih++){ // go through all their userHows
							var userIHow = userIHows[ih]; //and for each of their hows
							for(var j = i; j<nodes.length; j++){ // we check in all other users (except those already passed)
								if(i == j){continue;}
								//if(users_ignored.hasOwnProperty(users[j]._id) || users[j].displayName == "" || typeof users[j].displayName == undefined){continue;}
								var userJ = nodes[j];
								if(!RimaService.howAmIs.hasOwnProperty(userJ._id)){continue;}
								var userJHows = RimaService.howAmIs[userJ._id]; //by taking their userHows
								for(var jh = 0; jh<userJHows.length; jh++){ // go through all their userHows
									var userJHow = userJHows[jh]; //and for each of their hows
									if (userIHow.whatAmI._id == userJHow.whatAmI._id && (!hows_ignored.hasOwnProperty(userIHow.how) && !hows_ignored.hasOwnProperty(userJHow.how)))
									{
										var foundEdge = false;
										for(var l=0;l<edges.length; l++){ // we go through existing edges among users:
											var edge = edges[l];
											//TODO: check if we should increase it for multiple how_verb connections with the same WhatAmI
											//if((edge.source == userI._id && edge.target == userJ._id) || (edge.source == userJ._id && edge.target == userI._id)){ //if we find one, we increas its value
											if((edge.sourceId == nodes[i]._id && edge.targetId == nodes[j]._id) || (edge.sourceId == nodes[j]._id && edge.targetId == nodes[i]._id)){ //if we find one, we increas its value
												edge.value+=1;
												foundEdge = true;
												break;
											}
										}
										if(!foundEdge){
											var edge = new knalledge.KEdge();
											edge.sourceId = nodes[i]._id;
											edge.targetId = nodes[j]._id;
											edge.value = 1;
											edge.name = userIHow.whatAmI.name;
											edges.push(edge);
										}
									}
								}
							}
						}
					}
				};

				var updateGraph = function(){
					if(nodes.length > 0){
						properties.rootNodeId =  null;//nodes[0]._id;
						$scope.mapDataForInjecting.map.nodes = nodes; // kNodesById,
						$scope.mapDataForInjecting.map.edges = edges; // kNodesById,
						$scope.mapDataForInjecting.selectedNode = nodes[0]; // kNodesById,
					}
				}

				$scope.$watch(function() {
					return RimaService.howAmIs;
				},
				function(newValue){
					generateNodesAndEdges(nodes, edges);
					updateGraph();
				}, true);

				$scope.$watch(function() {
					// return KnalledgeMapVOsService.mapStructure.nodesById;
					return RimaService.whoAmIs;
				},
				function(newValue){
					//alert("RimaService.howAmIs changed: " + JSON.stringify(newValue));
					// console.log("[KnalledgeMapVOsService.mapStructure.nodesById watch]: elements no: %d", Object.keys(newValue).length);
					generateNodesAndEdges(nodes, edges);
					updateGraph();
				}, true);

				generateNodesAndEdges(nodes, edges);
				updateGraph();
			}
		};
	}])

	.directive('rimaWhats', ['$rootScope', '$injector', 'RimaService',
		function($rootScope, $injector, RimaService){
		console.log("[rimaWhats] loading directive");

		var GlobalEmitterServicesArray = $injector.get('GlobalEmitterServicesArray');

		var changeKnalledgeRimaEventName = "changeKnalledgeRimaEvent";
		GlobalEmitterServicesArray.register(changeKnalledgeRimaEventName);

		return {
			restrict: 'AE',
			scope: {
				'readonly': '=',
				'node': "="
			},
			// ng-if directive: http://docs.angularjs.org/api/ng.directive:ngIf
			// expression: http://docs.angularjs.org/guide/expression
			templateUrl: 'components/rima/partials/rima-whats.tpl.html',
			controller: function ( $scope, $element) {
				$scope.bindings = {
					viewspec: 'viewspec_manual'
				};

				 $(this).addClass('hidden');

				$scope.items = ($scope.node && $scope.node.kNode.dataContent && $scope.node.kNode.dataContent.rima
					&& $scope.node.kNode.dataContent.rima.whats) ? $scope.node.kNode.dataContent.rima.whats : [];

				$scope.$watch("node", function(newVal, oldVal){
					console.log('node changed');
					$scope.items = ($scope.node && $scope.node.kNode.dataContent && $scope.node.kNode.dataContent.rima
						&& $scope.node.kNode.dataContent.rima.whats) ? $scope.node.kNode.dataContent.rima.whats : [];
				}, false);


				$scope.getItems = function(value){
					var items = RimaService.getByNameContains(value);
					// return items.$promise;
					// return items.$promise.then(function(items_server){
					//  console.log("getItems: ", JSON.stringify(items_server));
					//  return items_server;
					// });
					// items.$promise.then(function(items_server){
					//  window.alert("getItems: " + JSON.stringify(items_server));
					//  return items_server;
					// });
					return items.$promise;
					// return items;
				};

				$scope.enterPressed = function(value){
					console.log("Enter pressed. value: %s", value);
					$scope.addNewWhat(value);
				};

				$scope.addClicked = function(value){
					console.log("Add clicked. value: %s", value);
					$scope.addNewWhat(value);
				};

				$scope.addNewWhat = function(what){

					//RimaService.getWhatsById(['554c14a6d25c460d4f225ee7','554d3d40b77c84c474e0140c']);

					// not clicked on any item, but just type a string
					if(!$scope.node){
						console.log("Node is not selected");
						return;
					}
					$scope.asyncSelected = "";
					var kNode = $scope.node.kNode;
					console.log("Adding new what to the node: %s", kNode._id);
					if(!kNode.dataContent) kNode.dataContent = {};
					if(!kNode.dataContent.rima) kNode.dataContent.rima = {};
					if(!kNode.dataContent.rima.whats){
						kNode.dataContent.rima.whats = [];
						// create binding in the case of creating a new list
						$scope.items = kNode.dataContent.rima.whats;
					}

					var newWhat = null;
					if(typeof what === 'string'){
						newWhat = new knalledge.WhatAmI();
						newWhat.name = what;
					}else{
						newWhat = what;
					}

					for(var i=0;i<kNode.dataContent.rima.whats.length;i++){
						if(kNode.dataContent.rima.whats[i].name == newWhat.name){
							window.alert("The node is already described by '"+newWhat.name+"'");
							return;
						}
					}

					// kNode.dataContent.rima.whats.push(newWhat);
					// $scope.asyncSelected = "";
					// var changeKnalledgeRimaEventName = "changeKnalledgeRimaEvent";
					// $rootScope.$broadcast(changeKnalledgeRimaEventName, $scope.node);


					var whatCreated = function(whatFromServer){
						console.log("whatCreated", whatFromServer);
						saveNodeWIthNewWhat(whatFromServer);
					}

					var saveNodeWIthNewWhat = function(what){ // TODO: it should be just _id;
						kNode.dataContent.rima.whats.push(what);
						$scope.asyncSelected = "";
						GlobalEmitterServicesArray.get(changeKnalledgeRimaEventName).broadcast('rimaWhats', $scope.node);
					}

					if(typeof what === 'string'){ //new what
						var newWhat = new knalledge.WhatAmI();
						newWhat.name = what;
						RimaService.createWhatAmI(newWhat).$promise.then(whatCreated);
					}else{ //already existing what (found through typeahead)
						console.log("already existing what '%s' (found through typeahead)", what);
						saveNodeWIthNewWhat(what);
					}
				};

				$scope.newItemSelected = function($item, $model, $label){
					console.log("newItemSelected: $item: %s, $model: %s, $label: %s", JSON.stringify($item), JSON.stringify($model), JSON.stringify($label));
				};

				$scope.itemSelect = function(item){
					console.log("itemSelect: %s", item.name);
				};

				$scope.itemRemove = function(item){
					console.log("itemRemove: %s", item.name);
					for(var i=0; i<$scope.items.length; i++){
						if($scope.items[i]._id == item._id){
							$scope.items.splice(i, 1);
							GlobalEmitterServicesArray.get(changeKnalledgeRimaEventName).broadcast('rimaWhats', $scope.node);
						}
					}
				};
			}
		};
	}])

	.directive('rimaHows', ["$rootScope", "$timeout", "$location", "RimaService",
		function($rootScope, $timeout, $location, RimaService){
		console.log("[rimaHows] loading directive");

		return {
			restrict: 'AE',
			scope: {
				isActive: "=",
				whoAmIType: "="
			},
			// ng-if directive: http://docs.angularjs.org/api/ng.directive:ngIf
			// expression: http://docs.angularjs.org/guide/expression
			templateUrl: 'components/rima/partials/rima-hows.tpl.html',
			link: function ( $scope, $element) {
				// triggerPopup($timeout, $element, "#testing_input");
				// guidanceStart($timeout, $element);
			},
			controller: function ( $scope, $element) {
				// triggerPopup($timeout, $element, "#testing_input");

				$scope.$watch("isActive", function(value){
					if(value == true){
						guidanceStart($timeout, $element);
					}
				});

				var whatsLimit = 70;
				var init = function(){

					console.log("whoAmIType:"+$scope.whoAmIType);
					switch($scope.whoAmIType){
						case 'logged_in':
							$scope.whoAmI = RimaService.loggedInWhoAmI;
						break;
						case 'active':
							$scope.whoAmI = RimaService.selectedWhoAmI;
							$scope.$watch(function () {
								return RimaService.getActiveUser();
							},
							function(newValue){
								initUserSpecific();
							}, true);
						break;
					}
					initUserSpecific();
					//$scope.modal.formData.contentTypeId= option.contentTypes[0].id;
					$scope.selectedHowOption = $scope.hows[0].id;
					//$scope.selectedItem = RimaService.getActiveUser();
					$scope.whats = RimaService.getAllWhats(whatsLimit);
				}

				var initUserSpecific = function(){
					$scope.whoAmI = RimaService.selectedWhoAmI;
					$scope.items = RimaService.getUsersHows($scope.whoAmI._id);
					$scope.displayName = $scope.whoAmI.displayName;
				}

				$scope.whoAmI = null;
				$scope.items = null;
				$scope.whats = null;
				$scope.selectedItem = null;
				$scope.selectedWhat = null;

				//html-select:
				$scope.hows = RimaService.getHowVerbs();

				$scope.isMe = function(){
					return $scope.whoAmIType =='logged_in';
				}

				$scope.inputWhatChanged = function(){
					guidanceProcessStep($timeout, $element, "enter_what");
				};

				$scope.howSelectChanged = function(){
					guidanceProcessStep($timeout, $element, "enter_how");
				};

				$scope.howById = function(id){
					// if(id !== 'undefined'){
					return RimaService.getHowForId(id).title;
					// }
					// else{
					//  return new knalledge.HowAmI();
					// }
				};

				$scope.haveHows = function(){
					return $scope.items.length != 0;
				};
				$scope.createHow = function(){
					guidanceProcessStep($timeout, $element, "add_who");

					var createdHow = function(howFromServer){
						//done already in service: ahowFromServer.whatAmI = RimaService.getWhatById(howFromServer.whatAmI);
						//already bound to the howAmIs array in the RIMA service, so this would cause duplicates: $scope.items.push(howFromServer);
					}

					var selectedHow = RimaService.getHowForId($scope.selectedHowOption);

					for(var i=0;i<$scope.items.length;i++){
						var item = $scope.items[i];
						var whatName = (typeof $scope.whatInput === 'string') ? $scope.whatInput : $scope.whatInput.name;
						if(selectedHow.id == item.how && whatName.toLowerCase() == item.whatAmI.name.toLowerCase()){
							window.alert("You have already described yourself through this");
							return;
						}
					}

					var how = new knalledge.HowAmI();
					how.whoAmI = $scope.whoAmI._id;
					how.how = selectedHow.id;

					//how.whatAmI = $scope.whatInput; //TODO:

					var whatCreated = function(whatFromServer){
						console.log("whatCreated", whatFromServer);
						saveHowWIthNewWhat(whatFromServer._id);
					}

					var saveHowWIthNewWhat = function(whatId){
						how.whatAmI = whatId;
						RimaService.createHowAmI(how, createdHow);
					}

					if(typeof $scope.whatInput === 'string'){ //new what
						var newWhat = new knalledge.WhatAmI();
						newWhat.name = $scope.whatInput.toLowerCase();
						RimaService.createWhatAmI(newWhat).$promise.then(whatCreated);
					}else{ //already existing what (found through typeahead)
						console.log("already existing what '%s' (found through typeahead)", $scope.whatInput);
						RimaService.addToLocalWhats($scope.whatInput);//TODO: here we are adding it to 'whatAmI' local cache:
						saveHowWIthNewWhat($scope.whatInput._id);
					}

					$scope.whatInput = null;

				};

				$scope.getItems = function(value){
					var items = RimaService.getByNameContains(value);
					// return items;
					return items.$promise;
					// return items.$promise.then(function(items_server){
					//  console.log("getItems: ", JSON.stringify(items_server));
					//  return items_server;
					// });
				};

				 //TODO: select from map.dataContent.mcm.authors list
				//RimaService.loadUsersFromList().$promise.then(init); //TODO: change to load from MAP
				init();
				$scope.selectItem = function(item) {
					$scope.selectedItem = item;
					console.log("$scope.selectedItem = " + $scope.selectedItem.displayName + ": " + $scope.selectedItem._id);
				};
				$scope.selectWhat = function(item) {
					$scope.selectedWhat = item;
					console.log("$scope.selectWhat = " + $scope.selectWhat.name + ": " + $scope.selectWhat._id);
				};
				$scope.chooseWhat = function(what) {
					guidanceProcessStep($timeout, $element, "enter_what");
					console.log("$scope.chooseWhat = " + what.name + ": " + what._id);
					$scope.whatInput = what;
				};

				$scope.delete = function(how) {
					if(confirm("Are you sure you want to delete you relation to '"+ how.whatAmI.name +"'?")){
						RimaService.deleteHow(how._id, function(){
							var index = -1;
							for(var i=0;i<$scope.items.length;i++){
								if($scope.items[i]._id == how._id){
									index = i;
									break;
								}
							}
							if(index != -1){delete $scope.items[index];}
						});
					}
				};

				$scope.finished = function(){
					var finishIt = function(){
						//TODO: should be this, but for simplicity of TNC online event we directed to its map: $location.path("/maps");
						var mapID = "5566f25867a6d01e65beddde"; 'TNC-Online';// old for RTS: 5552c2c87ffdccd74096d0ca
						$location.path("/map/id/" + mapID);

					};

					if($scope.items.length == 0){
						if(confirm("You have not added any of descriptions! Are you sure that we should continue?")){
							finishIt();
						}
					}
					else{
						if(confirm("Are you satisfied with your description, so that we can continue?")){
							finishIt();
						}
					}
				};
			}
		};
	}])

	.directive('rimaTopics', ["$rootScope", "$timeout", "$location", "RimaService",
		function($rootScope, $timeout, $location, RimaService){
		console.log("[rimaTopics] loading directive");
		return {
			restrict: 'AE',
			scope: {
			},
			// ng-if directive: http://docs.angularjs.org/api/ng.directive:ngIf
			// expression: http://docs.angularjs.org/guide/expression
			templateUrl: 'components/rima/partials/rima-topics.tpl.html',
			controller: function ( $scope, $element) {
				var HOW_VERB_FOR_TOPICS =4;
				var TOPICS_MAX = 2;
				var init = function(){
					$scope.items = RimaService.getUsersHows(RimaService.getActiveUserId());
					//$scope.modal.formData.contentTypeId= option.contentTypes[0].id;
					$scope.selectedHowOption = $scope.hows[0].id;
					//$scope.selectedItem = RimaService.getActiveUser();
					$scope.whats = RimaService.getAllWhats();
				}
				$scope.items = null;
				$scope.topics = ['5566c62cbb09e90677658a60', '5566c62cbb09e90677658a61', '5566c62cbb09e90677658a62'];
				$scope.whats = null;
				$scope.selectedItem = null;
				$scope.selectedWhat = null;

				$scope.displayName = RimaService.loggedInWhoAmI.displayName;

				//html-select:
				$scope.hows = RimaService.getHowVerbs();

				$scope.howById = function(id){
					// if(id !== 'undefined'){
					return RimaService.getHowForId(id).title;
					// }
					// else{
					//  return new knalledge.HowAmI();
					// }
				};

				$scope.haveHows = function(){
					for(var wid=0; wid<$scope.items.length; wid++){
						for(var tid in $scope.topics ){
							if($scope.items[wid].whatAmI._id == $scope.topics [tid] && $scope.items[wid].how == HOW_VERB_FOR_TOPICS){
								return true;
							}
						}
					}
					return false;
				};

				$scope.createHow = function(){
					var topicsSelected=0;
					for(var wid=0; wid<$scope.items.length; wid++){
						for(var tid in $scope.topics ){
							if($scope.items[wid].whatAmI._id == $scope.topics [tid] && $scope.items[wid].how == HOW_VERB_FOR_TOPICS){
								topicsSelected++;
							}
						}
					}

					if(topicsSelected >= TOPICS_MAX){
						window.alert("You have already selected maximum number of topics.");
						return;
					}

					var createdHow = function(howFromServer){
						//done already in service: ahowFromServer.whatAmI = RimaService.getWhatById(howFromServer.whatAmI);
						//already bound to the howAmIs array in the RIMA service, so this would cause duplicates: $scope.items.push(howFromServer);
					}


					var selectedHow = RimaService.getHowForId(HOW_VERB_FOR_TOPICS);


					for(var i=0;i<$scope.items.length;i++){
						var item = $scope.items[i];
						var whatName = (typeof $scope.whatInput === 'string') ? $scope.whatInput : $scope.whatInput.name;
						if(selectedHow.id == item.how && whatName.toLowerCase() == item.whatAmI.name.toLowerCase()){
							window.alert("You have already described yourself through this");
							return;
						}
					}

					var how = new knalledge.HowAmI();
					how.whoAmI = RimaService.getActiveUserId();
					how.how = selectedHow.id;

					//how.whatAmI = $scope.whatInput; //TODO:

					var whatCreated = function(whatFromServer){
						console.log("whatCreated", whatFromServer);
						saveHowWIthNewWhat(whatFromServer._id);
					}

					var saveHowWIthNewWhat = function(whatId){
						how.whatAmI = whatId;
						RimaService.createHowAmI(how, createdHow);
					}

					if(typeof $scope.whatInput === 'string'){ //new what
						var newWhat = new knalledge.WhatAmI();
						newWhat.name = $scope.whatInput.toLowerCase();
						RimaService.createWhatAmI(newWhat).$promise.then(whatCreated);
					}else{ //already existing what (found through typeahead)
						console.log("already existing what '%s' (found through typeahead)", $scope.whatInput);
						RimaService.addToLocalWhats($scope.whatInput);//TODO: here we are adding it to 'whatAmI' local cache:
						saveHowWIthNewWhat($scope.whatInput._id);
					}

					$scope.whatInput = null;

				};


				init();
				$scope.selectItem = function(item) {
					$scope.selectedItem = item;
					console.log("$scope.selectedItem = " + $scope.selectedItem.displayName + ": " + $scope.selectedItem._id);
				};
				$scope.selectWhat = function(item) {
					$scope.selectedWhat = item;
					console.log("$scope.selectWhat = " + $scope.selectWhat.name + ": " + $scope.selectWhat._id);
				};
				$scope.chooseWhat = function(what) {
					console.log("$scope.chooseWhat = " + what.name + ": " + what._id);
					$scope.whatInput = what;
					$scope.createHow();
				};

				$scope.delete = function(how) {
					if(confirm("Are you sure you want to delete you relation to '"+ how.whatAmI.name +"'?")){
						RimaService.deleteHow(how._id, function(){
							var index = -1;
							for(var i=0;i<$scope.items.length;i++){
								if($scope.items[i]._id == how._id){
									index = i;
									break;
								}
							}
							if(index != -1){delete $scope.items[index];}
						});
					}
				};
			}
		};
	}])

	.directive('rimaWhat', ['$rootScope', 'RimaService',
		function($rootScope, RimaService){
		console.log("[rimaWhat] loading directive");
		return {
			restrict: 'AE',
			scope: {
				'readonly': '=',
				'item': '=',
				'isLast': '=',
				'itemSelect': '&',
				'itemRemove': '&'
			},
			// ng-if directive: http://docs.angularjs.org/api/ng.directive:ngIf
			// expression: http://docs.angularjs.org/guide/expression
			templateUrl: 'components/rima/partials/rima-what.tpl.html',
			controller: function ( $scope, $element) {
				$scope.bindings = {
				};

				$scope.select = function(){
					$scope.itemSelect();
				};

				$scope.remove = function(){
					$scope.itemRemove();
				};
			}
		};
	}])

	/*
	https://angular-ui.github.io/bootstrap/
	http://getbootstrap.com/javascript/#tooltips
	http://stackoverflow.com/questions/23073156/how-to-open-and-close-angular-ui-popovers-programmatically
	http://stackoverflow.com/questions/19730461/hide-angular-ui-tooltip-on-custom-event
	http://stackoverflow.com/questions/13015432/how-to-make-bootstrap-tooltip-to-remain-visible-till-the-link-is-clicked
	http://stackoverflow.com/questions/12411500/show-twitter-bootstrap-tooltip-on-initalize
	https://github.com/angular-ui/bootstrap/issues/618
	http://stackoverflow.com/questions/16651227/enable-angular-ui-tooltip-on-custom-events
	http://plnkr.co/edit/DmNNkYHfofHTX4omt8GC?p=preview
	http://stackoverflow.com/questions/20939754/good-way-to-dynamically-open-close-a-popover-or-tooltip-using-angular-based
	http://plnkr.co/edit/94ZHgQ?p=preview
	*/
	.directive( 'popPopup', function () {
		return {
			restrict: 'EA',
			replace: true,
			scope: { title: '@', content: '@', placement: '@', animation: '&', isOpen: '&' },
			templateUrl: 'template/popover/popover.html'
		};
	})
	  .directive('pop', function pop ($tooltip, $timeout) {
		var tooltip = $tooltip('pop', 'pop', 'event');
		var compile = angular.copy(tooltip.compile);
		tooltip.compile = function (element, attrs) {
		  var first = true;
		  attrs.$observe('popShow', function (val) {
			if (JSON.parse(!first || val || false)) {
			  $timeout(function () {
				element.triggerHandler('event');
			  });
			}
			first = false;
		  });
		  return compile(element, attrs);
		};
		return tooltip;
	  })
	  .directive('myTooltip', ['$timeout', '$tooltip', function ( $timeout, $tooltip ) {
		var tooltip = $tooltip( 'myTooltip', 'myTooltip', 'openTrigger' );
		var compile = angular.copy(tooltip.compile);
		tooltip.compile = function (element, attrs) {
			var first = true;
			attrs.$observe('myTooltipShow', function (val) {
				if (JSON.parse(!first || val || false)) {
					$timeout(function () {
						element.triggerHandler('openTrigger');
					});
				}
				first = false;
			});
			return compile(element, attrs);
		};
		return tooltip;
	}])

	.directive('rimaWizard', ['$rootScope', '$timeout', 'RimaService',
		function($rootScope, $timeout, RimaService){
		console.log("[rimaWizard] loading directive");
		return {
			restrict: 'AE',
			scope: {
			},
			templateUrl: 'components/rima/partials/rima-wizard.tpl.html',
			link: function ( $scope, $element) {
				$scope.currentStepNumber = 0;
				// triggerPopup($timeout, $element, "#testing_tooltip_what", "openTrigger");
			},
			controller: function ( $scope, $element) {

				$scope.whoAmI = RimaService.loggedInWhoAmI;
				$scope.submitted = false;
				$scope.bindings = {
					noSkype: false//$scope.whoAmI.extensions.contacts.skype
				};

				$scope.showPopup = function(){
					triggerPopup($timeout, $element, "#testing_tooltip_what", "openTrigger");
					// triggerPopup($timeout, $element, "#testing_input", "openTrigger");
				}
				$scope.closePopup = function(){
					triggerPopup($timeout, $element, "#testing_tooltip_what", "closeTrigger");
					// triggerPopup($timeout, $element, "#testing_input", "openTrigger");
				}

				$scope.stepEntered = function(){
					console.log('stepEntered (); $scope.currentStepNumber: %d',$scope.currentStepNumber);
					RimaService.updateWhoAmI(function(){
						console.log('after:' + RimaService.loggedInWhoAmI);
						//$scope.submitted = true;
					});
				};

				$scope.noSkypeChange = function(){
					//console.log('noSkypeChange ()');
					if($scope.bindings.noSkype){
						$scope.whoAmI.extensions.contacts.skype = '<skype not provided>';
					}
					else{
						$scope.whoAmI.extensions.contacts.skype = '';
					}
				};

				$scope.submit = function(){//not used in our case, because we save it upon each step
					console.log('pre:'+RimaService.loggedInWhoAmI);
					//$scope.submitted = true;
				};
			}

		};
	}]);

}()); // end of 'use strict';