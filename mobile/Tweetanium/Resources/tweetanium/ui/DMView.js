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
		
		//use the current account to grab and render DMs
		function refreshDirectMessages() {
			Ti.App.fireEvent('app:show.loader');
			tt.app.currentAccount.getDirectMessages({
				success: function(tweets) {
					var tvData = [];
					for (var i=0,l=tweets.length;i<l;i++) {
						tvData.push(tt.ui.createTweetRow(tweets[i],true));
					}
					tableView.setData(tvData);
					Ti.App.fireEvent('app:hide.loader');
				}
			});
		}
		
		tableView.addEventListener('click', function(_e) {
			Ti.App.fireEvent('app:show.drawer', {showing:'tweetDetails'});
		});
		
		//When an account is selected (at launch or otherwise) grab the timeline
		Ti.App.addEventListener('app:account.selected', refreshDirectMessages);
		
		return dmView;
	};
})();