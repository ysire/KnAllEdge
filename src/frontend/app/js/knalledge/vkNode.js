(function () { // This prevents problems when concatenating scripts that aren't strict.
'use strict';

var VKNode =  knalledge.VKNode = function(){
	this._id = 0; //TODO: maxId logic should be migrated here
	this.kNode = null;
	this.iAmId = 0;
	this.createdAt = null;
	this.updatedAt = null;
};

VKNode.prototype.init = function(){
};

}()); // end of 'use strict';