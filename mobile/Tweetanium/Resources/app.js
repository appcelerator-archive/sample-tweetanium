/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/

//We use app.js mainly as a bootstrap file to include our application namespace
//the `tt` namespace is where the magic happens, kinda short for "Tweetanium"
//There is one additional global variable, $$, which will hold 'styles' for our app
//components. We also include an xAuth powered Twitter library which uses the Netflix
//JavaScript oAuth implementation (thanks @kosso)

//Code in this project loosely follows the Google JavaScript style guide:
//http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml

Ti.include('/tweetanium/tweetanium.js');

tt.app.mainWindow = tt.ui.createApplicationWindow();
tt.app.mainWindow.open();