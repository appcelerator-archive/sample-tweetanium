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
		
		//use the current account to grab and render mentions
		function refreshMentions() {
			Ti.App.fireEvent('app:show.loader');
			tt.app.currentAccount.getMentions({
				success: function(tweets) {
					var tvData = [];
					for (var i=0,l=tweets.length;i<l;i++) {
						tvData.push(tt.ui.createTweetRow(tweets[i]));
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
		Ti.App.addEventListener('app:account.selected', refreshMentions);
		
		return mentionsView;
	};
})();