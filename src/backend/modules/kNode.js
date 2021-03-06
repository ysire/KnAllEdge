'use strict';

/**
 * New node file
 */
var mongoose = require('mongoose');
var deepAssign = require('deep-assign');
//var Promise = require("bluebird");

var mockup = {fb: {authenticate: false}, db: {data:false}};
var accessId = 0;

function resSendJsonProtected(res, data){
	// http://tobyho.com/2011/01/28/checking-types-in-javascript/
	if(data !== null && typeof data === 'object'){ // http://stackoverflow.com/questions/8511281/check-if-a-variable-is-an-object-in-javascript
		res.set('Content-Type', 'application/json');
		// JSON Vulnerability Protection
		// http://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx/
		// https://docs.angularjs.org/api/ng/service/$http#description_security-considerations_cross-site-request-forgery-protection
		res.send(")]}',\n" + JSON.stringify(data));
	}else if(typeof data === 'string'){ // http://stackoverflow.com/questions/4059147/check-if-a-variable-is-a-string
		res.send(data);
	}else{
		res.send(data);
	}
};


var KNodeModel = mongoose.model('KNode', global.db.kNode.Schema);

// module.exports = KNodeModel; //then we can use it by: var User = require('./app/models/KNodeModel');

/* connecting */
var dbName = (global.dbConfig && global.dbConfig.name) || "KnAllEdge";
mongoose.connect('mongodb://127.0.0.1/' + dbName);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// curl -v -H "Content-Type: application/json" -X GET http://127.0.0.1:8888/knodes/one/551bdcda1763e3f0eb749bd4
// curl -v -H "Content-Type: application/json" -X GET http://127.0.0.1:8888/knodes/in_map/552678e69ad190a642ad461c
exports.index = function(req, res){
	var found = function(err,kNodes){
		console.log("[modules/kNode.js:index] in 'found'");
		if (err){
			throw err;
			var msg = JSON.stringify(err);
			resSendJsonProtected(res, {data: kNodes, accessId : accessId, message: msg, success: false});
		}else{
			//console.log("[modules/kNode.js:index] Data:\n%s", JSON.stringify(kNodes));
		}
	}

	var id = req.params.searchParam;
	var id2 = req.params.searchParam2;
	var type = req.params.type;
	exports._index(id, id2, type, function(err, kNodes){
		resSendJsonProtected(res, {data: kNodes, accessId : accessId, success: true});
	});
}

exports._index = function(id, id2, type, callback){
	var found = function(err,kNodes){
		console.log("[modules/kNode.js:index] in 'found'");
		if (err){
			throw err;
			var msg = JSON.stringify(err);
			if(callback) callback(err);
		}else{
			if(callback) callback(null, kNodes);
		}
	}

	console.log("[modules/kNode.js:index] id: %s. id2: %s", id, id2);
	switch (type){
		case 'one': //by id:
			console.log("findById:\n id: %s.\n", id);
			KNodeModel.findById(id, found);
			break;
		case 'in_map': //all nodes in specific map
			console.log("find:\n mapId: %s.\n", id);
			KNodeModel.find({ 'mapId': id}, found);
			break;
		case 'in_map_of_type': //all nodes of particular type in specific map
			console.log("find: mapId: %s, type: %s", id, id2);
			KNodeModel.find({ $and: [{ mapId: id}, { type: id2}] }, found);
			break;
	}
}

// curl -v -H "Content-Type: application/json" -X POST -d '{"_id":"5548038779743f2504b8941f", "mapId":"5548038779743f2504b89420", "name":"Collective Intelligence", "iAmId":5, "visual": {"isOpen": true}}' http://127.0.0.1:8888/knodes
// curl -v -H "Content-Type: application/json" -X POST -d '{"name":"Hello World Pl", "iAmId":5, "visual": {"isOpen": true}}' http://127.0.0.1:8888/knodes
// curl -v -H "Content-Type: application/json" -X POST -d '{"_id":"551bdcda1763e3f0eb749bd4", "name":"Hello World ID", "iAmId":5, "visual": {"isOpen": true}}' http://127.0.0.1:8888/knodes
exports.create = function(req, res){
	console.log("[modules/kNode.js:create] req.body: %s", JSON.stringify(req.body));

	var data = req.body;

	exports._create(data, function(knode, err) {
		if (err) throw err;
		console.log("[modules/KNode.js:create] id:%s, knode data: %s", knode._id, JSON.stringify(knode));
		resSendJsonProtected(res, {success: true, data: knode, accessId : accessId});
	});
}

exports._create = function(data, callback){
	console.log("[modules/kNode.js:_create] data: ", data);
	var knode = new KNodeModel(data);

	knode.save(function(err){
		if (err) throw err;
		callback(knode, err);
	});
}

