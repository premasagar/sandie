'use strict';

/*!
* Sandie
*   github.com/premasagar/mishmash/tree/master/sandie/
*
*//*
    Load and isolate JavaScript variables, by injecting scripts into a temporary iframe element.

    by Premasagar Rose
        dharmafly.com

    license
        opensource.org/licenses/mit-license.php
        
    v0.1

*/

this.sandie = (function(){
    var
        window = this,
        document = window.document;

    function isArray(obj){
		return toString.call(obj) === "[object Array]" || obj.constructor === Array || obj instanceof Array;
	}

    function hostBody(){
        return document.getElementsByTagName('body')[0];
    }

    // **

    /*
    *   getScript
    */
    function getScript(src, callback, targetWindow, inOrder){
        targetWindow = targetWindow || window;
        callback = callback || function(){};
    
        /**
         * Load a script into a <script> element
         * @param {String} src The source url for the script to load
         * @param {Function} callback Called when the script has loaded
         */
        function single(src, callback){
            var
                document = targetWindow.document,
                head = document.getElementsByTagName('head')[0],
                script = document.createElement('script'),
                loaded;
                
            script.src = src;
            script.onload = script.onreadystatechange = function(){
                var state = this.readyState;
                if (!loaded && (!state || state === 'complete' || state === 'loaded')){
                    // Handle memory leak in IE
                    script.onload = script.onreadystatechange = null;
                    // head.removeChild(script); // Worth removing script element once loaded?
                    
                    loaded = true;
                    callback.call(targetWindow);
                }
            };
            head.appendChild(script);
        }

        // **

        /**
         * Load array of scripts into script elements.  
         *
         * Note, there is only one callback function here, called after each is loaded
         *
         * @param {Array} srcs array of source files to load
         * @param {Function} callback 
         * @param {Boolean} inOrder - if true, load scripts in given order
         */

        function multiple(srcs, callback, inOrder, targetWindow){
			var
			    length = srcs.length,
				loaded = 0,
				checkIfComplete;

	        callback = callback || function(){};
			
			if (inOrder === true) {
				// Recursive, each callback re-calls getScripts
				// with a shifted array.
				single(srcs.shift(), function(){
					if (length === 1){
						callback.call(targetWindow);
					}
					else {
					    // preserve inOrder when recursing
						multiple(srcs, callback, true);
					}
				}, targetWindow);
			}
			else {
				// Plain old loop
                checkIfComplete = function(){
					if (++loaded === length){
						callback.call(targetWindow);
					}
				};
				
				// Doesn't call callback until all scripts have loaded.
				for (var i = 0; i < length; ++i){
					single(srcs[i], checkIfComplete, targetWindow);
				}
			}			
		}

		// **

		var method = (typeof src === 'string') ? single : multiple;
        return method.apply(this, arguments);
    }
    /*
    * end getScript
    *
    **/

    // **

    function Sandie(){
        this.init.apply(this, arguments);
    }
    
    Sandie.prototype = {
        init: function(script, props, callback){
            var
                self = this,
                iframe = this.iframe = document.createElement('iframe'),
                body = hostBody(),
                outerCallback;

            if (!body){
                return false;
            }

            if (typeof script === 'string'){
                script = [script];
            }
            
            iframe.style.display = 'none';
            body.appendChild(iframe);
            this.clean();

            outerCallback = function(){
                var
                    window = self.window(),
                    ret = {},
                    i, len;
                
                if (callback){
                    if (props){
                        if (typeof props === 'string'){
                            ret = window[props];
                        }
                        if (isArray(props)){
                            len = props.length;
                            for (i=0; i<len; i++){
                                ret[props[i]] = window[props[i]];
                            }
                        }
                    }
                    self.remove();
                    callback(ret);
                }
            };

            
            if (isArray(script)){
                getScript(script, outerCallback, this.window());
            }
        },
    
        window: function(){
            return this.iframe.contentWindow;
        },
    
        document: function(){
            return this.window().document;
        },

        clean: function(){
            var doc = this.document();
            doc.open();
            doc.write(
                '<!doctype html>' + '\n' +
                '<html><head></head><body></body></html>'
            );
            doc.close();
            return this;
        },

        remove: function(){
            hostBody().removeChild(this.iframe);
        }
    };

    return function(script, props, callback){
        return new Sandie(script, props, callback);
    };
}());
