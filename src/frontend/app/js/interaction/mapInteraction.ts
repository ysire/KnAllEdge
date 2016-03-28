// external from the JS world
declare var interaction;
declare var knalledge;
declare var d3;
declare var window;
declare var debugpp;

const STATUS_MAP:string = "STATUS_MAP";
const STATUS_EDITOR:string = "STATUS_EDITOR";

export class MapInteraction {
    private clientApi:any;
    private status:string;
    private editingNodeHtml:any = null;

    /**
    * @var {debugPP} debug - namespaced debug for the class
    * @memberof interaction.Keyboard
    */
    private debug;

    constructor(clientApi) {
        this.clientApi = clientApi;
        this.debug = debugpp.debug('interaction.MapInteraction');
    };

    init() {
        var that = this;
        var editor = d3.select(".knalledge_map_list"); // .ta-bind
    	var map = d3.select(".knalledge_map");
        this.status = STATUS_MAP;

    	editor.on("click", function() {
    		that.setStatus(STATUS_EDITOR);
    		console.info("Switching to the editor");
    	});

    	map.on("click", function() {
    		that.setStatus(STATUS_MAP);
    		console.info("Switching to the map");
    	});
    };

    isEditingNode():boolean {
        return this.editingNodeHtml !== null;
    }

    isStatusEditor():boolean {
        return this.status === STATUS_EDITOR;
    }

    isStatusMap():boolean {
        return this.status === STATUS_MAP;
    }

    setStatus(status) {
    	this.status = status;
    };

    getStatus() {
    	return this.status;
    };

    createCaretPlacer(el, atStart) {
        // http://www.w3schools.com/jsref/met_html_focus.asp
    	// http://stackoverflow.com/questions/2388164/set-focus-on-div-contenteditable-element
    	// http://stackoverflow.com/questions/12203086/how-to-set-focus-back-to-contenteditable-div
    	// http://stackoverflow.com/questions/2871081/jquery-setting-cursor-position-in-contenteditable-div
    	// http://stackoverflow.com/questions/7699825/how-do-i-set-focus-on-a-div-with-contenteditable
    	// https://gist.github.com/shimondoodkin/1081133
    	el.focus();

    	// http://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser
    	// http://stackoverflow.com/questions/1181700/set-cursor-position-on-contenteditable-div
    	// http://stackoverflow.com/questions/2871081/jquery-setting-cursor-position-in-contenteditable-div
    	// http://stackoverflow.com/questions/6249095/how-to-set-caretcursor-position-in-contenteditable-element-div
    	if(typeof window.getSelection !== "undefined" && typeof window.document.createRange !== "undefined") {
    		// https://developer.mozilla.org/en-US/docs/Web/API/range
    		// https://developer.mozilla.org/en-US/docs/Web/API/Document/createRange
    		var range = window.document.createRange();
    		// https://developer.mozilla.org/en-US/docs/Web/API/range/selectNodeContents
    		// https://developer.mozilla.org/en-US/docs/Web/API/Node
    		range.selectNodeContents(el);
    		// https://developer.mozilla.org/en-US/docs/Web/API/range/collapse
    		range.collapse(atStart);
    		// https://developer.mozilla.org/en-US/docs/Web/API/Selection
    		// https://developer.mozilla.org/en-US/docs/Web/API/window/getSelection
    		var sel = window.getSelection();
    		// https://developer.mozilla.org/en-US/docs/Web/API/Selection/removeAllRanges
    		// https://developer.mozilla.org/en-US/docs/Web/API/Selection/removeRange
    		// https://msdn.microsoft.com/en-us/library/ie/ff975178(v=vs.85).aspx
    		sel.removeAllRanges();
    		// https://developer.mozilla.org/en-US/docs/Web/API/Selection/addRange
    		sel.addRange(range);
    	}else if(typeof window.document.body.createTextRange !== "undefined") {
    		// https://msdn.microsoft.com/en-us/library/ie/ms536401%28v=vs.85%29.aspx
    		// https://msdn.microsoft.com/en-us/library/ie/ms535872(v=vs.85).aspx
    		var textRange = window.document.body.createTextRange();
    		// https://msdn.microsoft.com/en-us/library/ie/ms536630(v=vs.85).aspx
    		textRange.moveToElementText(el);
    		// http://help.dottoro.com/ljuobwme.php
    		// http://www.ssicom.org/js/x415055.htm
    		if(typeof textRange.collapse !== "undefined") {
    			textRange.collapse(atStart);
    		}
    		if(typeof textRange.collapse !== "undefined") {
    			// https://msdn.microsoft.com/en-us/library/ie/ms536616(v=vs.85).aspx
    			textRange.move("textedit", (atStart ? -1 : 1));
    		}
    		// https://msdn.microsoft.com/en-us/library/ie/ms536735(v=vs.85).aspx
    		textRange.select();
    	}
    };

