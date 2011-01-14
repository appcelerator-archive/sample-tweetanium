Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
Licensed under the terms of the Apache Public License
Please see the LICENSE included with this distribution for details.

# Tweetanium README #

Tweetanium Desktop is a "sample" cross-platform Twitter application built using 
the [Appcelerator Titanium Desktop](http://www.appcelerator.com/products/titanium-desktop-application-development/).  A free and open source application development platform, Titanium lets you create native mobile, tablet 
and desktop application experiences using existing web skills like Javascript, HTML, 
CSS, Python, Ruby, and PHP.

# xAuth #

Tweetanium Desktop utilizes xAuth with Twitter.  The provided source does not contain 
OAuth keys for security reasons.  To build and run you will need to put valid 
(xAuth approved) keys.  See javascript/tweetanium.config.example.js.

## Building Tweetanium ##

1. Download the source and import into Titanium Developer as a Desktop Project.
2. The project can be packaged and tested from within Titanium Developer.

Tweetanium makes use of [juicer](https://github.com/cjohansen/juicer) to 
help manage JavaScript & CSS file dependencies, concatenation, minification and 
obfuscation.  If you edit any of the core Tweetainium CSS/JS files you'll need 
to run juicer since the application loads the combined/minified version of these
files for performance reasons.

A script is provided for helping automate juicer runs:
utils/juicerize.py

NOTE: JavaScript obfuscation is disabled by default, but can be enabled by passing
a "-o" switch to utils/juicerize.py

### Additional Notes
* Tweetanium makes heavy use of [SpazCore](https://github.com/funkatron/spazcore) for
communicating with the Twitter API.  Special thanks to Ed Finkler and the Spaz team.
