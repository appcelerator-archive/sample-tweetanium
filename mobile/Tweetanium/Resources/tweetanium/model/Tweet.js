/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/

Ti.include('/lib/date.js');

(function() {
	//Create new Entity 'subclass' using parasitic inheritance
	//http://www.crockford.com/javascript/inheritance.html
	tt.model.Tweet = function(_opts) {
		var that = new tt.model.Entity('Tweet');

		//add any passed properties to the object
		tt.mixin(that,_opts);
		
		//return the time ago in words for this tweet
		that.timeAgoInWords = function() {
			return new Date(that.created_at).toRelativeTime();
		};
		
		return that;
	};
})();