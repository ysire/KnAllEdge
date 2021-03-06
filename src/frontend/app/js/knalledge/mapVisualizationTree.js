(function () { // This prevents problems when concatenating scripts that aren't strict.
'use strict';

/**
@classdesc Deals with visualization of the KnAllEdge map. It is a specialization of the `knalledge.MapVisualization` class
@class MapVisualizationTree
@memberof knalledge
*/

var MapVisualizationTree =  knalledge.MapVisualizationTree = function(dom, mapStructure, collaboPluginsService, configTransitions, configTree, configNodes, configEdges, rimaService, notifyService, mapPlugins, knalledgeMapViewService, upperAPI){
	this.construct(dom, mapStructure, collaboPluginsService, configTransitions, configTree, configNodes, configEdges, rimaService, notifyService, mapPlugins, knalledgeMapViewService, upperAPI);
};

// TODO: the quickest solution until find the best and the most performance optimal solution
// Set up MapVisualizationTree to inherit from MapVisualization
MapVisualizationTree.prototype = Object.create(knalledge.MapVisualization.prototype);

MapVisualizationTree.prototype._super = function(){
	var thisP = Object.getPrototypeOf(this);
	var parentP = Object.getPrototypeOf(thisP);
	return parentP;
};

/**
 * Updates map visualization
 * First tries few ways to resolve the starting node of the map. Then it generates visualization structure calling `knalledge.MapLayout.generateTree()` and then visualizas it.
 *
 * @function update
 * @memberof knalledge.MapVisualizationTree
 * 	@param {vkNode} source - node that will be used as a source of animation
 * 	(for example nodes will expand from the source node)
 *  @param  {Function} callback - called when map visualization finished updating
 * */
MapVisualizationTree.prototype.update = function(source, callback) {
	if(this.updateInProgress){
		return;
	}
	// currently updates can be in the parallel
	// this.updateInProgress = true;

	if(!source) source = this.getSourceAlternative();

	// filter out invisible nodes (hideIBIS, limit range, ...)
	this.mapStructure.setVisibility();

	this.mapLayout.generateTree(this.mapStructure.rootNode);
	// this.mapLayout.printTree(this.mapLayout.nodes);
	// we need to update html nodes to calculate node heights in order to center them verticaly
	var nodeHtmlDatasets = this.updateHtml(source);
	var that = this;
	window.setTimeout(function() {
		if(!source) source = that.getSourceAlternative();
		that.updateNodeDimensions();
		that.updateHtmlTransitions(source, nodeHtmlDatasets); // all transitions are put here to be in the same time-slot as links, labels, etc

		// we do it "second time" to react to width/height changes after adding/removing elemetns (like images, ...)
		that.updateNodeDimensions();
		that.updateHtmlAfterTransitions(source, nodeHtmlDatasets);

		that.updateSvgNodes(source);
		that.updateLinks(source);
		that.updateLinkLabels(source);
		if(typeof callback === 'function'){
			callback();
		}

		that.updateInProgress = false;
	}, 25);
};

function isShowingFullSizeImage(d){
	return !this.knalledgeMapViewService.provider.config.nodes.showImagesAsThumbnails && d.kNode.dataContent && d.kNode.dataContent.image && d.kNode.dataContent.image.width;
}

/**
 * calculates width of a node
 * @function getNodeWidth
 * 	@param {vkNode} d node that we are calculating width for
 * */
function getNodeWidth(d){
// .style("min-width", function(d){
		var width = null;
		if(this.knalledgeMapViewService.provider.config.nodes.showImages){
			var width = isShowingFullSizeImage.bind(this)(d) ?
				d.kNode.dataContent.image.width : this.knalledgeMapViewService.provider.config.nodes.imagesThumbnailsWidth;
		}
		// if width is not set or if it is narrower than
		// this.configNodes.html.dimensions.sizes.width
		if(this.configNodes.html.dimensions &&  this.configNodes.html.dimensions.sizes &&  this.configNodes.html.dimensions.sizes.width && (width === null || width < this.configNodes.html.dimensions.sizes.width)) {
			width = this.configNodes.html.dimensions.sizes.width;
		}
		return this.scales.width(width) + "px";
}

/**
* Calculates left margin of a node
* @function getNodeMarginLeft
 * 	@param {vkNode} d node that we are calculating
 * 	the left margin for
 * */
function getNodeMarginLeft(d){
		// centering the node (set margin to half the width of the node)
		var width = null;
		if(this.knalledgeMapViewService.provider.config.nodes.showImages){
			var width = (!this.knalledgeMapViewService.provider.config.nodes.showImagesAsThumbnails && d.kNode.dataContent && d.kNode.dataContent.image && d.kNode.dataContent.image.width) ?
				d.kNode.dataContent.image.width : this.knalledgeMapViewService.provider.config.nodes.imagesThumbnailsWidth;
		}

		// if width is not set or if it is narrower than
		// this.configNodes.html.dimensions.sizes.width
		if(this.configNodes.html.dimensions &&  this.configNodes.html.dimensions.sizes &&  this.configNodes.html.dimensions.sizes.width && (width === null || width < this.configNodes.html.dimensions.sizes.width)) {
			width = this.configNodes.html.dimensions.sizes.width;
		}

		var margin = null;
		// set margin only if width is set
		if(width !== null) {
			margin = this.scales.width(-width/2) + "px";
		}
		return margin;
}

/**
* Calculates the width of the image inside the node
* if user has chosen to show only thumbnail,
* the fixed width of thumbnail will be returned
* @function getImageWidthForNode
 * 	@param {vkNode} d node that we are calculating
 * 	the image width for
 * */
function getImageWidthForNode(d){
	var width = this.knalledgeMapViewService.provider.config.nodes.showImagesAsThumbnails ? this.knalledgeMapViewService.provider.config.nodes.imagesThumbnailsWidth : d.kNode.dataContent.image.width;
	return this.scales.width(width) + "px";
}

/**
* Calculates the height of the image inside the node
* if user has chosen to show only thumbnail,
* the fixed height of thumbnail will be returned
* @function getImageHeightForNode
 * 	@param {vkNode} d node that we are calculating
 * 	the image height for
 * */
 function getImageHeightForNode(d){
 	var height = this.knalledgeMapViewService.provider.config.nodes.showImagesAsThumbnails ? this.knalledgeMapViewService.provider.config.nodes.imagesThumbnailsHeight : d.kNode.dataContent.image.height;
 	return this.scales.height(height) + "px";
 }

/** @function updateHtml
 * 	@param {vkNode} source - root node
 * joins data and view
 * stylize nodes and set their event listeners
 * Adds all visual plugins
 * */
MapVisualizationTree.prototype.updateHtml = function(source) {
	var that = this;
	if(!this.configNodes.html.show) return;

	var nodeHtml = this.dom.divMapHtml.selectAll("div.node_html")
		.data(this.mapLayout.nodes, function(d) { return d.id; });

	nodeHtml.classed({
		"node_unselectable": function(d){
			return (!d.kNode.visual || !d.kNode.visual.selectable) ?
				true : false;
		},
		"node_selectable": function(d){
			return (d.kNode.visual && d.kNode.visual.selectable) ?
				true : false;
		}
	});

	// Enter the nodes
	// we create a div that will contain both visual representation of a node
	var nodeHtmlEnter = nodeHtml.enter().append("div")
		.attr("class", function(d){
				var userHows = that.rimaService.howAmIs;
				var nodeWhats = (d.kNode.dataContent && d.kNode.dataContent.rima && d.kNode.dataContent.rima.whats) ?
					d.kNode.dataContent.rima.whats : [];
				var relevant = false;
				for(var i in nodeWhats){
					var nodeWhat = nodeWhats[i];
					for(var j in userHows){
						var userHow = userHows[j];
						if (userHow && userHow.whatAmI && (userHow.whatAmI.name == nodeWhat.name))
						{
							relevant = true;
							break;
						}
					}
				}
				var classes = "node_html node_unselected draggable " + d.kNode.type;
				if(relevant) classes += " rima_relevant"
				return classes;
			})
		// .on("dblclick", function(d){
		// 	that.upperAPI.nodeDblClicked(d);
		// })
		.on("click", function(d){
			that.upperAPI.nodeClicked(d);
			// that.mapLayout.clickNode(d, this);
		});

	// position node on enter at the source position
	// (it is either parent or another precessor)
	nodeHtmlEnter
		.style("left", function(d) {
			var y = null;
			if(that.configTransitions.enter.animate.position){
				if(that.configTransitions.enter.referToToggling){
					y = source.y0;
				}else{
					y = d.parent ? d.parent.y0 : d.y0;
				}
			}else{
				y = d.y;
			}
			return that.scales.y(y) + "px";
		})
		.style("top", function(d) {
			var x = null;
			if(that.configTransitions.enter.animate.position){
				if(that.configTransitions.enter.referToToggling){
					x = source.x0;
				}else{
					x = d.parent ? d.parent.x0 : d.x0;
				}
			}else{
				x = d.x;
			}
			// console.log("[nodeHtmlEnter] d: %s, x: %s", d.kNode.name, x);
			return that.scales.x(x) + "px";
		})
		.classed({
			"node_html_fixed": function(d){
				return (!isShowingFullSizeImage.bind(that)(d)) ?
					true : false;
			}
		})
		/* TODO Fixing expandable nodes */
		.style("width", getNodeWidth.bind(this))
		.style("margin-left", getNodeMarginLeft.bind(this));

	nodeHtmlEnter.filter(function(d) { return that.knalledgeMapViewService.provider.config.nodes.showImages && d.kNode.dataContent && d.kNode.dataContent.image; })
		.append("img")
			.attr("src", function(d){
				return d.kNode.dataContent.image.url;
			})
			.attr("width", getImageWidthForNode.bind(this))
			.attr("height", getImageHeightForNode.bind(this))
			.attr("alt", function(d){
				return d.kNode.name;
			})
			.on("click", function(d){
				d3.event.stopPropagation();
				// alert("Image clicked");
				that.upperAPI.nodeMediaClicked(d);
			})
			;

	nodeHtmlEnter
		.append("div")
			.attr("class", "open_close_status");

	// TODO: we cannot optimize
	// if(this.rimaService.config.showUsers){
		nodeHtmlEnter
			.append("div")
				.attr("class", "rima_user");
	// }

	// nodeHtmlEnter
	// 	.append("div")
	// 		.attr("class", "node_status")
	// 			.html(function(){
	// 				return "&nbsp;"; //d._id; // d.kNode._id;
	// 			});
	nodeHtmlEnter
		.append("div")
			.attr("class", "vote_up");

	nodeHtmlEnter
		.append("div")
			.attr("class", "vote_down");

	nodeHtmlEnter
		.append("div")
			.attr("class", "node_inner_html")
			.append("span")
				.html(function(d) {
					return d.kNode.name;
				});
			// .append("span")
			// 	.html(function(d) {
			// 		return "report: "+d.x+","+d.y;
			// 	})
			// .append("p")
			// 	.html(function(d) {
			// 		return "moving: ";
			// 	});

	if(this.configTransitions.enter.animate.opacity){
		nodeHtmlEnter
			.style("opacity", 1e-6);
	}

	if(this.mapPlugins && this.mapPlugins.mapVisualizePlugins){
		for(var pluginName in this.mapPlugins.mapVisualizePlugins){
			var plugin = this.mapPlugins.mapVisualizePlugins[pluginName];
			if(plugin.nodeHtmlEnter){
				plugin.nodeHtmlEnter(nodeHtmlEnter);
			}
		}
	}

	var nodeHtmlDatasets = {
		elements: nodeHtml,
		enter: nodeHtmlEnter,
		exit: null
	};
	return nodeHtmlDatasets;
};

/** @function updateHtmlTransitions
 * 	@param {vkNode} source - root node
 * 	@param {vkNode} nodeHtmlDatasets - root node
 * joins data and view
 * stylize nodes and set their event listeners
 * Adds all visual plugins
 * Updates/adds/removes node decorations (for example it adds image thumbnail if before this and previous update rendering image is attached to a node)
 * */
MapVisualizationTree.prototype.updateHtmlTransitions = function(source, nodeHtmlDatasets){
	if(!this.configNodes.html.show) return;
	var that = this;

	var nodeHtml = nodeHtmlDatasets.elements;
	// var nodeHtmlEnter = nodeHtmlDatasets.enter;

	// var nodeHtml = divMapHtml.selectAll("div.node_html")
	// 	.data(nodes, function(d) { return d.id; });

	// Transition nodes to their new (final) position
	// it happens also for entering nodes (http://bl.ocks.org/mbostock/3900925)
	var nodeHtmlUpdate = nodeHtml;
	var nodeHtmlUpdateTransition = nodeHtmlUpdate;
	if(this.configTransitions.update.animate.position || this.configTransitions.update.animate.opacity){
		nodeHtmlUpdateTransition = nodeHtmlUpdate.transition()
			.duration(this.configTransitions.update.duration);
	}

	// updates representation of nodes
	// adding/removing/updating image thumbnails, etc, ...
	nodeHtmlUpdate
		.classed({
			"node_html_fixed": function(d){
				return (!isShowingFullSizeImage.bind(that)(d)) ?
					true : false;
			}
		})
		/* TODO FIxing expandable nodes */
		.style("width", getNodeWidth.bind(this))
		.style("margin-left", getNodeMarginLeft.bind(this));
		nodeHtmlUpdate.filter(function(d) {
			var isEditingNode = (that.mapStructure.getEditingNode() == d);
			return !isEditingNode;
		})
		.select(".node_inner_html span")
			.html(function(d) {
				return d.kNode.name;
			});

	// updating image state
	// image exists in data but not in the view
	nodeHtmlUpdate.filter(function(d) {
		return (that.knalledgeMapViewService.provider.config.nodes.showImages && d.kNode.dataContent && d.kNode.dataContent.image && (d3.select(this).select("img").size() <= 0));
	})
		.append("img")
			.attr("src", function(d){
				return d.kNode.dataContent.image.url;
			})
			.attr("width", getImageWidthForNode.bind(this))
			.attr("height", getImageHeightForNode.bind(this))
			.attr("alt", function(d){
				return d.kNode.name;
			});

	// updating images' properties
	nodeHtmlUpdate.select("img")
		.attr("src", function(d){
			return d.kNode.dataContent.image.url;
		})
		.attr("width", getImageWidthForNode.bind(this))
		.attr("height", getImageHeightForNode.bind(this))
		.attr("alt", function(d){
			return d.kNode.name;
		});

	// image does not exist in data but does exist in the view
	nodeHtmlUpdate.select("img").filter(function(d) {
		return (!(that.knalledgeMapViewService.provider.config.nodes.showImages && d.kNode.dataContent && d.kNode.dataContent.image) );
	})
		.remove();

	nodeHtmlUpdate.select(".vote_up")
		.style("opacity", function(d){
			var iAmId = that.rimaService.getActiveUserId();
			return (d.kNode.dataContent && d.kNode.dataContent.ibis && d.kNode.dataContent.ibis.votes && d.kNode.dataContent.ibis.votes[iAmId]) ?
				1.0 : 0.5;
			// return (d.kNode.dataContent && d.kNode.dataContent.ibis && d.kNode.dataContent.ibis.voteUp) ?
			// 	1.0 : 0.1;
		})
		.on("click", function(d){
			d3.event.stopPropagation();
			that.upperAPI.nodeVote(1, d);
		})
		.html(function(d){
			// if(!('dataContent' in d.kNode) || !d.kNode.dataContent) d.kNode.dataContent = {};
			// if(!('ibis' in d.kNode.dataContent) || !d.kNode.dataContent.ibis) d.kNode.dataContent.ibis = {};
			// if(!('voteUp' in d.kNode.dataContent.ibis)) d.kNode.dataContent.ibis.voteUp = 1;
			var iAmId = that.rimaService.getActiveUserId();
			return (d.kNode.dataContent && d.kNode.dataContent.ibis && d.kNode.dataContent.ibis.votes && d.kNode.dataContent.ibis.votes[iAmId]) ?
				d.kNode.dataContent.ibis.votes[iAmId] : "&nbsp";
			//return (d.kNode.dataContent && d.kNode.dataContent.ibis && d.kNode.dataContent.ibis.voteUp) ?
			//	d.kNode.dataContent.ibis.voteUp : "&nbsp";
		});

	nodeHtmlUpdate.select(".vote_down")
		.style("opacity", function(d){
			var sum = 0;
			if(d.kNode.dataContent && d.kNode.dataContent.ibis && d.kNode.dataContent.ibis.votes){
				for(var vote in d.kNode.dataContent.ibis.votes){
					sum+=d.kNode.dataContent.ibis.votes[vote];
				}
			}
			return sum != 0 ? 1.0 : 0.5;
			// return (d.kNode.dataContent && d.kNode.dataContent.ibis && d.kNode.dataContent.ibis.voteDown) ?
			// 	1.0 : 0.1;
		})
		.on("click", function(d){
			d3.event.stopPropagation();
			that.upperAPI.nodeVote(-1, d);
		})
		.html(function(d){
			var sum = 0;
			if(d.kNode.dataContent && d.kNode.dataContent.ibis && d.kNode.dataContent.ibis.votes){
				for(var vote in d.kNode.dataContent.ibis.votes){
					sum+=d.kNode.dataContent.ibis.votes[vote];
				}
				return sum;
			}
			else{
				return "&nbsp";
			}
		});

	nodeHtmlUpdate.select(".open_close_status")
		.style("display", function(d){
			return that.mapStructure.hasChildren(d) ? "block" : "none";
		})
		.on("click", function(d){
			d3.event.stopPropagation();
			that.upperAPI.nodeDblClicked(d);
		})
		.html(function(d){
			return ((d.isOpen === false) && that.mapStructure.hasChildren(d)) ? "+" : "-";
		});
	nodeHtmlUpdate.select(".rima_user")
		.style("display", function(d){
			return that.rimaService.config.showUsers && that.rimaService.getUserById(d.kNode.iAmId) ? "block" : "none"; //TODO: unefective!! double finding users (also in following '.html(function(d){')

		})
		.html(function(d){
			var user = that.rimaService.getUserById(d.kNode.iAmId);
			var label = "";
			if(user){
				label = "@" + user.displayName;
			}
			return label;
		})
		.on("click", function(d){
			console.log('@creator clicked for node ',d.kNode.name);
			d3.event.stopPropagation();
			//this.append("div").html("users list");
			that.upperAPI.nodeCreatorClicked(d);
		})
		;

	if(this.mapPlugins && this.mapPlugins.mapVisualizePlugins){
		for(var pluginName in this.mapPlugins.mapVisualizePlugins){
			var plugin = this.mapPlugins.mapVisualizePlugins[pluginName];
			if(plugin.nodeHtmlUpdate){
				plugin.nodeHtmlUpdate(nodeHtmlUpdate);
			}
		}
	}

	// if we are doing animation then we are continuing changing node position, ... through nodeHtmlUpdateTransition,
	// which will introduce change with delay and transition,
	// otherwise changes will happen imediatelly through nodeHtmlUpdate
	(this.configTransitions.update.animate.position ? nodeHtmlUpdateTransition : nodeHtmlUpdate)
		.style("left", function(d){
			return that.scales.y(d.y) + "px";
		})
		// .each("start", function(d){
		// 	console.log("[nodeHtmlUpdateTransition] STARTED: d: %s, xCurrent: %s", d.kNode.name, d3.select(this).style("top"));
		// })
		.style("top", function(d){
			var x = that.mapLayout.getHtmlNodePosition(d);
			// x = d.x;
			// console.log("[nodeHtmlUpdateTransition] d: %s, xCurrent: %s, xNew: %s", d.kNode.name, d3.select(this).style("top"), x);
			return that.scales.x(x) + "px";
		});

	if(this.configTransitions.update.animate.opacity){
		nodeHtmlUpdateTransition
			.style("opacity", 1.0);
		nodeHtmlUpdateTransition.select(".node_inner_html")
			.style("opacity", function(d){
				return (d.kNode.visual && d.kNode.visual.selectable) ?
					1.0 : 0.95;
			});
	}

	// TRANSITION EXITING NODES
	// TODO: move to separate function
	var nodeHtmlExit = nodeHtml.exit();
	var nodeHtmlExitTransition = nodeHtmlExit;
	nodeHtmlExit.on("click", null);
	nodeHtmlExit.on("dblclick", null);

	if(this.configTransitions.exit.animate.position || this.configTransitions.exit.animate.opacity){
		nodeHtmlExitTransition = nodeHtmlExit.transition()
			.duration(this.configTransitions.exit.duration);
	}

	if(this.configTransitions.exit.animate.opacity){
		nodeHtmlExitTransition
			.style("opacity", 1e-6);
	}

	if(this.configTransitions.exit.animate.position){
		nodeHtmlExitTransition
			.style("left", function(d){
				var y = null;
				// Transition nodes to the toggling node's new position
				if(that.configTransitions.exit.referToToggling){
					y = source.y;
				}else{ // Transition nodes to the parent node's new position
					y = (d.parent ? d.parent.y : d.y);
				}
				return that.scales.y(d.y) + "px";
			})
			.style("top", function(d){
				var x = null;
				if(that.configTransitions.exit.referToToggling){
					x = source.x;
				}else{
					x = (d.parent ? d.parent.x : d.x);
				}
				return that.scales.x(d.x) + "px";
			});
	}
	nodeHtmlExitTransition.remove();
};

MapVisualizationTree.prototype.updateHtmlAfterTransitions = function(source, nodeHtmlDatasets){
	if(!this.configNodes.html.show) return;
	var that = this;

	var nodeHtml = nodeHtmlDatasets.elements;
	// var nodeHtmlEnter = nodeHtmlDatasets.enter;

	// var nodeHtml = divMapHtml.selectAll("div.node_html")
	// 	.data(nodes, function(d) { return d.id; });

	// Transition nodes to their new (final) position
	// it happens also for entering nodes (http://bl.ocks.org/mbostock/3900925)
	var nodeHtmlUpdate = nodeHtml;
	var nodeHtmlUpdateTransition = nodeHtmlUpdate;
	if(this.configTransitions.update.animate.position || this.configTransitions.update.animate.opacity){
		nodeHtmlUpdateTransition = nodeHtmlUpdate.transition()
			.duration(this.configTransitions.update.duration);
	}

	(this.configTransitions.update.animate.position ? nodeHtmlUpdateTransition : nodeHtmlUpdate)
		.style("left", function(d){
			return that.scales.y(d.y) + "px";
		})
		// .each("start", function(d){
		// 	console.log("[nodeHtmlUpdateTransition] STARTED: d: %s, xCurrent: %s", d.kNode.name, d3.select(this).style("top"));
		// })
		.style("top", function(d){
			var x = that.mapLayout.getHtmlNodePosition(d);
			// x = d.x;
			// console.log("[nodeHtmlUpdateTransition] d: %s, xCurrent: %s, xNew: %s", d.kNode.name, d3.select(this).style("top"), x);
			return that.scales.x(x) + "px";
		})
	  .each('end',  function(d){
			that.positionNodeRelatedEntities(d);
		})
		;

	if(this.configTransitions.update.animate.opacity){
		nodeHtmlUpdateTransition
			.style("opacity", 1.0);
		nodeHtmlUpdateTransition.select(".node_inner_html")
			.style("opacity", function(d){
				return (d.kNode.visual && d.kNode.visual.selectable) ?
					1.0 : 0.95;
			});
	}

};

MapVisualizationTree.prototype.updateSvgNodes = function(source) {
	if(!this.configNodes.svg.show) return;
	var that = this;

	// Declare the nodes, since there is no unique id we are creating one on the fly
	// not very smart with real data marshaling in/out :)
	var node = this.dom.svg.selectAll("g.node")
		.data(this.mapLayout.nodes, function(d) { return d.id; });

	// Enter the nodes
	// we create a group "g" that will contain both visual representation of a node (circle) and text
	var nodeEnter = node.enter().append("g")
		.attr("class", "node")
		.style("opacity", function(){
			return that.configTransitions.enter.animate.opacity ? 1e-6 : 0.8;
		})

		.on("click", function(d){
			that.upperAPI.nodeClicked(d);
		})
		// .on("dblclick", function(d){
		// 	that.upperAPI.nodeDblClicked(d);
		// })
		// Enter any new nodes at the parent's previous position.
		.attr("transform", function(d) {

			var x = null, y = null;
			if(that.configTransitions.enter.animate.position){
				if(that.configTransitions.enter.referToToggling){
					y = source.y0;
					x = source.x0;
				}else{
					if(d.parent){
						y = d.parent.y0;
						x = d.parent.x0;
					}else{
						y = d.y0;
						x = d.x0;
					}
				}
			}else{
					y = d.y;
					x = d.x;
			}
			return "translate(" + that.scales.y(source.y0) + "," + that.scales.x(source.x0) + ")";
		});
		// .attr("transform", function(d) {
		//   // return "translate(0,0)";
		//   return "translate(" + d.y + "," + d.x + ")";
		// });

	// add visual representation of node
	nodeEnter.append("circle")
		// the center of the circle is positioned at the 0,0 coordinate
		.attr("r", 10)
		.style("fill", "#fff");

	var nodeEnterTransition;
	if(this.configTransitions.enter.animate.position || this.configTransitions.enter.animate.opacity){
		nodeEnterTransition = nodeEnter.transition()
			.duration(this.configTransitions.enter.duration);

		if(this.configTransitions.enter.animate.opacity){
			nodeEnterTransition
				.style("opacity", 1e-6);
		}
	}

	var nodeUpdate = node;
	var nodeUpdateTransition;
	if(this.configTransitions.update.animate.position || this.configTransitions.update.animate.opacity){
		nodeUpdateTransition = nodeUpdate.transition()
			.duration(this.configTransitions.update.duration);
	}
	// Transition nodes to their new position
	(this.configTransitions.update.animate.position ? nodeUpdateTransition : nodeUpdate)
		.attr("transform", function(d) {
			return "translate(" + d.y + "," + d.x + ")";
		});
	(this.configTransitions.update.animate.opacity ? nodeUpdateTransition : nodeUpdate)
			.style("opacity", 0.8);

	node.select("circle")
		.style("fill", function(d) { return ((d.isOpen === false) && that.mapStructure.hasChildren(d)) ? "lightsteelblue" : "#ffffff"; });

	// Transition exiting nodes
	var nodeExit = node.exit();
	var nodeExitTransition;

	nodeExit.on("click", null);
	if(this.configTransitions.exit.animate.position || this.configTransitions.exit.animate.opacity){
		nodeExitTransition = nodeExit.transition()
			.duration(this.configTransitions.exit.duration);

		if(this.configTransitions.exit.animate.opacity){
			nodeExitTransition
				.style("opacity", 1e-6);
		}

		if(this.configTransitions.exit.animate.position){
			nodeExitTransition
				.attr("transform", function(d) {
					var x=null, y=null;
					if(that.configTransitions.exit.referToToggling){
						x = source.x;
						y = source.y;
					}else{
						if(d.parent){
							x = d.parent.x;
							y = d.parent.y;
						}else{
							x = d.x;
							y = d.y;
						}
					}
					return "translate(" + that.scales.y(y) + "," + that.scales.x(x) + ")";
				});
		}
		nodeExitTransition
			.remove();
	}else{
		nodeExit
			.remove();
	}
};

MapVisualizationTree.prototype.updateLinkLabels = function(source) {
	if(!this.configEdges.labels.show) return;

	var that = this;

	/**************
	* create D3 references to link labels
	**************/
	var linkLabelHtml = this.dom.divMapHtml.selectAll("div.label_html")
	.data(this.mapLayout.links, function(d) {
		// there is only one incoming edge
		return d.vkEdge.id; // d.target.id;
	});

	/**************
	* creating link label (enter)
	**************/
	// we create a div that will contain both visual representation link label
	var linkLabelHtmlEnter = linkLabelHtml.enter().append("div")
		.attr("class", function(d){
				return "label_html " + d.vkEdge.kEdge.type;
			})
		// inform on edge clicked
		.on("click", function(d){
			that.upperAPI.edgeClicked(d);
		})
		.style("left", function(d) {
			var y;
			// if edges are animated
			if(that.configTransitions.enter.animate.position){
				// if animation is comming from source of action (usually node toggling)
				if(that.configTransitions.enter.referToToggling){
					y = source.y0;
				}else{
					y = d.source.y0;
				}
			}else{
				y = (d.source.y + d.target.y) / 2;
			}
			return that.scales.y(y) + "px";
		})
		.style("top", function(d) {
			var x;
			if(that.configTransitions.enter.animate.position){
				if(that.configTransitions.enter.referToToggling){
					x = source.x0;
				}else{
					x = d.source.x0;
				}
			}else{
				x = (d.source.x + d.target.x) / 2;
			}
			return that.scales.x(x) + "px";
		});

	// append link label name
	linkLabelHtmlEnter
		.append("span")
			//.text("<span>Hello</span>");
			//.html("<span>Hello</span>");
			.html(function(d) {
				var edge = that.mapStructure.getEdge(d.source.id, d.target.id); //TODO: replace with added kEdge
				return that.knalledgeMapViewService.provider.config.edges.showNames ? edge.kEdge.name : "";
			});

	// set opacity to 0 at the innitial
	if(this.configTransitions.enter.animate.opacity){
		linkLabelHtmlEnter
			.style("opacity", 1e-6);
	}

	/**************
	* UPDATING link label
	**************/
	var linkLabelHtmlUpdate = linkLabelHtml;
	var linkLabelHtmlUpdateTransition = linkLabelHtmlUpdate;

	// make transition of lonk labels if there is animation of position or opacity
	if(this.configTransitions.update.animate.position || this.configTransitions.update.animate.opacity){
		linkLabelHtmlUpdateTransition = linkLabelHtmlUpdate.transition()
			.duration(this.configTransitions.update.duration);
	}

	// update link label
	linkLabelHtmlUpdate.select("span")
			.html(function(d) {
				var edge = that.mapStructure.getEdge(d.source.id, d.target.id); //TODO: replace with added kEdge
				return that.knalledgeMapViewService.provider.config.edges.showNames ? edge.kEdge.name : "";
			});

	// animate position to the middle between source and target position
	if(this.configTransitions.update.animate.position){
		// either transition ...
		linkLabelHtmlUpdateTransition
			.style("left", function(d){
				return ((d.source.y + d.target.y) / 2) + "px";
			})
			.style("top", function(d){
				return ((d.source.x + d.target.x) / 2) + "px";
			});
	}else{
		// ... or non-transition linkLabel
		linkLabelHtmlUpdate
			.style("left", function(d){
				return ((d.source.y + d.target.y) / 2) + "px";
			})
			.style("top", function(d){
				return ((d.source.x + d.target.x) / 2) + "px";
			});
	}
	// if opacity animated increase it to its final value
	if(this.configTransitions.update.animate.opacity){
		linkLabelHtmlUpdateTransition
			.style("opacity", 1.0);
	}

	/**************
	* LINK REMOVAL (exit)
	**************/
	var linkLabelHtmlExit = linkLabelHtml.exit();
	var linkLabelHtmlExitTransition = linkLabelHtmlExit;
	linkLabelHtmlExit.on("click", null);

	// if exiting is animated
	if(this.configTransitions.exit.animate.position || this.configTransitions.exit.animate.opacity){
		// introduce transition
		linkLabelHtmlExitTransition = linkLabelHtmlExit.transition()
			.duration(this.configTransitions.exit.duration);

		// position
		if(this.configTransitions.exit.animate.position){
			linkLabelHtmlExitTransition
				.style("left", function(d) {
					var y = null;
					// Transition edge to the source-of-action's new position
					if(that.configTransitions.exit.referToToggling){
						y = source.y;
					}else{ // Transition edge to the parent node's new position
						y = d.source.y;
					}

					return that.scales.y(y) + "px";
				})
				.style("top", function(d) {
					var x = null;
					// Transition edge to the source-of-action's new position
					if(that.configTransitions.exit.referToToggling){
						x = source.x;
					}else{ // Transition edge to the parent node's new position
						x = d.source.x;
					}

					return that.scales.x(x) + "px";
				});
		}
		// opacity
		if(this.configTransitions.exit.animate.opacity){
			linkLabelHtmlExitTransition
				.style("opacity", 1e-6);
		}
	// or just remove link label if there is no animation
	}
	linkLabelHtmlExitTransition
		.remove();
};

/* method responsible for dealing with links
* + creating (enter)
* + updating
* + removing (exit)
*/
MapVisualizationTree.prototype.updateLinks = function(source) {
	if(!this.configEdges.show) return;

	var that = this;

	// Declare the links
	/*************
	* LINK CREATION
	*************/
	var link = this.dom.svg.selectAll("path.link")
	.data(this.mapLayout.links, function(d) {
		// TODO: this will need to evolve after adding bouquet links
		return d.vkEdge.id;
	});

	/*************
	* LINK ENTER
	*************/
	// Enter the links
	var linkEnter = link.enter().insert("path", "g")
		.attr("class", "link")
		// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
		// http://www.w3schools.com/svg/svg_path.asp
		// https://www.dashingd3js.com/svg-paths-and-d3js
		// link contains source {x, y} and target {x, y} attributes which are used as input for diagonal,
		// and then each passed to projection to calculate array couple [x,y] for both source and target point
		.attr("d", function(d) {
			var diagonal;
			// animate diagonal appereance
			if(that.configTransitions.enter.animate.position){
				var o;
				// should link appear from the node we initiated action?
				if(that.configTransitions.enter.referToToggling){
					o = {x: source.x0, y: source.y0};
				}else{
					o = {x: d.source.x0, y: d.source.y0};
				}
				diagonal = that.mapLayout.diagonal(that.mapLayout, isShowingFullSizeImage.bind(that))({source: o, target: o});
			// if not, position diagonal in its final position determined by parent and child node position
			}else{
				diagonal = that.mapLayout.diagonal(that.mapLayout, isShowingFullSizeImage.bind(that))(d);
			}
			return diagonal;
		});

	var linkEnterTransition = linkEnter;

	// make link-entrance animation with increasing opacity
	if(this.configTransitions.enter.animate.opacity){
		linkEnterTransition = linkEnter.transition()
			.duration(this.configTransitions.update.duration);

		linkEnter
			.style("opacity", 1e-6);
	}
	linkEnterTransition
		.style("opacity", 1.0);

	/*************
	* LINK UPDATING
	*************/
	var linkUpdate = link;
	var linkUpdateTransition = linkUpdate;
	// introduce transition if there is animation
	if(this.configTransitions.update.animate.position || this.configTransitions.update.animate.opacity){
		linkUpdateTransition = linkUpdate.transition()
			.duration(this.configTransitions.update.duration);
	}
	if(this.configTransitions.update.animate.position){
		//if there is animation, update link with transition
		linkUpdateTransition
			.attr("d", function(d){
				var diagonal;
				diagonal = that.mapLayout.diagonal(that.mapLayout, isShowingFullSizeImage.bind(that))(d);
				return diagonal;
			});
	}else{
		// otherwise update it immediatelly
		linkUpdate
			.attr("d", function(d){
				var diagonal;
				diagonal = that.mapLayout.diagonal(that.mapLayout, isShowingFullSizeImage.bind(that))(d);
				return diagonal;
			});
	}

	// still need to understand why this is necessary and
	// 	linkEnterTransition.style("opacity", 1.0);
	// is not enough
	linkUpdateTransition
		.style("opacity", 1.0);


	/*************
	* LINK EXITING
	*************/
	var linkExit = link.exit();
	var linkExitTransition = linkExit;

	// if there is animation (of either position or opacity) introduce transition by setting
	// linkExitTransition to transition
	if(this.configTransitions.exit.animate.position || this.configTransitions.exit.animate.opacity){
		// create transition
		linkExitTransition = linkExit.transition()
			.duration(this.configTransitions.exit.duration);

		// animating position
		if(this.configTransitions.exit.animate.position){
			// provide final position to transition linkExit: linkExitTransition
			linkExitTransition
				.attr("d", function(d) {
					var diagonal;
					var o;
					// Transition nodes to the toggling node's new position
					if(that.configTransitions.exit.referToToggling){
						o = {x: source.x, y: source.y};
					}else{
						o = {x: d.source.x, y: d.source.y};
					}
					diagonal = that.mapLayout.diagonal(that.mapLayout, isShowingFullSizeImage)({source: o, target: o});
					return diagonal;
				});
		}else{
			// provide final position to non-transition linkExit
			linkExit
				.attr("d", function(d){
					var diagonal;
					diagonal = that.mapLayout.diagonal(that.mapLayout, isShowingFullSizeImage.bind(that))(d);
					return diagonal;
				});
		}
		// reduce opacity through transition
		if(this.configTransitions.exit.animate.opacity){
			linkExitTransition
				.style("opacity", 1e-6);
		}
	// or it will stay just regular linkExit (without transition)
	}
	linkExitTransition
		.remove();
};

}()); // end of 'use strict';