// curl -v -H "Content-Type: application/json" -X PUT -d '{"name": "Hello World Pt23", "iAmId": 5, "visual": {"isOpen": false}}' http://127.0.0.1:8888/knodes/one/55266618cce5af993fe8675f
exports.update = function(req, res){
	//console.log("[modules/KNode.js:update] req.body: %s", JSON.stringify(req.body));

	var data = req.body;
	var id = req.params.searchParam;
	var actionType = req.params.actionType;

	exports._update(data, id, actionType, function (err, old_data) {
		resSendJsonProtected(res, {success: true, data: old_data, accessId : accessId});
	});
}

exports._update = function(data, id, actionType, callback){

	/* here, we started logics if RIMA-whats are integrated in kNode.dataContent.rima.whats and
	some of them are newly created on frontend so should be first created in whatAmI collection.
	But now we do this logic on frontend, so this code is just for possible usage in other usecases (btw, this code is not finished, just started)

	if((knode.dataContent !== null && typeof knode.dataContent !== 'undefined') &&  (knode.dataContent.rima !== null && typeof knode.dataContent.rima !== 'undefined') && (knode.dataContent.rima.whats !== null && typeof knode.dataContent.rima.whats !== 'undefined'){
		for(var i in kNode.dataContent.rima.whats){
			var what = kNode.dataContent.rima.whats[i];
			if(typeof what !== 'string'){ //it is newly created RIMA-what
				//console.log('howAmI:' + JSON.stringify(data));
				WhatAmIModel.findOneByName(what.name, function(err, whatAmI){ // Nevertheless, we check, for its existence:
					if (err) throw err;
					if(whatAmI === null || typeof whatAmI === 'undefined'){
						console.log("whatAmI '%s' not found", what.name);
						var  whatAmI = new WhatAmIModel({name:what.name});
						whatAmI.save(function (err) {
							if (err) return handleError(err);
							//console.log("whatAmI._id: "+whatAmI._id);
							knode.whatAmI = whatAmI._id;
							save(knode);
						});
					}
					else{
						console.log("whatAmI '%s' is found", whatAmIName);
						//console.log('findByName:: whatAmI: ' + JSON.stringify(whatAmI));
						knode.whatAmI = whatAmI._id;
						save(knode);
					}
				});
			}else{ //it is whatAmi._id. we don't have anything to do:
				console.log("it is whatAmi._id: " + what);
			}
		}
	}
	else
	{
		save(knode);
	}
	$q.all([nodes.$promise, edges.$promise])
					.then(nodesEdgesReceived.bind(this));
	*/

	/* this is wrong because it creates default-values populated object (including id) first and then populate it with paremeter object:
	 * var knode = new KNodeModel(req.body);
	 */
	console.log("[modules/KNode.js:update/%s/] id : %s", actionType, id );
	console.log("[modules/KNode.js] actionType = ", actionType);
	console.log("[modules/KNode.js:update] data, : %s", JSON.stringify(data));
	// console.log("[modules/KNode.js:update] knode.toObject(), : %s", JSON.stringify(knode.toObject());
	delete data._id;
	//TODO: check this: multi (boolean) whether multiple documents should be updated (false)
	//TODO: fix: numberAffected vraca 0, a raw vraca undefined. pitanje je da li su ispravni parametri callback f-je
	// KNodeModel.findByIdAndUpdate(id , data, { /* multi: true */ }, function (err, numberAffected, raw) {
	// 	  if (err) throw err;
	// 	  console.log('The number of updated documents was %d', numberAffected);
	// 	  console.log('The raw response from Mongo was ', raw);
	// 	  resSendJsonProtected(res, {success: true, data: data, accessId : accessId});
	// });

	var found = function found(err, old_data){
		if (err){
			throw err;
			var msg = JSON.stringify(err);
			if(callback) callback(err);
		}else{
			//console.log('old_data', JSON.stringify(old_data));

			//TODO: required because deepAssign could only work on shallow level, so overwriting votes,
			//when it received a deeper object like `{"dataContent":{"ibis":{"votes":{"556760847125996dc1a4a21c":3}}}};`
			old_data = JSON.parse(JSON.stringify(old_data));
			// console.log('old_data', JSON.stringify(old_data));
			// console.log('patch data', JSON.stringify(data));
			switch(actionType){
				case 'DATA_CONTENT_RIMA_WHATS_DELETING':
					//TODO: this is very specific treatment (almost a HACK) - we need more general action:
					// this could be other approach: http://stackoverflow.com/questions/5059951/deleting-js-object-properties-a-few-levels-deep
					var whatId = data.dataContent.rima.whats._id;
					//console.log('whatId: ', whatId);
					if(old_data.dataContent && old_data.dataContent.rima && old_data.dataContent.rima.whats){
						var whats = old_data.dataContent.rima.whats;
						for(var i=0; i<whats.length; i++){
							if(whats[i]._id === whatId){
								whats.splice(i, 1);
							}
						}
					}
				break;
				case 'DATA_CONTENT_RIMA_WHATS_ADDING':
					if (!old_data.dataContent) {
						old_data.dataContent = { rima : { whats : [] } };
					} else {
							if (!old_data.dataContent.rima) {
								old_data.dataContent.rima = { whats : [] };
							} else {
								if (!old_data.dataContent.rima.whats) { old_data.dataContent.rima.whats = []; }
							}
					}
					old_data.dataContent.rima.whats.push(data.dataContent.rima.whats[0]);
				break;
				default:
					deepAssign(old_data, data);
			}

			console.log('after patching', JSON.stringify(old_data));

			/* test
			let a = {"_id":"555d9b8fca6170de0e069f5f","name":"helo 3","type":"type_knowledge",
			"mapId":"555d9774b53940a00d4e72b7",
			"iAmId":"55268521fb9a901e442172f8","ideaId":0,"__v":0,
			"dataContent":{"ibis":{"votes":{"556760847125996dc1a4a241":2}}},
			"updatedAt":"2016-05-08T23:02:48.125Z","createdAt":"2015-05-21T08:47:11.449Z",
			"visual":{"yM":518,"xM":251.5,"isOpen":false},"isPublic":true,"version":1,"activeVersion":1};
			console.log('a before patch', JSON.stringify(a));
			let d = {"dataContent":{"ibis":{"votes":{"556760847125996dc1a4a21c":3}}}};
			deepAssign(a,d);
			console.log('a after patch', JSON.stringify(a)); */

			KNodeModel.update({_id:id}, old_data, function (err, raw) {
				if (err) throw err;
				//console.log('The raw response from Mongo was ', raw);
				data._id = id; //TODO: when we completly transfer to differential updates we won't need this
				if(callback) callback(err, old_data);
			});
		}
	}

	data.updatedAt = new Date(); //TODO: workaround for hook "schema.pre('update',...)" not working
	KNodeModel.findById(id, found);
}