    switchToProperties() {
    	var editor = d3.select(".ta-bind");
    	var map = d3.select(".knalledge_map_container");
    	// editor.remove();
    	map.node().blur();
    	editor.node().focus();
    	$(editor.node()).click();
    };

    switchToMap() {
    	var editor = d3.select(".ta-bind");
    	var map = d3.select(".knalledge_map_container");
    	editor.node().blur();
    	map.node().focus();
    	$(map.node()).click();
    };

    searchNodeByName() {
        // if(!this.isStatusMap()) return;

        this.clientApi.searchNodeByName();
    };

    toggleModerator() {
        // if(!this.isStatusMap()) return;

        this.clientApi.toggleModerator();
    };

    togglePresenter() {
        // if(!this.isStatusMap()) return;

        this.clientApi.togglePresenter();
    };

    nodeVoteUp() {
        if(!this.isStatusMap()) return;
		var node = this.clientApi.getSelectedNode();
		if(!('dataContent' in node.kNode) || !node.kNode.dataContent) node.kNode.dataContent = {};
		if(!('ibis' in node.kNode.dataContent) || !node.kNode.dataContent.ibis) node.kNode.dataContent.ibis = {};
		if(!('voteUp' in node.kNode.dataContent.ibis)) {
            node.kNode.dataContent.ibis.voteUp = 1;
        }else {
            node.kNode.dataContent.ibis.voteUp += 1;
        }
		this.clientApi.updateNode(node, knalledge.MapStructure.UPDATE_NODE_IBIS_VOTING);
		this.clientApi.update(this.clientApi.getSelectedNode());
    };

    nodeVoteDown() {
        if(!this.isStatusMap()) return;
		var node = this.clientApi.getSelectedNode();
		if(!('dataContent' in node.kNode) || !node.kNode.dataContent) node.kNode.dataContent = {};
		if(!('ibis' in node.kNode.dataContent) || !node.kNode.dataContent.ibis) node.kNode.dataContent.ibis = {};
		if(!('voteDown' in node.kNode.dataContent.ibis)) {
            node.kNode.dataContent.ibis.voteDown = 1;
        }else {
            node.kNode.dataContent.ibis.voteDown += 1;
        }
		this.clientApi.updateNode(node, knalledge.MapStructure.UPDATE_NODE_IBIS_VOTING);
		this.clientApi.update(this.clientApi.getSelectedNode());
    };

    addLink() {
        var node = this.clientApi.getSelectedNode();
		if(node) { // if source node is selected
			this.clientApi.knalledgeState.addingLinkFrom = node;
		}
    }

    relinkNode() {
        if(!this.isStatusMap()) return;
		if(!this.clientApi.getSelectedNode()) return; // no parent node selected
		this.clientApi.knalledgeState.relinkingFrom = this.clientApi.getSelectedNode();
    };

