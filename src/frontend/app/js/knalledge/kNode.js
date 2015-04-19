(function () { // This prevents problems when concatenating scripts that aren't strict.
'use strict';

var KNode =  knalledge.KNode = function(){
	this._id = 0; //TODO: maxId logic should be migrated here
	this.name = "name...";
	this.type = null;
	this.mapId = "";	
	this.iAmId = 0;
	this.activeVersion = 1;
	this.ideaId = 0;
	this.version = 1;
	this.isPublic = true;
	this.createdAt = null;
	this.updatedAt = null;
	this.dataContent = null;
	this.visual = {
			isOpen: false,
			xM: 0,
			yM: 0,
			widthM: 0,
			heightM: 0
	};
	
	/* local-to-frontend */
	this.state = KNode.STATE_LOCAL;
};

KNode.nodeFactory = function(obj){
	var kNode = new knalledge.KNode();
	kNode.fill(obj);
	return kNode;
};

KNode.prototype.fill = function(obj){
	if(obj){
		if("_id" in obj){this._id = obj._id;}
		if("name" in obj){this.name = obj.name;}
		if("type" in obj){this.type = obj.type;}
		if("mapId" in obj){this.mapId = obj.mapId;}
		if("iAmId" in obj){this.iAmId = obj.iAmId;}
		if("activeVersion" in obj){this.activeVersion = obj.activeVersion;}
		if("ideaId" in obj){this.ideaId = obj.ideaId;}
		if("version" in obj){this.version = obj.version;}
		if("isPublic" in obj){this.isPublic = obj.isPublic;}
		if("createdAt" in obj){this.createdAt = obj.createdAt;} //TODO: converto to Date native type
		if("updatedAt" in obj){this.updatedAt = obj.updatedAt;}//TODO: converto to Date native type
		if("dataContent" in obj){this.dataContent = obj.dataContent;}
		if("visual" in obj){
			if("isOpen" in obj.visual){this.visual.isOpen = obj.visual.isOpen;}
			if("xM" in obj.visual){this.visual.xM = obj.visual.xM;}
			if("yM" in obj.visual){this.visual.yM = obj.visual.yM;}
			if("widthM" in obj.visual){this.visual.widthM = obj.visual.widthM;}
			if("heightM" in obj.visual){this.visual.heightM = obj.visual.heightM;}
		}
	}
}

KNode.STATE_LOCAL = "STATE_LOCAL";
KNode.STATE_NON_SYNCED = "STATE_NON_SYNCED";
KNode.STATE_SYNCED = "STATE_SYNCED";

KNode.prototype.init = function(){
	
};

KNode.prototype.toServerCopy = function(){
	var kNode = (JSON.parse(JSON.stringify(this))); //copy
	delete kNode.state;
	if(kNode.createdAt === undefined || kNode.createdAt === null) {delete kNode.createdAt;}
	if(kNode.updatedAt === undefined || kNode.updatedAt === null) {delete kNode.updatedAt;}
	return kNode;
};

}()); // end of 'use strict';