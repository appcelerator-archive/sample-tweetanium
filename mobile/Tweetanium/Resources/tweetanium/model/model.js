/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/

(function() {
	tt.model = {
		dbname:'appdb' //overwrite this before creating your first entity to change
	};
	
	//Create a persistent entity
	tt.model.Entity = function(/*String*/ _class, /*Object*/ _properties) {
		//mixin all properties for the object passed in
		tt.mixin(this,_properties);
		
		this._className = _class;
		
		//Create a table for this entity type
		var db = Ti.Database.open(tt.model.dbname);
		db.execute('CREATE TABLE IF NOT EXISTS '+_class+' (id INTEGER PRIMARY KEY, json TEXT)');
		db.close();
		
		//save this entity - returns the ID of this entity
		this.save = function() {
			db = Ti.Database.open(tt.model.dbname);
			db.execute('INSERT INTO '+this._className+' (json) VALUES (?)',JSON.stringify(this));
			var id = db.lastInsertRowId;
			this.id = id;
			db.close();
			Ti.App.fireEvent('app:entity.saved',{
				className:this._className,
				id:id
			});
			return id;
		};
	};
	
	//helper function to hydrate a JSON graph with class functions
	function hydrate(/*String*/ _className, /*String*/ _json) {
		return (tt.model[_className]) ? new tt.model[_className](JSON.parse(_json)) : JSON.parse(_json);
	}
	
	//load an entity by the given ID
	tt.model.load = function(/*String*/ _className, /*Number*/ _id) {
		var obj = null,
		db = Ti.Database.open(tt.model.dbname);
		
		//be tolerant of entities that don't exist - create a table for them
		db.execute('CREATE TABLE IF NOT EXISTS '+_className+' (id INTEGER PRIMARY KEY, json TEXT)');
		
		var rs = db.execute('SELECT * FROM '+_className+' WHERE id = ?', _id);
		
		if (rs.isValidRow()) {
			var json = rs.fieldByName('json');
			obj = hydrate(_className,json);
			obj.id = rs.fieldByName('id');
		}
		
		rs.close();
		db.close();
		return obj;
	};
	
	//get a list of all entities of the given class
	tt.model.list = function(/*String*/ _className) {
		var results = [],
		db = Ti.Database.open(tt.model.dbname);
		
		//be tolerant of entities that don't exist - create a table for them
		db.execute('CREATE TABLE IF NOT EXISTS '+_className+' (id INTEGER PRIMARY KEY, json TEXT)');
		
		var rs = db.execute('SELECT * FROM '+_className);
		
		while (rs.isValidRow()) {
			var json = rs.fieldByName('json');
			
			obj = hydrate(_className,json);
			obj.id = rs.fieldByName('id');
			
			results.push(obj);
			rs.next();
		}
		
		rs.close();
		db.close();
		return results;
	};
})();

Ti.include(
	'/tweetanium/model/Account.js',
	'/tweetanium/model/Tweet.js'
);