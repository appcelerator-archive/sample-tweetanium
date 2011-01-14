/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/

(function() {	
	//Globally available theme object to hold theme colors/constants
	tt.ui.theme = {
		textColor:'#000000',
		grayTextColor:'#888888',
		headerColor:'#333333',
		lightBlue:'#006cb1',
		darkBlue:'#93caed',
		fontFamily: tt.os({
			iphone:'Helvetica Neue',
			android:'Droid Sans'
		})
	};

	//All shared property sets are declared here.
	tt.ui.properties = {
		//grab platform dimensions only once to save a trip over the bridge
		platformWidth: Ti.Platform.displayCaps.platformWidth,
		platformHeight: Ti.Platform.displayCaps.platformHeight,
		
		//we use these for default components
		Button: {
			backgroundImage:'images/button_bg.png',
			height:50,
			width:250,
			color:'#000',
			font: {
				fontSize:18,
				fontWeight:'bold'
			}
		},
		Label: {
			color:tt.ui.theme.textColor,
			font: {
				fontFamily:tt.ui.theme.fontFamily,
				fontSize:12
			},
			height:'auto'
		},
		Window: {
			backgroundImage:'images/ruff.png',
			navBarHidden:true,
			softInputMode:(Ti.UI.Android) ? Ti.UI.Android.SOFT_INPUT_ADJUST_RESIZE : ''
		},
		TableView: {
			backgroundImage:'images/ruff.png',
			separatorStyle:Ti.UI.iPhone.TableViewSeparatorStyle.NONE
		},
		TableViewRow: {
			backgroundImage:'images/tweet_bg.png',
			selectedBackgroundColor: tt.ui.theme.darkBlue, //I know, this is dumb, but it's currently inconsistent x-platform
			backgroundSelectedColor: tt.ui.theme.darkBlue,
			//height:110,
			className:'tvRow'
		},
		TextField: {
			height:55,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			color:'#000000'
		},
		
		//we use these as JS-based 'style classes'
		animationDuration: 500,
		stretch: {
			top:0,bottom:0,left:0,right:0
		},
		headerText: {
			top:8,
			height:'auto',
			textAlign:'center',
			color:tt.ui.theme.headerColor,
			font: {
				fontFamily:tt.ui.theme.fontFamily,
				fontSize:18,
				fontWeight:'bold'
			}
		},
		headerView: {
			backgroundImage:'images/header_bg.png',
			height:40
		},
		boldHeaderText: {
			height:'auto',
			color:'#000000',
			font: {
				fontFamily:tt.ui.theme.fontFamily,
				fontSize:14,
				fontWeight:'bold'
			}
		},
		smallText: {
			color:tt.ui.theme.grayTextColor,
			font: {
				fontFamily:tt.ui.theme.fontFamily,
				fontSize:10
			},
			height:'auto'
		},
		spacerRow: {
			backgroundImage:'images/spacer_row.png',
			height:30,
			className:'spacerRow'
		}
	};
})();

//global shortcut for UI properties, since these get used A LOT. polluting the global
//namespace, but for a good cause (saving keystrokes)
var $$ = tt.ui.properties;
