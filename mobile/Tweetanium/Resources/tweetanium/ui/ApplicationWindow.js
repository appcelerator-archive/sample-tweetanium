/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/

(function() {
	var platformWidth = Ti.Platform.displayCaps.platformWidth;
	
	//create the main application window
	tt.ui.createApplicationWindow = function(_args) {
		var win = Ti.UI.createWindow(tt.combine($$.Window,{
			exitOnClose:true,
			orientationModes:[Ti.UI.PORTRAIT]
		})),
		headerView = Ti.UI.createView(tt.combine($$.headerView,{top:0})),
		tabHeight = 60,
		tabWidth = platformWidth/5,
		tabView = Ti.UI.createView({
			bottom:0,
			height:tabHeight,
			backgroundImage:'images/tab_bg.png',
			width:platformWidth
		}),
		tabs = [];
		
		//Add the main app 'filmstrip'	
		var appFilmStrip = tt.ui.createFilmStripView({
			top:0,
			left:0,
			right:0,
			bottom:tabHeight-10,
			views: [
				tt.ui.createTimelineView(),
				tt.ui.createMentionsView(),
				tt.ui.createDMView(),
				tt.ui.createAccountView(),
				tt.ui.createAboutView()
			]
		});
		
		//create the 'tab' view, which we will animate back and forth along the tab bar
		var tab = Ti.UI.createView({
			left:0,
			top:15,
			height:45,
			width:tabWidth,
			bottom:0
		});
		
		tab.add(Ti.UI.createImageView({
			top:0,
			left:0,
			height:10, //might not want to hard-code these, should scale more smarter-er ;)
			width:10,
			image:'images/tab_l.png'
		}));
		
		tab.add(Ti.UI.createView({
			right:10,
			left:10,
			backgroundColor:tt.ui.theme.darkBlue
		}));
		
		tab.add(Ti.UI.createImageView({
			top:0,
			right:0,
			height:10, //might not want to hard-code these, should scale more smarter-er ;)
			width:10,
			image:'images/tab_r.png'
		}));
		
		tabView.add(tab);
		
		//create clickable tab images
		function createTab(_icon,_cb,_on) {
			var view = Ti.UI.createView({
				width:tabWidth
			}),
			off_path = 'images/'+_icon+'.png',
			on_path = 'images/'+_icon+'_on.png',
			dimension = 40,
			image = Ti.UI.createImageView({
				height:dimension,
				width:dimension,
				image:(_on) ? on_path : off_path,
				bottom:2
			});
			
			view.on = _on||false; //ivar for 'on' state
			
			//assemble view
			view.add(image);
			view.addEventListener('click',_cb);
			
			//'instance' method
			view.toggle = function() {
				view.on = !view.on;
				image.image = (view.on) ? on_path : off_path;
			};
			
			return view;
		}
		
		//toggle view state of application to the relevant tab
		function selectIndex(_idx) {
			for (var i = 0, l = tabs.length; i<l; i++) {
				//select the tab and move the tab 'cursor'
				if (_idx === i) {
					//if the tab is already selected, do nothing
					if (!tabs[i].on) {
						Ti.API.info('selecting tab index: '+_idx);
						//animate the tab
						tab.animate({
							duration:$$.animationDuration,
							left:tabWidth*i,
							bottom:0
						},function(idx) { //use closure to retain value of i in idx
							return function() {
								if (!tabs[idx].on) {
									tabs[idx].toggle();
								}
							};
						}(i));
						
						//set the current film strip index
						appFilmStrip.fireEvent('changeIndex',{idx:i});
					}
				}
				else if (tabs[i].on && (_idx !== i)) {
					tabs[i].toggle();
				}
			}
		}
		
		//assemble main app tabs
		// HACK: need to use annonymous functions to wrap selectIndex as a view event handler
		tabs.push(createTab('timeline', function() {
			selectIndex(0);
		},true));
		tabs.push(createTab('mentions', function() {
			selectIndex(1);
		}));
		tabs.push(createTab('dm', function() {
			selectIndex(2);
		}));
		tabs.push(createTab('user', function() {
			selectIndex(3);
		}));
		tabs.push(createTab('appcelerator', function() {
			selectIndex(4);
		}));
		
		//add tabs to layout
		for (var i = 0, l = tabs.length; i<l; i++) {
			tabs[i].left = tabWidth*i;
			tabView.add(tabs[i]);
		}
		
		//App app-level event listener to change tabs
		Ti.App.addEventListener('app:change.tab', function(e) {
			selectIndex(e.tabIndex);
		});
		
		//create 'drawer' view to show drill-down data
		var drawer = tt.ui.createDrawerView();
		
		//create a loading view which we can show on long data loads
		var loader = tt.ui.createLoadingView();
		
		//assemble main app window
		win.add(headerView);
		win.add(tabView);
		win.add(appFilmStrip);
		win.add(drawer);
		win.add(loader);
		
		
		//initialize Twitter goodness and let folks know most of the awesomeness will not be available offline
		if (Ti.Network.online == false) {
			Ti.UI.createAlertDialog({
				title:'No Network Connection', 
				message:'Sorry, but we couldn\'t detect a connection to the internet - new Twitter data will not be available.'
			}).show();
		}
		
		//one-time switch used if no account is present
		function switchit() {
			selectIndex(3);
			Ti.App.removeEventListener('app:drawer.opened', switchit);
		}
		
		//get the current account
		if (!Ti.App.Properties.hasProperty('currentAccountID')) {
			//If we don't have an account, that means none has been entered.  Switch tabs and create one
			Ti.App.fireEvent('app:show.drawer', {showing:'createAccount'});
			//switch tabs after the drawer opens
			Ti.App.addEventListener('app:drawer.opened', switchit);
		} else {
			tt.app.currentAccount = tt.model.load('Account',Ti.App.Properties.getString('currentAccountID'));
			Ti.App.fireEvent('app:account.selected');
		}

		return win;
	};
})();