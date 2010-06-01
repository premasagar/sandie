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
        
    v0.1

*/

window.sandie = (function(){
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
            for (i = 0; i < length; ++i){
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
    
        init: function(scripts, request, callback, removeWhenDone){
            var
                self = this,
                iframe = this.iframe = document.createElement('iframe'),
                body = hostBody(),
                loaded = 0,
                targetWindow, length, finish, checkIfComplete, fnKey, i, script;

            if (!body){
                return false;
            }
            if (removeWhenDone !== false){
                removeWhenDone = true;
            }
            
            if (!isArray(scripts)){
                scripts = [scripts];
            }
            length = scripts.length;
            
            iframe.style.display = 'none';
            body.appendChild(iframe);
            this.write(); // create blank HTML document
            targetWindow = self.window();
            
            // Check if all scripts have loaded
            checkIfComplete = function(){
                if (++loaded === length){
                    finish();
                }
            };

            finish = function(){
                var
                    ret = {},
                    i, len;
                
                if (callback){
                    if (request){
                        if (typeof request === 'string'){
                            ret = targetWindow[request];
                        }
                        if (isArray(request)){
                            len = request.length;
                            for (i=0; i<len; i++){
                                ret[request[i]] = targetWindow[request[i]];
                            }
                        }
                    }
                    callback(ret);
                }
                if (removeWhenDone){
                    self.remove();
                }
            };
                
            // Doesn't call callback until after all scripts have loaded
            for (i = 0; i < length; ++i){
                script = scripts[i];
                if (typeof script === 'string'){
                    getScript(script, checkIfComplete, targetWindow);
                }
                // TODO: allow this to be executed after remote scripts via src urls are loaded
                else if (typeof script === 'function'){
                    script.call(this    );
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
