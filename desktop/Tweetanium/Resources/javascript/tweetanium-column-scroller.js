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
/*global $, Titanium, Tweetanium */

/*
Works on a DOM structure like so:
<div id="column-scrollers" class="">
    <div class="left arrow"></div>
    <div class="right arrow"></div>
</div>
*/

Tweetanium.UI.ColumnScroller = (function() {
    var titaniumWindow,
        titaniumWindowMinWidth,
        scrollColumns = [],
        scrollPosition = 0, //0 = first column
        columnScroller,
        columnScrollerOptions,
        leftArrow,
        rightArrow,
        columnContainer,
        columnWrapper;
        
    function setupEventHandlers() {
        //Scrolling event handler
        //Note: Scrolling is only supported when is single column mode
        columnScrollerOptions.click(function(e) {
            //We only react to arrow clicks when active
            if ($(this).hasClass('active') === false) {
                return false;
            }
            
            var scrollToColumn,
                direction = $(this).hasClass('left') ? 'left': 'right';
            
            //We only care about click on active arrows (i.e.) min & max columns are the boundaries
            if (direction === 'left' && scrollPosition > 0) {
                scrollPosition--;
                
                //If the right arrow was previously inactive lets active it now
                if (rightArrow.hasClass('active') === false) {
                    rightArrow.addClass('active');
                }
                
                //If we have hit the min boundary (first column) remove active class
                if (scrollPosition === 0) {
                   leftArrow.removeClass('active');
                }
            } else if (direction === 'right' && scrollPosition < (scrollColumns.length - 1)) {
               scrollPosition++;
               
               //If the left arrow was previously inactive lets active it now
               if (leftArrow.hasClass('active') === false) {
                   leftArrow.addClass('active');
               }
               
               //If we have hit the max boundary (last column) remove active class
               if (scrollPosition === (scrollColumns.length - 1)) {  
                  rightArrow.removeClass('active');
                  leftArrow.addClass('active');
               }
            }
            
            scrollToColumn = scrollColumns[scrollPosition];
            columnScroller.addClass('inactive'); //hide the scroller icons while we scroll
            
            columnWrapper.scrollTo(scrollToColumn, 500, {
                onAfter: function() {
                    columnScroller.removeClass('inactive');
                }
            });
        });

        //Pay attention to the resize event to determine when we show/hide the scroller arrows
        //When we hit minWidth (single column mode) we show the column scroller.  Otherwise, keep it hidden.
        Titanium.API.addEventListener(Titanium.RESIZED,
        function(event) {

            if ((titaniumWindow.getWidth() === titaniumWindowMinWidth) && columnScroller.hasClass('inactive')) {
                columnWrapper.css('overflow-x', 'hidden'); //Horz scrolling disabled in single column view
                
                //Bring the home timeline back into view
                columnWrapper.scrollTo(0, 100, {
                    onAfter: function() {
                        //Reset scroll & show the arrows once we've completed the scroll
                        scrollPosition = 0;
                        columnScroller.removeClass('inactive');
                    }
                });
            } else if ((titaniumWindow.getWidth() > titaniumWindowMinWidth) && (columnScroller.hasClass('inactive') === false)) {
                columnScroller.addClass('inactive');
                columnWrapper.css('overflow-x', 'auto'); //Re-enable horz scrolling
            }
        });
    }
        
    //Public properties and methods
    return {
        /*
        This method performs column scroller initialization process
        Expects an object (e.g.):
        {
            titaniumWindow: titaniumWindow, 
            columnScrollerId: 'column-scrollers', 
            columnContainerId: 'container1', 
            columnWrapperId: 'wrapper', 
            columnsClassname: 'tweet-column'
        }
        */
        init: function(initParams) {
            //@TODO: Inspect the init object
            titaniumWindow = initParams.titaniumWindow;
            titaniumWindowMinWidth = titaniumWindow.minWidth;
            columnScroller = $('#' + initParams.columnScrollerId);
            columnScrollerOptions = $('#' + initParams.columnScrollerId + ' .arrow');
            leftArrow = columnScroller.find('.left');
            rightArrow = columnScroller.find('.right');
            columnContainer = $('#' + initParams.columnContainerId);
            columnWrapper = $('#' + initParams.columnWrapperId);
            
            //Track down all of the columns and precaching
            //a node reference for speed.  Less lookups down the line.
            $('.' + initParams.columnsClassname).each(function(index) {
                scrollColumns[scrollColumns.length] = $(this);
            });
            
            setupEventHandlers();
        }
    };

} ());
