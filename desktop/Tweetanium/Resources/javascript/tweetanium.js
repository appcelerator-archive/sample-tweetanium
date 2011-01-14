/**
 * Appcelerator Titanium Platform
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Tweetanium uses Juicer (https://github.com/cjohansen/juicer) to combine, minify, and obfuscate
 * @depend jquery/jquery-1.4.4.js
 * @depend jquery/jquery-ui-custom/js/jquery-ui-1.8.7.custom.min.js
 * @depend jquery/jquery.scrollTo/jquery.scrollTo.js
**/

/*jslint browser: true, devel: true, onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*global $, Titanium, sc, SpazAuth, SpazTwit, SPAZCORE_ACCOUNT_TWITTER, SPAZCORE_AUTHTYPE_OAUTH, SPAZCORE_SECTION_HOME, SPAZCORE_SECTION_DMS, 
SPAZCORE_SECTION_REPLIES */

var Tweetanium = (function() {

    //Private properties and methods
    var crtUsername,
        Notifications,
        OAuth,
        scAuth,
        authPickle,
        scTwitter,
        tweetSource = 'Tweetanium',
        dataRotationTimer,
        dataRotationInterval = 60000, //1 minute
        dataRotationCounter = 0,
        dataRotationNotificationItems = {
            "home": 0,
            "replies": 0,
            "dms": 0,
            "search-results": 0
        };
        
    //Object for OAuth related functions
    OAuth = {
        //Pass a string created with SpazOAuth.save
        storeAuthPickle: function(authPickle) {
            Titanium.App.Properties.setString("AuthenticatedTokenInfo", authPickle);
        },

        destroyAuthPickle: function() {
            Titanium.App.Properties.setString("AuthenticatedTokenInfo", '');
        },

        getAuthPickle: function() {
            try {
                //Should be able to call getString with a default value, but doesn't appear to
                //be working at the moment
                return Titanium.App.Properties.getString("AuthenticatedTokenInfo");
            } catch(e) {
                //An exception is thrown if the property cannot be found (e.g.) first timer
                return null;
            }
        },

        registerSpazOAuthService: function() {
            //Configure Spaz authentication
            // Include Twitter configuration - your keys must be approved for xAuth.
            // More info: http://dev.twitter.com/pages/xauth
            SpazAuth.addService(SPAZCORE_ACCOUNT_TWITTER, {
                authType: SPAZCORE_AUTHTYPE_OAUTH,
                consumerKey: Tweetanium.Config.consumerkey_twitter,
                consumerSecret: Tweetanium.Config.consumersecret_twitter,
                accessURL: 'https://twitter.com/oauth/access_token'
            });
        }
    };
    
    Notifications = {
        //Used to determine the users notification preference
        getNotificationSetting: function() {
            var currentNotifactionState; //default
            try {
                //Should be able to call getString with a default value, but doesn't appear to
                //be working at the moment
                 currentNotifactionState = Titanium.App.Properties.getString("TweetaniumNotifications");
            } catch(e) {
                //An exception is thrown if the property cannot be found (e.g.) first timer
                currentNotifactionState = "true";
            }

            return currentNotifactionState;
        },
        
        //Used to update the users notification preference
        updateNotificationSetting: function(newSetting) {
            Titanium.App.Properties.setString("TweetaniumNotifications", newSetting);
        }
    };
    
    //Used to verify we have an network connection before performing network related activities
    function doConnectionTest() {
        if (Titanium.Network.online === false) {
            alert('You must have an network connection to use this application! Please check your connection and try again.');
            return false;
        }
    }
    
    function countPropertiesInObject(objectToCount) {
        var prop, 
            count = 0;

        for(prop in objectToCount) {
            if (objectToCount.hasOwnProperty(prop)) {
                count++;
            }
        }

        return count;
    }

    //Public properties and methods
    return {
        //This method performs application initialization process (ie) OAuth setup/verification, initial data fetch, etc
        init: function() {
            OAuth.registerSpazOAuthService();

            //Setup Auth
            authPickle = OAuth.getAuthPickle();
            if (authPickle !== '' && authPickle !== null) {
                // Load OAuth from serialized string
                scAuth = new SpazAuth('twitter');
                scAuth.load(authPickle);
                scTwitter = new SpazTwit({
                    'auth': scAuth,
                    'event_mode': 'jquery'
                });

                //Update the user profile pic
                $(".tweet-profile-pic").attr("src", Tweetanium.UI.getProfileImageUrlFromUsername(scAuth.username));
                crtUsername = scAuth.username;

                //Restore last search or setup default
                Titanium.App.Properties.setString("activeSearchLastId", "");
                $('#search_input').val(Tweetanium.Fetcher.getSearchString());
                
                //Will be used to hold the id of a column with an active overlay
                Titanium.App.Properties.setString("activeTweetOverlayColumn", "");
                
                //Setups up the Tweetanium menu
                Tweetanium.UI.updateTweetaniumMenu();
                
                //Preform initial data fetch and schedule future runs
                Tweetanium.Fetcher.scheduleDataRotations();
            } else {
                //User is at the login window so they can go through Auth.doAuth
                Tweetanium.UI.showLoginWindow();
            }
        },
        
        Auth: {
            //The public auth method used to interact with our private OAuth related methods
            doAuth: function(username, password) {
                OAuth.registerSpazOAuthService();

                scAuth = new SpazAuth('twitter');
                var result = scAuth.authorize(username, password);
                if (result) {
                    //Save off the OAuth info so we don't have to do this dance again
                    authPickle = scAuth.save();
                    scAuth.load(authPickle);
                    scTwitter = new SpazTwit({
                        'auth': scAuth,
                        'event_mode': 'jquery'
                    });
                    OAuth.storeAuthPickle(authPickle);
                } else {
                    return false;
                }
            },

            doLogout: function() {
                //Cancel any scheduled intervals
                if (dataRotationTimer !== undefined && dataRotationTimer !== null) {
                    clearInterval(dataRotationTimer);
                }
                OAuth.destroyAuthPickle();
                crtUsername = '';
                Tweetanium.UI.showLoginWindow();
            },

            getUsername: function() {
                return crtUsername;
            }
        },

        UI: {
            showLoginWindow: function() {
                var mainWindow = Titanium.UI.getMainWindow(),
                loginWindow = Titanium.UI.createWindow("app://login.html");

                mainWindow.hide();
                loginWindow.open();
            },

            //Constructs an HTML block for a given set of timeline objects
            buildTimelineHTML: function(fetcherResults) {
                var html = '';
                fetcherResults.forEach(function(tweet) {
                    html += Tweetanium.UI.buildColumnItem(tweet.id, tweet.user.profile_image_url, tweet.user.screen_name, tweet.created_at, tweet.text);
                });

                return html;
            },

            //Constructs an HTML block for a given set of direct message objects
            buildDMHTML: function(fetcherResults) {
                var html = "";
                fetcherResults.forEach(function(dm) {
                    //The send profile image isn't in the response so we'll need to construct ourselves
                    var profileImageURL = Tweetanium.UI.getProfileImageUrlFromUsername(dm.sender_screen_name);
                    
                    html += Tweetanium.UI.buildColumnItem(dm.id, profileImageURL, dm.sender_screen_name, dm.created_at, dm.text);
                });

                return html;
            },

            //Constructs an HTML block for a given set of search result objects
            buildSearchHTML: function(fetcherResults) {
                var i = 0,
                    html = "";
                
                fetcherResults.forEach(function(searchResult) {
                    if (i === 0) {
                        Titanium.App.Properties.setString("activeSearchLastId", searchResult.id_str);
                        i++;
                    }
                    
                    html += Tweetanium.UI.buildColumnItem(searchResult.id_str, searchResult.profile_image_url, searchResult.from_user, searchResult.created_at, searchResult.text);
                });

                return html;
            },
            
            //Used to build the actual HTML that forms a single tweet
            //If it was much more complex or you found yourself doing a lot of HTML concatenation like this
            //you might consider a templating tool like EJS (http://embeddedjs.com/)
            buildColumnItem: function(id, profile_image_url, username, created_at, body) {
                var html = "";
                html += '<div id="tweet__' + id + '" class="tweet pop">';

                if (profile_image_url !== null) {
                    html += '<div class="tweet-profile-image"><img alt="profile image" src="' + profile_image_url + '" /></div>';
                }

                html += '<div class="tweet-header">';
                html += '<span class="tweet-author"><a href="http://twitter.com/' + username + '">' + username + '<a/></span>';
                html += '<span class="tweet-date">' + sc.helpers.getRelativeTime(created_at) + '</span>';
                html += '</div>';
                html += '<div class="tweet-body pop">';
                html += sc.helpers.makeClickable(body, {
                    'autolink': {
                        'type': 'url'
                    }
                });
                html += '</div>';
                html += '<img class="tweet_add_options" alt="show options" src="images/timeline_add_options.png" />';
                html += '</div>';

                return html;
            },
            
            //Loads an HTML block into the DOM
            updateColumn: function(columnId, columnType, fetcherResults) {
                var htmlBlock,
                newLen = 0;

                switch (columnType) {
                case 'timeline':
                    htmlBlock = Tweetanium.UI.buildTimelineHTML(fetcherResults);                    
                    break;
                case 'dm':
                    htmlBlock = Tweetanium.UI.buildDMHTML(fetcherResults);
                    break;
                case 'search':
                    htmlBlock = Tweetanium.UI.buildSearchHTML(fetcherResults);
                    break;
                default:
                    Titanium.API.log('Tweetanium.UI.updateColumn: Unable to process result!');
                }
                
                //Update the notification item count (the count is reset later when actually displayed)
                dataRotationNotificationItems[columnId] += countPropertiesInObject(fetcherResults);
                
                $('#' + columnId + ' .default').hide(); //Hide the default row
                $('#' + columnId).prepend(htmlBlock);
                newLen = $('#' + columnId + ' .tweet').not('.default').length || 0;
                $('#' + columnId + '-icons' + ' .tweet-column-count').html(newLen);
            },
            
            //Deals with updating the visible tweet character counters
            updateTweetCharCount: function(tweetInputId, currentText) {
                if (currentText.length > 140) {
                    currentText = currentText.substr(0, 140);
                    $('#' + tweetInputId).val(currentText); //trim to 140 max
                } else {
                    $('#' + tweetInputId).parent().find('.tweet-char-count').html(140 - currentText.length);
                }
            },
            
            //Clears out a tweet input textarea
            resetTweetInput: function(tweetInputId) {
                $('#' + tweetInputId).val('');
                $('#' + tweetInputId).parent().find('.tweet-char-count').html(140);
            },
            
            //Used to display the proper relationship button based on a friendship status
            toggleFollowButton: function(toggleState) {
                if (toggleState === 'on') {
                    //show the follow button
                    $('#unfollow').css('display', 'none');
                    $('#follow').css('display', 'block');
                } else {
                    //show the unfollow button
                    $('#follow').css('display', 'none');
                    $('#unfollow').css('display', 'block');
                }
            },
            
            getProfileImageUrlFromUsername: function(username) {
                return "http://api.twitter.com/1/users/profile_image/" + username;
            },
            
            //Assembles new notifcation
            buildRotationNotificationMessage: function() {
                var prop,
                    message = '',
                    messageParts = [];
                
                for (prop in dataRotationNotificationItems) {                    
                    if (dataRotationNotificationItems.hasOwnProperty(prop) && dataRotationNotificationItems[prop] > 0) {
                        messageParts[messageParts.length] = dataRotationNotificationItems[prop] + ' ' + prop.replace('-', ' ');       
                        dataRotationNotificationItems[prop] = 0; //Reset once retrieved
                    }
                }
                
                if (messageParts.length > 0) {
                    message = 'There were ' + messageParts.join(', ') + ' found.';
                }
                
                return message;
            },
            
            //Determines if we should show notifications
            showRotationNotification: function() {
                //We could have some async responses after logout which we don't want to raise a 
                //notification about so check the username as well as the users preference.
                if (Tweetanium.Auth.getUsername() !== '' && Notifications.getNotificationSetting() === "true") {
                    var notify = Titanium.Notification.createNotification(),
                        notificationMessage = Tweetanium.UI.buildRotationNotificationMessage();

                    if (notificationMessage !== '') {
                        notify.setTitle("New results found");
                        notify.setMessage(notificationMessage);
                        notify.show();
                    }
                }
            },
            
            //Updates the Tweetanium menu
            updateTweetaniumMenu: function() {
                var menu = Titanium.UI.createMenu(),
                    notificationsMenuItem = Titanium.UI.createMenuItem("Notifications"),
                    notificationsEnabled = Notifications.getNotificationSetting();
                
                if (notificationsEnabled === "true") {
                    notificationsMenuItem.addCheckItem("Disable Notifications", function() {
                        Notifications.updateNotificationSetting("false");
                        Tweetanium.UI.updateTweetaniumMenu();
                    });
                } else {
                    notificationsMenuItem.addCheckItem("Enable Notifications", function() {
                        Notifications.updateNotificationSetting("true");
                        Tweetanium.UI.updateTweetaniumMenu();
                    });
                }
                    
                menu.appendItem(notificationsMenuItem);
                Titanium.UI.setMenu(menu);
            }
        },
        
        //Object that deals with fetching remote data
        Fetcher: {
            activeRefreshIcon: $('#active-refresh'),
            inactiveRefreshIcon: $('#inactive-refresh'),
            
            //Helps keep track of outbound asynchronous calls
            registerRotationEvent: function() {
                //Titanium.API.log("New rotation event registered");
                dataRotationCounter++;

                if (dataRotationCounter === 1) {
                    //First one in turns on the lights
                    //Titanium.API.log("New data rotation in progress");        
                    Tweetanium.Fetcher.activeRefreshIcon.css('display', 'inline');
                    Tweetanium.Fetcher.inactiveRefreshIcon.css('display', 'none');
                }
            },
            
            //Helps keep track of inbound asynchronous responses
            unregisterRotationEvent: function() {
                //Titanium.API.log("Rotation event unregistered");
                if (dataRotationCounter && dataRotationCounter > 0) {
                    dataRotationCounter--;
                }

                //The last one must turn out the lights
                if (dataRotationCounter === 0) {
                    //Titanium.API.log("Data rotation complete");
                    Tweetanium.Fetcher.activeRefreshIcon.css('display', 'none');
                    Tweetanium.Fetcher.inactiveRefreshIcon.css('display', 'inline');
                    Tweetanium.Fetcher.getRateLimitStatus(); //Update the rate limit indicator
                    
                    //At the end of each rotation we display a system notification
                    //that includes all the results we've found since the last notification
                    //was displayed.
                    Tweetanium.UI.showRotationNotification();
                    
                    //getSearchResults doesn't fire the callback when there are not results
                    //so check when the rotation is complete and if the current search doesn't
                    //have any results make sure to show the default row & update the counter.
                    dataRotationNotificationItems['search-results'] = 0;
                    var searchCount = $('#search-results .tweet').length || 0;
                    if (searchCount === 0) {
                        $('#search-results-icons .tweet-column-count').html(0);
                        $('#search .default').show();
                    }
                }
            },
            
            //Verify we are safe to run a specific fetch
            //@tweetColumnId - optional
            isSafeToFetch: function(tweetColumnId) {
                //We keep track of which column has an open dialog.  That column will not perform
                //autorefreshes until it is closed to prevent the overlay position from being impacted.
                var activeTweetOverlayColumn = Titanium.App.Properties.getString("activeTweetOverlayColumn", "");
                if ((doConnectionTest() === false) || (tweetColumnId && (activeTweetOverlayColumn === tweetColumnId))) {
                    return false;
                } else {
                    return true;
                }
            },
            
            //Deals with fetching data and updating a users home timeline
            getHomeTimeline: function() {
                var lastId,
                    columnId = 'home';
                
                if (Tweetanium.Fetcher.isSafeToFetch(columnId) === true) {
                    Tweetanium.Fetcher.registerRotationEvent();
                    lastId = scTwitter.getLastId(SPAZCORE_SECTION_HOME) || null;

                    scTwitter.getHomeTimeline(lastId, 200, null, null,
                    function(fetcherResults) {
                        if (fetcherResults && fetcherResults !== null) {
                            Tweetanium.UI.updateColumn(columnId, 'timeline', fetcherResults.reverse());
                        }

                        Tweetanium.Fetcher.unregisterRotationEvent();
                    },
                    function() {
                        Titanium.API.log('Tweetanium.Fetcher.getHomeTimeline: Unable to fetch timeline!');
                        Tweetanium.Fetcher.unregisterRotationEvent();
                    });
                }
            },
            
            //Deals with fetching data and updating a users replies timeline
            getReplies: function() {
                var lastId,
                    sortedFetcherResults,
                    columnId = 'replies';
                
                if (Tweetanium.Fetcher.isSafeToFetch(columnId) === true) {
                    Tweetanium.Fetcher.registerRotationEvent();
                    lastId = scTwitter.getLastId(SPAZCORE_SECTION_REPLIES) || null;

                    scTwitter.getReplies(lastId, 200, null, null,
                    function(fetcherResults) {
                        if (fetcherResults && fetcherResults !== null) {
                            //Replies are not returned in sorted order which impacts display order and
                            //the last recorded id.  Sort and update before appending.
                            sortedFetcherResults = Tweetanium.Fetcher.sortTweetsDesc(fetcherResults);
                            scTwitter.setLastId(SPAZCORE_SECTION_REPLIES, sortedFetcherResults[0].id);
                            Tweetanium.UI.updateColumn(columnId, 'timeline', sortedFetcherResults);
                        }

                        Tweetanium.Fetcher.unregisterRotationEvent();
                    },
                    function() {
                        Titanium.API.log('Tweetanium.Fetcher.getReplies: Unable fetch timeline!');
                        Tweetanium.Fetcher.unregisterRotationEvent();
                    });
                }
            },
            
            //Deals with fetching data and updating a users dm timeline
            getDirectMessages: function() {
                var lastId,
                    sortedFetcherResults,
                    columnId = 'dms';
                
                if (Tweetanium.Fetcher.isSafeToFetch(columnId) === true) {
                    Tweetanium.Fetcher.registerRotationEvent();
                    lastId = scTwitter.getLastId(SPAZCORE_SECTION_DMS) || null;

                    scTwitter.getDirectMessages(lastId, 200, 1, null,
                    function(fetcherResults) {
                        if (fetcherResults && fetcherResults !== null) {
                            //DMs are not returned in sorted order which impacts display order and
                            //the last recorded id.  Sort and update before appending.
                            sortedFetcherResults = Tweetanium.Fetcher.sortTweetsDesc(fetcherResults);
                            scTwitter.setLastId(SPAZCORE_SECTION_DMS, sortedFetcherResults[0].id);
                            
                            Tweetanium.UI.updateColumn(columnId, 'dm', sortedFetcherResults);
                        }

                        Tweetanium.Fetcher.unregisterRotationEvent();
                    },
                    function() {
                        Titanium.API.log('Tweetanium.Fetcher.getDirectMessages: Unable fetch timeline!');
                        Tweetanium.Fetcher.unregisterRotationEvent();
                    });
                }
            },
            
            //Used to perform a new search
            //Stores the search term for future restores & refreshes
            doNewSearch: function(searchText) {
                //Store the new term & empty out old search results
                Titanium.App.Properties.setString("activeSearchText", searchText);
                Titanium.App.Properties.setString("activeSearchLastId", "");
                $('#search-results').empty();
                Tweetanium.Fetcher.getSearchResults();
            },
            
            getLastSearchId: function() {
                return Titanium.App.Properties.getString("activeSearchLastId");
            },
            
            //Grabs the latest (or default) search text
            getSearchString: function() {
                var searchText;

                try {
                    //Should be able to call getString with a default value, but doesn't appear to
                    //be working at the moment
                    searchText = Titanium.App.Properties.getString("activeSearchText");
                } catch(e) {
                    //We use "Appcelerator" as a default sample search
                    searchText = 'Appcelerator';
                }

                return searchText;
            },

            //Used to fetch search results for the current search term(s)
            // NOTES: 
            // * This is just a very basic sample search.  It doesn't deal with pagination, etc.
            // * Spaz search not respecting the since_id so this is custom for now.  There are issues
            // around since_id.  See http://bit.ly/gIcB1T, http://bit.ly/cmNtwf, & http://bit.ly/i9ynMW.
            getSearchResults: function() {
                var xhr,
                    searchURL,
                    searchText,
                    lastSearchId,
                    fetcherResults,
                    columnId = 'search-results';
                
                if (Tweetanium.Fetcher.isSafeToFetch(columnId) === true) {
                    Tweetanium.Fetcher.registerRotationEvent();

                    searchText = Tweetanium.Fetcher.getSearchString();
                    lastSearchId = Tweetanium.Fetcher.getLastSearchId();
                    searchURL = 'http://search.twitter.com/search.json?q=' + encodeURIComponent(searchText) + '&rpp=100&page=1&lang=en&since_id=' + lastSearchId;

                    xhr = Titanium.Network.createHTTPClient();  
                    
                    xhr.onload = function() {
                        if (this.responseText && this.responseText !== null) {
                            //Parse can fail
                            try {
                                fetcherResults = JSON.parse(this.responseText);
                                if (fetcherResults && fetcherResults !== null) {
                                    $('#search .default').hide();
                                    Tweetanium.UI.updateColumn(columnId, 'search', fetcherResults.results);
                                }
                            } catch(e) {
                                Titanium.API.log('Tweetanium.Fetcher.getSearchResults: Unable to perform search!');
                            }
                            
                            Tweetanium.Fetcher.unregisterRotationEvent();
                        }
                    };
                    
                    xhr.onerror = function() {
                        Titanium.API.log('Tweetanium.Fetcher.getSearchResults: Unable to perform search!');
                        Tweetanium.Fetcher.unregisterRotationEvent();
                    };
                    
                    xhr.open("GET", searchURL);  
                    xhr.send();
                }
            },
            
            //Sorts tweets by date desc
            sortTweetsDesc: function(fetcherResults) {
                var fr = fetcherResults;
                fr.sort(function(a, b){
                    var dateA = new Date(a.created_at), 
                        dateB = new Date(b.created_at);
                    return dateB - dateA; //date desc
                });
                
                return fr;
            },
            
            //Fetches/processes all the various Twitter timeline data for us
            //Called via scheduleDataRotations
            fetchAll: function() {
                if (Tweetanium.Fetcher.isSafeToFetch() === true) {
                    Tweetanium.Fetcher.getHomeTimeline();
                    Tweetanium.Fetcher.getReplies();
                    Tweetanium.Fetcher.getDirectMessages();
                    Tweetanium.Fetcher.getSearchResults();
                }
            },

            /**
            * Data rotations are fired at set intervals. Some actions like hitting refresh, posting a tweet, etc
            * require us to stop a rotation, fire one immediately, and then reconstruct the scheduled intervals.
            * 
            * NOTE: This is a fairly simple way of handling this... yes it could be made more robust.
            */
            scheduleDataRotations: function() {
                //Rotations are asyncronous.  Don't start a new one
                //if an older one is still in progress.  Prevent doubling up.
                if (dataRotationCounter === 0) {
                    //If we are interrupting a previously scheduled rotation
                    //clear it first and setup a new rotation.
                    if (dataRotationTimer !== undefined && dataRotationTimer !== null) {
                        clearInterval(dataRotationTimer);
                    }

                    Tweetanium.Fetcher.fetchAll();  //Run immediately
                    dataRotationTimer = setInterval(function() {
                        Tweetanium.Fetcher.fetchAll();
                    }, dataRotationInterval);  //Schedule future runs
                }
            },
            
            //Twitter limits API calls to X per hour.  This is used to see how many a user has left.
            getRateLimitStatus: function() {
                if (Tweetanium.Fetcher.isSafeToFetch() === true) {
                    scTwitter.getRateLimitStatus(function(limit) {
                        $('#rate-limit').html(' (' + limit.remaining_hits + ')');
                    },
                    function() {
                        //do nothing
                    });
                }
            },

            //Helps determine which button to display in the tweet overlay
            getFollowingStatus: function(targetUserId, sourceUserId, callback) {
                if (Tweetanium.Fetcher.isSafeToFetch() === true) {
                    scTwitter.showFriendship(targetUserId, sourceUserId,
                    function(friendship) {
                        callback(friendship);
                    },
                    function(e) {
                        Titanium.API.log("Tweetanium.Fetcher.getFollowingStatus: Unable to determine following status!");
                    });
                }
            }
        },
        
        //Object that deals with posting data/updates to a remote web service
        Poster: {
            //Verify we are safe to perform a remote call
            isSafeToPost: function() {
                //Methods could call doConnectionTest directly, but there may eventually be 
                //more things we want to check before making outbound calls so abstracting a bit. 
                if (doConnectionTest() === false) {
                    return false;
                } else {
                    return true;
                }
            },
            
            //Used to add a new tweet and/or reply to an existing tweet
            addNewStatus: function(statusText, replyToStatusId, callback) {
                if (Tweetanium.Poster.isSafeToPost() === true) {
                    if (statusText !== '' && statusText.length <= 140) {
                        scTwitter.update(statusText, tweetSource, replyToStatusId,
                        function() {
                            Tweetanium.Fetcher.scheduleDataRotations(); //Run the next fetch right away
                            callback(true);
                        },
                        function() {
                            callback(false);
                        });
                    } else {
                        alert('Invalid message! Please try again.');
                    }
                }
            },
            
            //Sends a DM
            sendDirectMessage: function(userId, statusText, callback) {
                if (Tweetanium.Poster.isSafeToPost() === true) {
                    if (statusText !== '' && statusText.length <= 140) {
                        scTwitter.sendDirectMessage('@' + userId, statusText,
                        function() {
                            callback(true);
                        },
                        function(e) {
                            callback(false);
                        });
                    } else {
                        alert('Invalid message! Please try again.');
                    }
                }
            },
            
            //Used to follow a user
            follow: function(userId, callback) {
                if (Tweetanium.Poster.isSafeToPost() === true) {
                    scTwitter.follow('@' + userId,
                    function() {
                        callback(true);
                    },
                    function(e) {
                        callback(false);
                    });
                }
            },
            
            //Used to unfollow a user
            unfollow: function(userId, callback) {
                if (Tweetanium.Poster.isSafeToPost() === true) {
                    scTwitter.unfollow('@' + userId,
                    function() {
                        callback(true);
                    },
                    function(e) {
                        callback(false);
                    });
                }
            }
        }
    };

} ());