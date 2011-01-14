/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/

(function() {
	tt.ui.createAddAccountView = function(_args) {
		var addAccountView = Ti.UI.createView(),
		container = Ti.UI.createView({layout:'vertical'}),
		unLabel = Ti.UI.createLabel(tt.combine($$.boldHeaderText,{text:L('username')})),
		unField = Ti.UI.createTextField(tt.combine($$.TextField,{
			top:10,
			left:0,
			right:0
		})),
		pwLabel = Ti.UI.createLabel(tt.combine($$.boldHeaderText,{
			text:L('password'),
			top:10
		})),
		pwField = Ti.UI.createTextField(tt.combine($$.TextField,{
			top:10,
			left:0,
			right:0,
			passwordMask:true
		})),
		addButton = Ti.UI.createButton(tt.combine($$.Button,{
			title:L('add_account'),
			top:20
		}));
		
		container.add(unLabel);
		container.add(unField);
		container.add(pwLabel);
		container.add(pwField);
		container.add(addButton);
		addAccountView.add(container);
		
		addButton.addEventListener('click', function() {
			Ti.App.fireEvent('app:show.loader');
			
			var acct = new tt.model.Account();
			acct.authorize({
				username:unField.value,
				password:pwField.value,
				success: function(_xhr) {
					try {
						Ti.API.info('New Account Authorized:');
						Ti.API.info(JSON.stringify(acct));
						tt.app.currentAccount = acct;
						Ti.App.Properties.setString('currentAccountID',String(acct.id));

						//on new account, let the rest of the app know a new account is being used
						Ti.App.fireEvent('app:hide.loader');
						Ti.App.fireEvent('app:account.selected');
						Ti.App.fireEvent('app:change.tab',{tabIndex:0}); //Switch to timeline
					}
					catch (e) {
						Ti.API.info(JSON.stringify(e));
						Ti.App.fireEvent('app:hide.loader');
					}
					Ti.App.fireEvent('app:hide.drawer');
				},
				error: function(_e, _xhr) {
					Ti.UI.createAlertDialog({
						title:'Authorization Failed', 
						message:'Sorry, but we couldn\'t verify your Twitter credentials.  Check your username and password and try again.'
					}).show();
					Ti.App.fireEvent('app:hide.drawer');
					Ti.App.fireEvent('app:hide.loader');
				}
			});
		});
		return addAccountView;
	};
})();