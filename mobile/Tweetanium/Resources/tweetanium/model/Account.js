/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/

//Include oAuth dependencies
Ti.include(
	'/lib/oauth/sha1.js', 
	'/lib/oauth/oauth.js'
);

(function() {	
	//Create new Entity 'subclass' using parasitic inheritance
	//http://www.crockford.com/javascript/inheritance.html
	tt.model.Account = function(_opts) {
		var that = new tt.model.Entity('Account');

		//add any passed properties to the object
		tt.mixin(that,_opts);
		
		//General mechanism for handling request errors
		function handleError(_e,_xhr,_custom) {
			if (_custom) {
				_custom(e,xhr);
			}
			else {
				Ti.API.error('Twitter Error: '+JSON.stringify(_e)+'\nServer response: '+_xhr.responseText);
				tt.ui.alert(L('twitter_error'), L('twitter_error_general'));
				Ti.App.fireEvent('app:hide.loader');
			}
		}

		/*
			Authorize this account via xAuth, and store the necessary keys (not un/pw)
			implements the first steps of the oAuth Mambo - BARF.  No need to take additional
			action on success, other than to know that the account is ready to go.
			
			Example parameters:
			_params = {
				username: 'jhaynie',
				password: '12345', //same as luggage ;)
				success: function(xhr) {
					//HTTPClient object given 'case you need it
				},
				error: function(e,xhr) {
					//handle the error - raw xhr object given for diagnostic purposes
				}
		*/
		that.authorize = function(/*Object*/ _params) {
			var requestUrl = 'https://api.twitter.com/oauth/access_token';
			var accessor = { consumerSecret: tt.config.consumer_secret };
			var message = {
				method: 'POST',
				action: requestUrl,
				parameters: [
					['oauth_signature_method', 'HMAC-SHA1'],
					['oauth_consumer_key', tt.config.consumer_key],
					['oauth_version', '1.0'],
					['x_auth_username', _params.username],
					['x_auth_password', _params.password],   
					['x_auth_mode', 'client_auth'],
					['format', 'json']
				]
			};
			
			OAuth.setTimestampAndNonce(message);
	    OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp());
	    OAuth.SignatureMethod.sign(message, accessor);
	    var finalUrl = OAuth.addToURL(message.action, message.parameters);
	
			var xhr = Titanium.Network.createHTTPClient();
			xhr.onerror = function(e){
				Ti.API.error('Error received while requesting tokens for Twitter xAuth: '+JSON.stringify(e));
				if (_params.error) {
					_params.error(e,xhr);
				}
			};	
			xhr.onload = function(){
				var uri = this.responseText;
				var queryString = {};
				uri.replace(
					new RegExp("([^?=&]+)(=([^&]*))?", "g"),
					function($0, $1, $2, $3) { queryString[$1] = $3; 
				});
				var twitter_screen_name = queryString.screen_name;		
				var ftoken = queryString.oauth_token;
				//get 'oauth_token_secret' var
				var fstoken = queryString.oauth_token_secret;
				var twitter_uid = queryString.user_id;

				if(twitter_uid > 0 && twitter_screen_name!=""){
					//Store the necessary Twitter goodies in the model object
					that.twitter_uid = twitter_uid;
					that.twitter_screen_name = twitter_screen_name;
					that.twitter_oauth_token = ftoken;
					that.twitter_oauth_token_secret = fstoken;
					
					//grab additional account details from Twitter, and update when accessed
					var url = 'http://api.twitter.com/1/users/show.json?user_id='+
						twitter_uid +
						'&screen_name=' +
						twitter_screen_name;
					var txhr = Titanium.Network.createHTTPClient();
					txhr.onerror = function(e) {
						Ti.API.error('Error retrieving profile details: ' + e.error);
						Ti.UI.createAlertDialog({
							title:'Error retrieving account data', 
							message:'There was an error retreiving account details for '+twitter_screen_name
						}).show();
					};
					txhr.onload = function() {	
						that.accountDetails = JSON.parse(this.responseText);
						
						//download the avatar image so we have a local copy...
						var c = Titanium.Network.createHTTPClient();
						c.setTimeout(10000);
						c.onload = function() {
							var filename = that.twitter_screen_name+'.png';
							var f = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,filename);
							f.write(this.responseData);
							that.avatar_image = filename;
							
							//save the Account details
							that.save();

							//w00t!
							Ti.API.info('Successfully registered account: '+JSON.stringify(that));
							if (_params.success) {
								_params.success(xhr);
							}
						};
						c.onerror = function(e) {
							Ti.API.error('Error downloading avatar image: ' + e.error);
						};

						c.open('GET', that.accountDetails.profile_image_url);
						c.send();
					};
					txhr.open('GET',url);
					txhr.send();
				} else {
					var err = 'Error received while processing tokens for Twitter xAuth: '+JSON.stringify(that);
					Ti.API.error(err);
					if (_params.error) {
						_params.error({message:err},xhr);
					}
				}
			};
			xhr.open('POST', finalUrl);
			xhr.send();
		};
		
		/*
			Make a Twitter request, authenticated using this account.  Be kind to
			your users - use HTTPS!  All results returned as JSON
			
			Docs: http://dev.twitter.com/doc
			API Console: http://app.apigee.com/console/twitter
		
			Example parameters:
			_params = {
				method: 'POST',
				action: 'https://api.twitter.com/1/statuses/update.json',
				parameters: {
					status: '#titanium from @appcelerator is awesome!'//,other params
				},
				success: function(jsonData, xhr) {
					//do something with the response - HTTPClient object given 'case you need it
				},
				error: function(e,xhr) {
					//handle the error - raw xhr object given for diagnostic purposes
				}
			}
		*/
		that.request = function(/*Object*/ _params) {
			var accessor = {
				tokenSecret: that.twitter_oauth_token_secret, 
				consumerSecret: tt.config.consumer_secret
			};
			var message = {
				method: _params.method,
				action: _params.action,
				parameters: [
					['oauth_signature_method', 'HMAC-SHA1'],
					['oauth_consumer_key', tt.config.consumer_key],
					['oauth_version', '1.0'],
					['oauth_token', that.twitter_oauth_token],
					['format', 'json']
				]
			};
			//load up additional parameters for the request
			var moreParams = _params.parameters||{};
			for (var key in moreParams) {
				if (moreParams.hasOwnProperty(key)) {
					message.parameters.push([key,moreParams[key]]);
				}
			}
			
			//OAuth Mambo...
			OAuth.setTimestampAndNonce(message);
			OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp());
			OAuth.SignatureMethod.sign(message, accessor);
			var postingUrl = OAuth.addToURL(message.action, message.parameters);

			var xhr = Titanium.Network.createHTTPClient();
			xhr.onerror = function(e) {
				Ti.API.error('There was an error posting an OAuth request: '+JSON.stringify(e));
				tt.ui.alert(l('twitter_error'), L('twitter_error_request'));
				if (_params.error) {
					_params.error(e,xhr);
				}
			};

			xhr.onload = function(){
				try {
					if(this.responseText.match(/html xmlns/)){
						if(this.responseText.match(/over capacity/)){
							tt.ui.alert(l('twitter_error'), L('twitter_error_over_capacity'));
						} else {	
							tt.ui.alert(l('twitter_error'), L('twitter_error_general'));
						}
						Ti.API.error('Twitter Error: '+this.responseText);
						return;
					}	

					var jsonReply = JSON.parse(this.responseText);

					//w00t!
					if (_params.success) {
						_params.success(jsonReply,xhr);
					}
				} catch(exception) {
					handleError(exception,xhr);
				}
			};
			xhr.open(_params.method, postingUrl);
			xhr.send();
		};
		
		//grab Tweets for this account's timeline (optionally since the last Tweet ID)
		that.getTimeline = function(/*Object*/ _args) {
			var params = {
				count: _args.count||75
			};
			if (_args.since_id) {
				params.since_id = _args.since_id;
			}
			
			that.request({
				method:'GET',
				action:'https://api.twitter.com/1/statuses/home_timeline.json',
				parameters: params,
				error: function(e,xhr) {
					handleError(e,xhr,_args.error);
				},
				success: function(json,xhr) {
					var results = [];
					for (var i=0,l=json.length;i<l;i++) {
						results.push(new tt.model.Tweet(json[i]));
					}
					if (_args.success) { _args.success(results); }
				}
			});
		};
		
		//grab mentions for account
		that.getMentions = function(/*Object*/ _args) {
			that.request({
				method:'GET',
				action:'https://api.twitter.com/1/statuses/mentions.json',
				parameters: {},
				error: function(e,xhr) {
					handleError(e,xhr,_args.error);
				},
				success: function(json,xhr) {
					var results = [];
					for (var i=0,l=json.length;i<l;i++) {
						results.push(new tt.model.Tweet(json[i]));
					}
					if (_args.success) { _args.success(results); }
				}
			});
		};
		
		//grab dms for account
		that.getDirectMessages = function(/*Object*/ _args) {
			that.request({
				method:'GET',
				action:'https://api.twitter.com/1/direct_messages.json',
				parameters: {},
				error: function(e,xhr) {
					handleError(e,xhr,_args.error);
				},
				success: function(json,xhr) {
					var results = [];
					for (var i=0,l=json.length;i<l;i++) {
						results.push(new tt.model.Tweet(json[i]));
					}
					if (_args.success) { _args.success(results); }
				}
			});
		};
		
		that.updateStatus = function(/*Object*/ _args) {
			that.request({
				method:'POST',
				action:'https://api.twitter.com/1/statuses/update.json',
				parameters: {
					status:_args.status
				},
				error: function(e,xhr) {
					handleError(e,xhr,_args.error);
				},
				success: function(json,xhr) {
					_args.success(json);
				}
			});
		};
		
		return that;
	};
})();