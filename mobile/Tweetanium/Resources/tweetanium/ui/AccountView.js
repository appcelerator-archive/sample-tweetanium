/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/

(function() {
	//create the Account view
	tt.ui.createAccountView = function(_args) {
		var accountView = Ti.UI.createView($$.stretch),
		tableView = Ti.UI.createTableView(tt.combine($$.TableView,{
			top:$$.headerView.height,
			backgroundImage:'images/ruff.png'
		}));
		
		accountView.add(Ti.UI.createLabel(tt.combine($$.headerText, {text:L('account')})));
		accountView.add(tableView);
		
		//create account table view
		function populateAccounts() {
			var accounts = tt.model.list('Account'),
			tvData = [];
			for (var i = 0, l = accounts.length;i<l;i++) {
				var row = Ti.UI.createTableViewRow(tt.combine($$.TableViewRow,{
					height:55,
					className:'accountRow'
				})),
				spacing = 5,
				imgDimensions = 45;
				
				var avatar = Ti.UI.createImageView({
					top:spacing,
					left:spacing,
					height:imgDimensions,
					width:imgDimensions,
					borderRadius:5,
					image:Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory,accounts[i].avatar_image)
				});
				row.add(avatar);
				
				row.add(Ti.UI.createLabel(tt.combine($$.boldHeaderText,{
					text:accounts[i].twitter_screen_name,
					left:spacing*3+imgDimensions
				})));
				
				row.add(Ti.UI.createImageView({
					right:spacing,
					height:20,
					width:20,
					image:'images/arrow_details.png'
				}));
				
				tvData.push(row);
			}
			tableView.setData(tvData);
		}
		
		tableView.addEventListener('click', function(_e) {
			Ti.App.fireEvent('app:show.drawer', {showing:'accountDetails'});
		});
		
		//listen for save events - if it's an account, redraw yourself
		Ti.App.addEventListener('app:entity.saved', function(e) {
			if (e.className === 'Account') {
				populateAccounts();
			}
		});
		
		populateAccounts();
		
		return accountView;
	};
})();