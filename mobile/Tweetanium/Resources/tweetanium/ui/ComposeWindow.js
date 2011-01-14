(function() {
	tt.ui.createComposeWindow = function(_args) {
		var win = Ti.UI.createWindow({
			fullscreen:false,
			navBarHidden:true,
			backgroundImage:'images/ruff.png'
		}),
		loadingView = tt.ui.createLoadingView(),
		container = Ti.UI.createView({top:$$.headerView.height, layout:'vertical'}),
		headerView = Ti.UI.createView(tt.combine($$.headerView, {
			top:0
		})),
		headerLabel = Ti.UI.createLabel(tt.combine($$.headerText,{
			text:L('new_tweet')
		})),
		cancelButton = Ti.UI.createButton(tt.combine($$.variableTopRightButton, {
			title:L('cancel')
		})),
		tweetField = Ti.UI.createTextArea(tt.combine($$.TextArea,{
			top:10,
			left:10,
			right:10,
			height:$$.platformHeight/3
		})),
		tweetButton = Ti.UI.createButton(tt.combine($$.Button,{
			top:10,
			title:L('post_tweet')
		}));
		
		tt.os({
			iphone:function() { win.modal = true; }
		});
		
		headerView.add(headerLabel);
		headerView.add(cancelButton);
		win.add(headerView);
		container.add(tweetField);
		container.add(tweetButton);
		win.add(container);
		win.add(loadingView);
		
		cancelButton.addEventListener('click', function() {
			win.close();
		});
		
		tweetButton.addEventListener('click', function() {
			Ti.App.fireEvent('app:show.loader');
			tt.app.currentAccount.updateStatus({
				status:tweetField.value,
				success: function(jsonResponse) {
					Ti.API.info(jsonResponse);
					alert('Tweet posted!');
					Ti.App.fireEvent('app:hide.loader');
					win.close();
				}
			});
		});
		
		return win;
	};
})();