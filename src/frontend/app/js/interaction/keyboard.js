(function () { // This prevents problems when concatenating scripts that aren't strict.
'use strict';

var Keyboard =  interaction.Keyboard = function(clientApi){
	this.clientApi = clientApi;
	this.editingNodeHtml = null;
};

Keyboard.prototype.init = function(){
	this.initializeKeyboard();
};

Keyboard.prototype.createCaretPlacer = function(el, atStart){
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
	if(typeof window.getSelection != "undefined" && typeof window.document.createRange != "undefined"){
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
	}else if(typeof window.document.body.createTextRange != "undefined"){
		// https://msdn.microsoft.com/en-us/library/ie/ms536401%28v=vs.85%29.aspx
		// https://msdn.microsoft.com/en-us/library/ie/ms535872(v=vs.85).aspx
		var textRange = window.document.body.createTextRange();
		// https://msdn.microsoft.com/en-us/library/ie/ms536630(v=vs.85).aspx
		textRange.moveToElementText(el);
		// http://help.dottoro.com/ljuobwme.php
		// http://www.ssicom.org/js/x415055.htm
		if(typeof textRange.collapse != "undefined"){
			textRange.collapse(atStart);
		}
		if(typeof textRange.collapse != "undefined"){
			// https://msdn.microsoft.com/en-us/library/ie/ms536616(v=vs.85).aspx
			textRange.move("textedit", (atStart ? -1 : 1));
		}
		// https://msdn.microsoft.com/en-us/library/ie/ms536735(v=vs.85).aspx
		textRange.select();
	}
};

Keyboard.prototype.setEditing = function(node){
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
	nodeSpan.node().addEventListener("blur", function onblur(){
		console.log("editing bluring");
		// http://www.w3schools.com/jsref/met_element_removeeventlistener.asp
		if(nodeSpan.node().removeEventListener){// For all major browsers, except IE 8 and earlier
			nodeSpan.node().removeEventListener("blur", onblur);
		}else if(nodeSpan.node().detachEvent){ // For IE 8 and earlier versions
			nodeSpan.node().detachEvent("blur", onblur);
		}
		that.exitEditingNode();
	});
};

Keyboard.prototype.exitEditingNode = function(){
	console.log("exitEditingNode");
	if(this.editingNodeHtml){
		var nodeSpan = this.editingNodeHtml.select("span");
		nodeSpan.attr("contenteditable", false);
		
		this.clientApi.updateNode(this.editingNodeHtml.datum());
		nodeSpan.node().blur();
		this.editingNodeHtml = null;
	}
};

// http://robertwhurst.github.io/KeyboardJS/
Keyboard.prototype.initializeKeyboard = function() {
	var that = this;
	this.editingNodeHtml = null;

	KeyboardJS.on("right", function(){
		if(this.editingNodeHtml) return;

		if(this.clientApi.getSelectedNode().children){
			this.clientApi.clickNode(this.clientApi.getSelectedNode().children[0]);
		}
	}.bind(this), function(){}.bind(this));
	KeyboardJS.on("left", function(){
		if(this.editingNodeHtml) return;

		if(this.clientApi.getSelectedNode().parent){
			this.clientApi.clickNode(this.clientApi.getSelectedNode().parent);
		}
	}.bind(this), function(){}.bind(this));
	KeyboardJS.on("down", function(){
		if(this.editingNodeHtml) return;

		if(this.clientApi.getSelectedNode().parent && this.clientApi.getSelectedNode().parent.children){
			for(var i=0; i<this.clientApi.getSelectedNode().parent.children.length; i++){
				if(this.clientApi.getSelectedNode().parent.children[i] == this.clientApi.getSelectedNode()){
					if(i+1<this.clientApi.getSelectedNode().parent.children.length){
						this.clientApi.clickNode(this.clientApi.getSelectedNode().parent.children[i+1]);
					}
				}
			}
		}
	}.bind(this), function(){}.bind(this));
	KeyboardJS.on("up", function(){
		if(this.editingNodeHtml) return;

		if(this.clientApi.getSelectedNode().parent && this.clientApi.getSelectedNode().parent.children){
			for(var i=0; i<this.clientApi.getSelectedNode().parent.children.length; i++){
				if(this.clientApi.getSelectedNode().parent.children[i] == this.clientApi.getSelectedNode()){
					if(i-1>=0){
						this.clientApi.clickNode(this.clientApi.getSelectedNode().parent.children[i-1]);
					}
				}
			}
		}
	}.bind(this), function(){}.bind(this));
	KeyboardJS.on("enter", function(){
		if(this.editingNodeHtml) return;

		this.clientApi.getSelectedNode().isOpen = !this.clientApi.getSelectedNode().isOpen;
		this.clientApi.update(this.clientApi.getSelectedNode());
	}.bind(this), function(){}.bind(this));

	// EDIT
	KeyboardJS.on("space",
	function(){
		if(this.editingNodeHtml){
			return;
		}
		return false;
	},
	function(){
		if(this.editingNodeHtml) return;
		this.setEditing(this.clientApi.getSelectedNode());
	}.bind(this), function(){}.bind(this));

	// STOP-EDITING
	KeyboardJS.on("escape", function(){
		console.log("editing escaping");
		if(this.editingNodeHtml){
			this.exitEditingNode();
		}
	}.bind(this), function(){}.bind(this));	

	// Add new node
	KeyboardJS.on("tab", function(){
		if(this.editingNodeHtml) return; // in typing mode
		if(!this.clientApi.getSelectedNode()) return; // no parent node selected

		var newNode = this.clientApi.createNewNode();
		var newEdge = this.clientApi.createNewEdge(this.clientApi.getSelectedNode()._id, newNode._id);
		if(!this.clientApi.getSelectedNode().isOpen){
			this.clientApi.getSelectedNode().isOpen = true;
		}

		this.clientApi.update(this.clientApi.getSelectedNode(), function(){
			that.selectedNode = newNode;
			that.setEditing(that.selectedNode);			
		});
	}.bind(this), function(){}.bind(this));	
};

}()); // end of 'use strict';