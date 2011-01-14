/**
 * Appcelerator Titanium Platform
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Tweetanium uses Juicer (https://github.com/cjohansen/juicer) to combine, minify, and obfuscate
 * @depend tweetanium.js
 * @depend tweetanium.config.js
**/

/*jslint browser: true, devel: true, onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*global $, Titanium, Tweetanium, sc */

$(document).ready(function() {
    $('#username').focus();

    var authorized  = false,
        loginWindow = Titanium.UI.getCurrentWindow(),
        mainWindow  = Titanium.UI.getMainWindow(),
        activityIndicator = $('#login_activity_indicator');

    //Login handler
    $('#auth').click(function(e) {
        e.preventDefault();
        activityIndicator.show();

        var username = $.trim($('#username').val()),
            password = $.trim($('#password').val());

        authorized = Tweetanium.Auth.doAuth(username, password);
    	if (authorized === false) {
    	    activityIndicator.hide();
    	    $('#login_form input.shake-on-error').effect('shake', { distance: 5 }, 'fast', function() {
    	        $('#login_form .error').html("Unable to authenticate. Please try again!").css('visibility', 'visible');
    	    });
    	} else {
            //Restart with tokens in place to begin fetch
    		Titanium.App.restart();
    	}
    });

});

//If the login window is closed without authentication then we exit the app
//This is a user closing the window manually...
Titanium.API.addEventListener(Titanium.CLOSE, function(event) {
    if (authorized === false) {
       Titanium.App.exit();
    }
});