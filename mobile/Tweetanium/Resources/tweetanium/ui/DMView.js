/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/

(function() {
	//create the DM view
	tt.ui.createDMView = function(_args) {
		var dmView = Ti.UI.createView($$.stretch);
		dmView.add(Ti.UI.createLabel(tt.combine($$.headerText, {text:L('direct_messages')})));
		
		var tableView = Titanium.UI.createTableView(tt.combine($$.TableView,{
			top:$$.headerView.height
		}));
		dmView.add(tableView);
		
		tableView.addEventListener('click', function(e) {
			
		});
		
		return dmView;
	};
})();