/**
 * Appcelerator Titanium Platform
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Tweetanium uses Juicer (https://github.com/cjohansen/juicer) to combine, minify, and obfuscate
 * @depend tweetanium.js
 * @depend tweetanium.config.js
 * @depend tweetanium-column-scroller.js
 * @depend tweetanium-tweet-overlay.js
**/

/*jslint browser: true, devel: true, onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*global $, Titanium, Tweetanium, sc */

$(document).ready(function() {

    //Perform app initialization (ie) xAuth setup/verification & data fetch
    var tiWindow = Titanium.UI.getCurrentWindow(),
        tiPlatform = Titanium.Platform.getName().toLowerCase(),
        aboutAppceleratorDialog,
        aboutTitaniumDialog,
        columnScrollerOptions,
        columnWrapperId = 'wrapper',
        tweetOverlayOptions,
        tweetColumnContainerId = 'container4',
        columnsClassname = 'tweet-column';
        
    Tweetanium.init();
    
    Tweetanium.UI.showRotationNotification();
    
    //Setup the column scroller
    columnScrollerOptions = {
        titaniumWindow: tiWindow, 
        columnScrollerId: 'column-scrollers', 
        columnContainerId: 'container1', 
        columnWrapperId: columnWrapperId, 
        columnsClassname: columnsClassname
    };
    Tweetanium.UI.ColumnScroller.init(columnScrollerOptions);
    
    //Setup the tweet overlay
    tweetOverlayOptions = {
        outerTweetainerId: tweetColumnContainerId,
        timelineOverlayBaseId: 'timeline_overlay_base',
        timelineOverlayTweetboxId: 'overlay_tweet',
        columnWrapperId: columnWrapperId,
        columnsClassname: columnsClassname
    };
    Tweetanium.UI.TweetOverlay.init(tweetOverlayOptions);

    //Manual refresh event handler
    $('#inactive-refresh').click(function() {
        Tweetanium.Fetcher.scheduleDataRotations();
    });
    
    //Tweet input event handlers
    $('#tweet-input').bind('input paste keypress',
    function(e) {
        var currentText = $.trim($(this).val());

        Tweetanium.UI.updateTweetCharCount('tweet-input', currentText);

        //Submit tweet when the enter key is pressed
        if (e.keyCode === 13) {
            Tweetanium.Poster.addNewStatus(currentText, null,
            function(status) {
                if (status === true) {
                    Tweetanium.UI.resetTweetInput('tweet-input');
                } else {
                    alert('Unable to post the update. Please try again!');
                }
            });

            return false; //Prevents the newline
        }
    });

    //Search input event handler
    $('#search_input').keyup(function(e) {
        //Submit tweet when the enter key is pressed
        if (e.keyCode === 13) {
            var searchText = $.trim($('#search_input').val());
            if (searchText !== '') {
                Tweetanium.Fetcher.doNewSearch(searchText);
            }
        }
    });

    //Handle user logout requests
    $('#logout').click(function() {
        Tweetanium.Auth.doLogout();
    });
    
    //Initialize a couple jQuery UI modal dialogs 
    aboutAppceleratorDialog = $("#about_appcelerator").dialog({
        modal: true,
        width: 280,
        autoOpen: false,
        show: "fade",
        hide: "fade"
    });
    aboutTitaniumDialog = $("#about_titanium").dialog({
        modal: true,
        width: 280,
        autoOpen: false,
        show: "fade",
        hide: "fade"
    });
    $('.footer-item.about').click(function(e) {
        var dialogId = $(this).hasClass('appcelerator');

        if (dialogId === true) {
            aboutAppceleratorDialog.dialog('open');
        } else {
            aboutTitaniumDialog.dialog('open');
        }
    });
    
    //There are handful of minor css tweeks need to make Linux & Windows 
    //look just like the Mac OS X (darwin) version.  Apply those now if needed.
    if (tiPlatform === 'linux') {
        $('#tweetbox .tweet-input-arrow').addClass('linux');
        $('#container4').addClass('linux');
        $('.tweet-column').each(function(index) {
            $(this).addClass('linux');
        });
	    $('#footer .footer-left').addClass('linux');
    } else if (tiPlatform.indexOf('win') === 0) {
        $('#tweetbox .tweet-input-arrow').addClass('win');
        $('#container4').addClass('win');
        $('.tweet-column').each(function(index) {
            $(this).addClass('win');
        });
    }
    
    //We resize the dialogs, columns & containers with the entire window
    Titanium.API.addEventListener(Titanium.RESIZED,
    function(event) {
        var newWindowHeight = parseInt(tiWindow.getHeight(), 10);
        
        /* Slight height adjustments to account for toolbar differences in other platforms */
        if (tiPlatform === 'linux') {
            $('#' + tweetColumnContainerId).css('height', (newWindowHeight - 192));
            $('.tweet-column').css('height', (newWindowHeight - 192));
        } else if (tiPlatform.indexOf('win') === 0) {
            $('#' + tweetColumnContainerId).css('height', (newWindowHeight - 182));
            $('.tweet-column').css('height', (newWindowHeight - 182));
        } else {
            $('#' + tweetColumnContainerId).css('height', (newWindowHeight - 164));
            $('.tweet-column').css('height', (newWindowHeight - 164));
        }
        
        //We also need to make sure we recenter dialogs
        aboutAppceleratorDialog.dialog("option", "position", "center");
        aboutTitaniumDialog.dialog("option", "position", "center");
    });

});
