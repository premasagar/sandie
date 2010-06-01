'use strict';

/*!
* Sandie
*   github.com/premasagar/sandie
*
*//*
    Load and isolate JavaScript variables, by injecting scripts into a temporary iframe element.

    by Premasagar Rose
        dharmafly.com

    license
        opensource.org/licenses/mit-license.php
        
    v0.2

*//*jslint browser: true, devel: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */

var sandie = (function(){
    var
        window = this,
        document = window.document;

    function isArray(obj){
        return toString.call(obj) === "[object Array]" || obj.constructor === Array || obj instanceof Array;
    }

    function hostBody(){
        return document.getElementsByTagName('body')[0];
    }
    
    // Get an lookup hash of own properties from an object
    function ownProps(obj){
        var
            lookup = {},
            prop;

        for (prop in obj){
            lookup[prop] = true;
        }
        return lookup;
    }

    // Get a hash of key-value pairs from obj1 that are not in obj2
    function propDiff(obj, lookup){
        var
            exports = {},
            prop;

        for (prop in obj){
            if (!lookup[prop]){
                exports[prop] = obj[prop];
            }
        }
        return exports;
    }

    // **

    /*
    *   getScript
    */
    function getScript(srcs, callback, targetWindow){    
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
         */

        // TODO: Allow arrays within arrays to be passed - at the moment, multiple is not in use
        function multiple(srcs, callback, targetWindow){
            var
                length = srcs.length,
                loaded = 0,
                checkIfComplete, i;
            
            // Check if all scripts have loaded
            checkIfComplete = function(){
                if (++loaded === length){
                    callback.call(targetWindow);
                }
            };
            
            // Doesn't call callback until after all scripts have loaded
            for (i = 0; i < length; i++){
                single(srcs[i], checkIfComplete, targetWindow);
            }
        }

        // **

        var method = (typeof srcs === 'string') ? single : multiple;
        targetWindow = targetWindow || window;
        callback = callback || function(){};
        
        return method.call(this, srcs, callback, targetWindow);
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
        settings: {
            blankDocText:
                '<!doctype html>' + '\n' +
                '<html><head></head><body></body></html>'
        },
    
        init: function(scripts, callback){ // if callback returns false, then don't remove when complete
            var
                self = this,
                iframe = this.iframe = document.createElement('iframe'),
                body = hostBody(),
                loaded = 0,
                targetWindow, length, checkIfComplete, fnKey, i, script, cacheProps;

            if (!body){
                return false;
            }
            
            if (!isArray(scripts)){
                scripts = [scripts];
            }
            length = scripts.length;
            
            iframe.style.display = 'none';
            body.appendChild(iframe);
            self.write(); // create blank HTML document
            targetWindow = self.window();
            cacheProps = ownProps(targetWindow);
            
            // Check if all scripts have loaded
            checkIfComplete = function(){
                var newVars;
                
                if (++loaded === length){                
                    newVars = propDiff(targetWindow, cacheProps);
                    if (callback.call(self, newVars) !== false){
                        self.remove();
                    }
                }
            };
                
            // Doesn't call callback until after all scripts have loaded
            for (i = 0; i < length; i++){
                script = scripts[i];
                if (typeof script === 'string'){
                    getScript(script, checkIfComplete, targetWindow);
                }
                else if (typeof script === 'function'){
                    script.call(self);
                    checkIfComplete();
                }
                else if (typeof script === 'object'){
                    for (fnKey in script){
                        if (script.hasOwnProperty(fnKey)){
                            self.window()[fnKey] = script[fnKey];
                        }
                    }
                    checkIfComplete();
                }
            }
        },
    
        window: function(){
            return this.iframe.contentWindow;
        },
    
        document: function(){
            return this.window().document;
        },

        write: function(docText){
            var doc = this.document();
            docText = typeof docText === 'string' ? docText : this.settings.blankDocText;
            
            doc.open();
            doc.write(docText);
            doc.close();
            return this;
        },

        remove: function(){
            hostBody().removeChild(this.iframe);
            return this;
        }
    };

    return function(script, props, callback){
        return new Sandie(script, props, callback);
    };
}());