    deleteNode() {
        if(!this.isStatusMap()) return;
        if(!this.clientApi.getSelectedNode()) return; // no parent node selected
        //var that = this;
        //if(confirm("Are you sure you want to delete this node od KnAllEdge?")) {
            var parentNodes = this.clientApi.getParentNodes(this.clientApi.getSelectedNode());
            this.clientApi.deleteNode(this.clientApi.getSelectedNode());
            if(parentNodes.length > 0 && parentNodes[0]) {
                this.clientApi.nodeSelected(parentNodes[0]);
            }

            this.clientApi.update(this.clientApi.getSelectedNode(), function() {
                // that.clientApi.nodeSelected(null); //TODO: set to parent
            });
        //}
    };

    addImage() {
        if(!this.isStatusMap()) return;
        var node = this.clientApi.getSelectedNode();

        this.clientApi.addImage(node);
    };

    removeImage() {
        if(!this.isStatusMap()) return;
        console.log("Removing image");
        this.clientApi.removeImage();
    };

    exitEditingNode() {
        if(this.editingNodeHtml) {
            this._exitEditingNode();
        }
        if(!this.isStatusMap()) return;
    }

    setEditing() {
        if(this.editingNodeHtml) return;
        if(!this.isStatusMap()) return;
        this._setEditing(this.clientApi.getSelectedNode());
    };

    _setEditing(node) {
    	if(!node) return;
    	var that = this;

    	console.log("editing starting");
    	this.editingNodeHtml = this.clientApi.getDomFromDatum(this.clientApi.getSelectedNode());
    	var nodeSpan = this.editingNodeHtml.select("span");

    	// http://www.w3.org/TR/html5/editing.html#editing-0
    	// http://www.w3.org/TR/html5/editing.html#contenteditable
    	// http://www.w3.org/TR/html5/editing.html#making-entire-documents-editable:-the-designmode-idl-attribute
    	nodeSpan.attr("contenteditable", true);

    	this.createCaretPlacer(nodeSpan.node(), false);

    	// http://www.w3schools.com/js/js_htmldom_eventlistener.asp
    	nodeSpan.node().addEventListener("blur", function onblur() {
    		console.log("editing bluring");
    		// http://www.w3schools.com/jsref/met_element_removeeventlistener.asp
    		if(nodeSpan.node().removeEventListener) {// For all major browsers, except IE 8 and earlier
    			nodeSpan.node().removeEventListener("blur", onblur);
    		}else if(nodeSpan.node().detachEvent) { // For IE 8 and earlier versions
    			nodeSpan.node().detachEvent("blur", onblur);
    		}
    		that._exitEditingNode();
    	});
    };

    _exitEditingNode() {
    	console.log("_exitEditingNode");
    	if(this.editingNodeHtml) {
    		var nodeSpan = this.editingNodeHtml.select("span");
    		nodeSpan.attr("contenteditable", false);
    		this.clientApi.updateName(this.editingNodeHtml);
    		nodeSpan.node().blur();
    		this.editingNodeHtml = null;
    		this.clientApi.update(this.clientApi.getSelectedNode(), function() {
    			// that.clientApi.nodeSelected(null); //TODO: set to parent
    		});
    	}
    };

    navigateLeft() {
        if(this.editingNodeHtml || !this.clientApi.getSelectedNode()) return;
		if(!this.isStatusMap()) return;

        if(this.clientApi.getSelectedNode().parent) {
			this.clientApi.nodeSelected(this.clientApi.getSelectedNode().parent);
		}
    };

    navigateRight() {
        if(this.editingNodeHtml || !this.clientApi.getSelectedNode()) return;
		if(!this.isStatusMap()) return;

        if(this.clientApi.getSelectedNode().children) {
			this.clientApi.nodeSelected(this.clientApi.getSelectedNode().children[0]);
		}
    };

    navigateDown() {
        if(this.editingNodeHtml || !this.clientApi.getSelectedNode()) return;
		if(!this.isStatusMap()) return;

        if(this.clientApi.getSelectedNode().parent && this.clientApi.getSelectedNode().parent.children) {
            for(var i=0; i<this.clientApi.getSelectedNode().parent.children.length; i++) {
                if(this.clientApi.getSelectedNode().parent.children[i] === this.clientApi.getSelectedNode()) {
                    if(i+1<this.clientApi.getSelectedNode().parent.children.length) {
                        this.clientApi.nodeSelected(this.clientApi.getSelectedNode().parent.children[i+1]);
                    }
                }
            }
        }
    };

