/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/

(function() {
  //create the about view
  tt.ui.createAboutView = function(_args) {
    var aboutView = Ti.UI.createView($$.stretch);

 		aboutView.add(Ti.UI.createLabel(tt.combine($$.headerText, {text:L('about')})));
		aboutView.add(Ti.UI.createView({
			top:$$.headerView.height,
			bottom:0,
			right:0,
			left:0,
			backgroundImage:'images/about_mock.png'
		}));
		
    return aboutView;
  };
})();