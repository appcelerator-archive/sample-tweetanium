/**
 * Appcelerator Titanium Platform
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Tweetanium uses Juicer (https://github.com/cjohansen/juicer) to combine, minify, and obfuscate
 * @depend jquery/jquery-1.4.4.js
 * @depend jquery/jquery.scrollTo/jquery.scrollTo.js
 * @depend tweetanium.js
**/

/*jslint browser: true, devel: true, onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*global $, Titanium, sc, Tweetanium */

//Interacts with the timeline_overlay_base & timeline_overlay DOM structures
Tweetanium.UI.TweetOverlay = (function() {
    var outerTweetainer,
        timelineOverlayBase,
        timelineOverlayTweetbox,
        overlayReplyToUsername,
        overlayMessageType,
        overlayParentId,
        columnWrapper,
        tweetColumns;
        
    function setupEventHandlers() {
        
        //Open links in default web browser
        outerTweetainer.delegate(".pop a", "click",
        function(e) {
            e.preventDefault();

            var externalLink = $(this).attr("href");
            if (externalLink) {
                Titanium.Platform.openURL(externalLink);
            }
        });

        //Tweet hover events
        outerTweetainer.delegate(".tweet", "mouseover",
        function(e) {
            if ($(this).hasClass('default') === false) {
               $(this).addClass("active");
            }
        });
        outerTweetainer.delegate(".tweet", "mouseout",
        function(e) {
            $(this).removeClass("active");
        });

        //Tweet item dialog handler
        outerTweetainer.delegate("img.tweet_add_options", "click",
        function(e) {
            Tweetanium.UI.TweetOverlay.closeTweetOverlays();
            //Start by closing any existing overlay
            var tweetContainer = $(this).parent(),
                tweetContainerColumn = tweetContainer.parent(),
                tweetContainerColumnId = tweetContainerColumn.attr('id'),
                tweetAuthor = sc.helpers.stripTags(tweetContainer.find('.tweet-author').html());

            Titanium.App.Properties.setString("activeTweetOverlayColumn", tweetContainerColumnId);

            if (tweetContainerColumnId === 'search-results') {
                //The search column struture is slightly different because of the 
                //search input box.  Climb an additional level for this one.
                tweetContainerColumn = tweetContainerColumn.parent();
            } else if (tweetContainerColumnId === 'dms') {
                //DMs don't support the retweet/reply options
                Tweetanium.UI.TweetOverlay.alterDMOverlay();
            }

            //Determine which friendship button to show (ie) follow/unfollow
            Tweetanium.Fetcher.getFollowingStatus("@" + Tweetanium.Auth.getUsername(), "@" + tweetAuthor,
            function(friendship) {
                if (friendship && friendship.relationship) {
                    var following = friendship.relationship.target.following;

                    if (following === true) {
                        Tweetanium.UI.toggleFollowButton('off');
                    } else {
                        Tweetanium.UI.toggleFollowButton('on');
                    }
                }
            });

            //Store a few items for alter use as needed
            overlayReplyToUsername = tweetAuthor;
            overlayParentId = tweetContainer.attr('id').replace(/tweet__/, '');

            //We always slide the selected tweet to the top to assure we
            //enough room for the overlay to sit below it.
            tweetContainerColumn.scrollTo(tweetContainer, 800, {
                onAfter: function() {
                    var offset = tweetContainer.offset();
                    timelineOverlayBase.css({
                        "top": offset.top + 98,
                        "left": offset.left
                    });
                    timelineOverlayBase.fadeIn();
                    tweetContainer.addClass('active-with-overlay');

                    //We apply some margin to the next element so that the
                    //overlapping doesn't look bad
                    tweetContainer.next().addClass('overlay_buffer');
                }
            });
        });

        //Follow/Unfollow event handler
        $('.friendship').click(function(e) {
            var userToActOn = overlayReplyToUsername;

            if ($(this).attr('id') === 'follow') {
                Tweetanium.Poster.follow(userToActOn,
                function(status) {
                    if (status === true) {
                        Tweetanium.UI.toggleFollowButton('off');
                    } else {
                        alert('Unable to follow user. Please try again!');
                    }
                });
            } else {
                Tweetanium.Poster.unfollow(userToActOn,
                function(status) {
                    if (status === true) {
                        Tweetanium.UI.toggleFollowButton('on');
                    } else {
                        alert('Unable to unfollow user. Please try again!');
                    }
                });
            }
        });

        //Tweet dialogs have 2 states (basic & expanded).  This handles the initial basic state interactions.
        $('.timeline_overlay_base_option').click(function(e) {
            var overlayMessageHeader,
                initialReplyToText,
                initialRetweetText;

            switch ($(this).attr('id')) {
            case 'overlay_reply':
                overlayMessageType = 'reply';
                initialReplyToText = '@' + overlayReplyToUsername + ' ';

                //Prefill the reply to username (and update char count to account for the username)
                timelineOverlayTweetbox.val(initialReplyToText);
                Tweetanium.UI.updateTweetCharCount('overlay_tweet', initialReplyToText);

                overlayMessageHeader = '<img src="images/overlay/reply.png" alt="reply" />&nbsp;Reply to @' + overlayReplyToUsername + ':';
                $('#overlay_message_header').html(overlayMessageHeader);

                Tweetanium.UI.TweetOverlay.openTweetOverlayFromBaseOverlay();
                break;
            case 'overlay_retweet':
                overlayMessageType = 'retweet';
                initialRetweetText = 'RT @' + overlayReplyToUsername + ': ' + sc.helpers.stripTags($('#tweet__' + overlayParentId + ' .tweet-body').html());

                //Prefill the tweet
                timelineOverlayTweetbox.val(initialRetweetText);
                Tweetanium.UI.updateTweetCharCount('overlay_tweet', initialRetweetText);

                overlayMessageHeader = '<img src="images/overlay/retweet.png" alt="retweet" />&nbsp;Retweet:';
                $('#overlay_message_header').html(overlayMessageHeader);

                Tweetanium.UI.TweetOverlay.openTweetOverlayFromBaseOverlay();
                break;
            case 'overlay_dm':
                overlayMessageType = 'dm';

                //Reset the tweet input box
                timelineOverlayTweetbox.val('');
                Tweetanium.UI.updateTweetCharCount('overlay_tweet', '');

                overlayMessageHeader = '<img src="images/overlay/dm.png" alt="dm" />&nbsp;DM @' + overlayReplyToUsername + ':';
                $('#overlay_message_header').html(overlayMessageHeader);

                Tweetanium.UI.TweetOverlay.openTweetOverlayFromBaseOverlay();
                break;
            case 'follow':
                break;
            default:
                //Anything else?
            }

        });
        
        //Overlay tweet input handler
        $('#overlay_tweet').bind('input paste keypress',
        function(e) {
            var currentText = $.trim($(this).val());
            
            Tweetanium.UI.updateTweetCharCount('overlay_tweet', currentText);

            if (e.keyCode === 13) {
                Tweetanium.UI.TweetOverlay.replyToTweet(currentText);         
                return false; //Prevents the newline
            }
        });

        //Expanded tweet dialog event handler
        $('#overlay_submit').click(function(e) {
            var currentText = $.trim($('#overlay_tweet').val());

            switch (overlayMessageType) {
            case 'reply':
                Tweetanium.UI.TweetOverlay.replyToTweet(currentText);
                break;
            case 'retweet':
                Tweetanium.Poster.addNewStatus(currentText, null,
                function(status) {
                    if (status === true) {
                        //Clear and close
                        Tweetanium.UI.TweetOverlay.closeTweetOverlays();
                        Tweetanium.UI.resetTweetInput('overlay_tweet');
                    } else {
                        alert('Unable to retweet. Please try again!');
                    }
                });
                break;
            case 'dm':
                Tweetanium.Poster.sendDirectMessage(overlayReplyToUsername, currentText,
                function(status) {
                    if (status === true) {
                        //Clear and close
                        Tweetanium.UI.TweetOverlay.closeTweetOverlays();
                        Tweetanium.UI.resetTweetInput('overlay_tweet');
                    } else {
                        alert('Unable to send DM!');
                    }
                });
                break;
            default:
                //Anything else?
            }
        });
        
        //Events dealing with tweet overlay visibility
        $('.overlay_close').click(Tweetanium.UI.TweetOverlay.closeTweetOverlays);
        
        //Scroll events should close the tweet overlay
        columnWrapper.scroll(Tweetanium.UI.TweetOverlay.closeTweetOverlays);
        tweetColumns.scroll(Tweetanium.UI.TweetOverlay.closeTweetOverlays);
    }
        
    //Public properties and methods
    return {
        /*
        This method performs overlay initialization process
        Expects an object (e.g.):
        {
            outerTweetainerId: 'container4',
            timelineOverlayBaseId: 'timeline_overlay_base',
            timelineOverlayTweetboxId: 'overlay_tweet',
            columnWrapperId: 'wrapper',
            columnsClassname: 'tweet-column'
        }
        */
        init: function(initParams) {
            outerTweetainer = $('#' + initParams.outerTweetainerId);
            timelineOverlayBase = $('#' + initParams.timelineOverlayBaseId);
            timelineOverlayTweetbox = $('#' + initParams.timelineOverlayTweetboxId);
            columnWrapper = $('#' + initParams.columnWrapperId);
            tweetColumns = $('.' + initParams.columnsClassname);
            
            setupEventHandlers();
        },
        
        //Does everything required to close/cleanup after a tweet overlay
        closeTweetOverlays: function() {
            $("#timeline_overlay_base").hide();
            $("#timeline_overlay").hide();
            $('.active-with-overlay').removeClass('active-with-overlay');
            $('.overlay_buffer').removeClass('overlay_buffer');
            Tweetanium.UI.TweetOverlay.revertDMOverlayChanges();
        },

        //Position the timeline overlay in relation to the base overlay
        openTweetOverlayFromBaseOverlay: function() {
            var timelineOverlayBase = $("#timeline_overlay_base"),
            timelineOverlay = $("#timeline_overlay"),
            tbOffset = $("#timeline_overlay_base").offset();

            timelineOverlay.css({
                "top": tbOffset.top,
                "left": tbOffset.left
            });
            timelineOverlayBase.hide();
            timelineOverlay.show();
        },
        
        //DMs don't support reply/retweet so center the single DM option
        alterDMOverlay: function() {
            $('#overlay_reply').addClass('disabled');
            $('#overlay_retweet').addClass('disabled');
            $('#overlay_dm').addClass('single-option');
        },
        
        //Reverts changes made by alterDMOverlay
        revertDMOverlayChanges: function() {
            $('#overlay_reply').removeClass('disabled');
            $('#overlay_retweet').removeClass('disabled');
            $('#overlay_dm').removeClass('single-option');
        },
        
        replyToTweet: function(currentText) {
            if (overlayParentId === '') {
                alert('Error identifying tweet to reply to!');
            } else {
                Tweetanium.Poster.addNewStatus(currentText, overlayParentId,
                function(status) {
                    if (status === true) {
                        //Clear and close
                        Tweetanium.UI.TweetOverlay.closeTweetOverlays();
                        Tweetanium.UI.resetTweetInput('overlay_tweet');
                    } else {
                        alert('Unable to post the reply. Please try again!');
                    }
                });
            }
        }
    };

} ());
