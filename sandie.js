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
            this.write(); // create blank HTML document

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
                    callback(ret);
                }
                self.remove();
            };
            
            if (isArray(script)){
                getScript(script, outerCallback, this.window());
            }
            return this;
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
