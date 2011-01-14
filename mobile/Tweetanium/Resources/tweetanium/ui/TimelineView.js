/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/

(function() {
	//create the timeline view
	tt.ui.createTimelineView = function(_args) {
		var timelineView = Ti.UI.createView($$.stretch),
		tableView = Ti.UI.createTableView(tt.combine($$.TableView,{
			top:$$.headerView.height,
			minRowHeight:60
		})),
		newButton = Ti.UI.createButton(tt.combine($$.topRightButton,{
			backgroundImage:'images/new.png'
		}));
		
		timelineView.add(Ti.UI.createLabel(tt.combine($$.headerText,{text:L('timeline')})));
		timelineView.add(newButton);
		timelineView.add(tableView);
		
		//use the current account to grab and render a tweet timeline
		function refreshTimeline() {
			Ti.App.fireEvent('app:show.loader');
			tt.app.currentAccount.getTimeline({
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
		Ti.App.addEventListener('app:account.selected', refreshTimeline);
		
		newButton.addEventListener('click', function() {
			var w = tt.ui.createComposeWindow();
			w.open();
		});
		
		return timelineView;
	};
})();