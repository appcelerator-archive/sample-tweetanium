/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/

(function() {
	tt.ui.createLoadingView = function(_args) {
		var loadingView = Ti.UI.createView(tt.combine($$.stretch,{
			visible:false
		})),
		backdrop = Ti.UI.createView(tt.combine($$.stretch, {
			backgroundColor:'#787878',
			opacity:0.85
		})),
		t1 = Titanium.UI.create2DMatrix().scale(0.4),
		loader = Ti.UI.createView({
			backgroundImage:'images/logo_med.png',
			height:80,
			width:80,
			transform: t1
		});
		
		loadingView.add(backdrop);
		loadingView.add(loader);
		
		Ti.App.addEventListener('app:show.loader', function() {
			if (!loadingView.visible) {
				loadingView.visible = true;
				var t2 = Ti.UI.create2DMatrix().scale(2.5),
				a = Ti.UI.createAnimation();

				a.transform = t2;
				a.duration = 1500;
				a.autoreverse = true;
				a.repeat = 90;

				loader.animate(a);
			}
		});
		
		Ti.App.addEventListener('app:hide.loader', function() {
			loadingView.visible = false;
		});
		
		return loadingView;
	};
})();