    navigateUp() {
        if(this.editingNodeHtml || !this.clientApi.getSelectedNode()) return;
		if(!this.isStatusMap()) return;

        if(this.clientApi.getSelectedNode().parent && this.clientApi.getSelectedNode().parent.children) {
			for(var i=0; i<this.clientApi.getSelectedNode().parent.children.length; i++) {
				if(this.clientApi.getSelectedNode().parent.children[i] === this.clientApi.getSelectedNode()) {
					if(i-1>=0) {
						this.clientApi.nodeSelected(this.clientApi.getSelectedNode().parent.children[i-1]);
					}
				}
			}
		}
    };

    toggleNode() {
        if(this.editingNodeHtml) return;
		if(!this.isStatusMap()) return;

        this.clientApi.getSelectedNode().isOpen = !this.clientApi.getSelectedNode().isOpen;
        this.clientApi.update(this.clientApi.getSelectedNode());
    };

    addNode(nodeType?, edgeType?) {
        if(typeof nodeType === 'undefined') nodeType = this.clientApi.getActiveIbisType();
        if(typeof nodeType === 'undefined') nodeType = knalledge.KNode.TYPE_KNOWLEDGE;

        if(typeof edgeType === 'undefined') edgeType = this.clientApi.getActiveIbisType();
        if(typeof edgeType === 'undefined') edgeType = knalledge.KEdge.TYPE_KNOWLEDGE;

		console.log("exitEditingNode");
		this.debug.log("on('tab'): this.editingNodeHtml: ", this.editingNodeHtml);
		if(this.editingNodeHtml) return; // in typing mode
		this.debug.log("on('tab'): this.clientApi.getSelectedNode(): ", this.clientApi.getSelectedNode());

		if(!this.clientApi.getSelectedNode()) return; // no parent node selected
		var that = this;
		var newNode = this.clientApi.createNode(null, nodeType);
	//		newNode.kNode.$promise.then(function(kNodeFromServer) { // TODO: we should remove this promise when we implement
	//		KnalledgeMapQueue that will solve these kind of dependencies
	//			console.log("KeyboardJS.on('tab': in promised fn after createNode");

		var newEdge = this.clientApi.createEdgeBetweenNodes(that.clientApi.getSelectedNode(), newNode, edgeType);
		newEdge.kEdge.$promise.then(function(kEdgeFromServer) {
			var parentNode = that.clientApi.getSelectedNode();
			if(!parentNode.isOpen) {
				parentNode.isOpen = true;
				that.clientApi.expandNode(parentNode, function() {
                    return;
				});
			}

			that.clientApi.update(parentNode, function() {
				that.clientApi.nodeSelected(newNode);
				that.clientApi.update(parentNode, function() {
					that._setEditing(newNode);
					// we need to position explicitly here again even though that.clientApi.nodeSelected(newNode) is doing it
					// since that._setEditing(newNode); is destroying positioning
					that.clientApi.positionToDatum(newNode);
				});
			});
		});

		// var newEdge = that.clientApi.createEdge(that.clientApi.getSelectedNode(), newNode);
		// newEdge.kEdge.$promise.then(function(kEdgeFromServer) {
		// 	if(!that.clientApi.getSelectedNode().isOpen) {
		// 		that.clientApi.getSelectedNode().isOpen = true;
		// 		that.clientApi.update(that.clientApi.getSelectedNode(), function() {

		// 		});
		// 	}

		// 	that.clientApi.update(that.clientApi.getSelectedNode(), function() {
		// 		that.clientApi.nodeSelected(newNode);//TODO: that is not defined?
		// 		that._setEditing(newNode);
		// 	});
		// });

    	//});
    };

    newNode() {
        return;
    };
};

if(typeof interaction !== 'undefined') interaction.MapInteraction = MapInteraction;