// curl -v -H "Content-Type: application/json" -X DELETE http://127.0.0.1:8888/knodes/one/551bdcda1763e3f0eb749bd4
exports.destroy = function(req, res){
	//TODO: should we destroy edges connected to this node? or is it done automatically? or error is risen?
	var type = req.params.type;
	var searchParam = req.params.searchParam;
	console.log("[modules/KNode.js:destroy] searchParam:%s, type:%s, req.body: %s", searchParam, type, JSON.stringify(req.body));

	switch (type){
	case 'one':
		exports._destroyOne(searchParam, function (err, countOfRemoved) {
			var data = {countOfRemoved:countOfRemoved}; //ToDo: check this, it looks like it returns deleted Document
			console.log("[modules/kNode.js:destroy] data:" + JSON.stringify(data));
			resSendJsonProtected(res, {success: true, data: data, accessId : accessId});
		});
		break;
	case 'in-map': //all nodes in the map
		exports._destroyInMap(searchParam, function (err) {
			var data = {id:searchParam};
			console.log("[modules/kNode.js:destroy] data:" + JSON.stringify(data));
			resSendJsonProtected(res, {success: true, data: data, accessId : accessId});
		});
		break;
	// TODO: this currently delete all nodes that belongs to the provided mapId
	case 'by-modification-source': // by source (manual/computer) of modification
		exports._destroyByModificationSource(searchParam, function (err) {
			var data = {mapId:searchParam};
			console.log("[modules/kNode.js:destroy] data:" + JSON.stringify(data));
			resSendJsonProtected(res, {success: true, data: data, accessId : accessId});
		});
		break;
	}
};

exports._destroyOne = function(searchParam, callback){
	KNodeModel.findByIdAndRemove(searchParam, function (err, countOfRemoved) {
		if (err){
			console.log("[modules/kNode.js:destroy] error:" + err);
			throw err;
		}
		if(callback) callback(err, countOfRemoved);
	});
}

//all nodes in the map
exports._destroyInMap = function(searchParam, callback){
	console.log("[modules/kNode.js:destroy] deleting nodes in map %s", searchParam);
	KNodeModel.remove({'mapId': searchParam}, function (err) {
		if (err){
			console.log("[modules/kNode.js:destroy] error:" + err);
			throw err;
		}
		if(callback) callback(err);
	});
}

// TODO: this currently delete all nodes that belongs to the provided mapId
// by source (manual/computer) of modification
exports._destroyByModificationSource = function(searchParam, callback){
	console.log("[modules/kNode.js:destroy] deleting nodes in map %s", searchParam);
	KNodeModel.remove({'mapId': searchParam}, function (err) {
		if (err){
			console.log("[modules/kNode.js:destroy] error:" + err);
			throw err;
		}
		if(callback) callback(err);
	});
}