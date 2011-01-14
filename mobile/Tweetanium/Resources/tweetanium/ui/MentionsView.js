/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/

(function() {
	//create the mentions view
	tt.ui.createMentionsView = function(_args) {
		var mentionsView = Ti.UI.createView($$.stretch);
		mentionsView.add(Ti.UI.createLabel(tt.combine($$.headerText, {text:L('mentions')})));
		
		var tableView = Titanium.UI.createTableView(tt.combine($$.TableView,{
			top:$$.headerView.height
		}));
		mentionsView.add(tableView);
		
		tableView.addEventListener('click', function(e) {
			
		});
		
		return mentionsView;
	};
})();