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

*/

var sandie = (function(){

/*
* getScript
*   github.com/premasagar/mishmash/tree/master/getscript/
*
*/
function getScript(srcs, callback, options){
    /**
     * Load a script into a <script> element
     * @param {String} src The source url for the script to load
     * @param {Function} callback Called when the script has loaded
     */
    function single(src, callback, options){
        var
            charset = options.charset,
            keep = options.keep,
            target = options.target,
            document = target.document,
            head = document.getElementsByTagName('head')[0],
            script = document.createElement('script'),
            loaded;
        
        script.type = 'text/javascript'; // Needed for some gitchy browsers, outside of HTML5
        script.charset = charset;
        script.onload = script.onreadystatechange = function(){
            var state = this.readyState;
            if (!loaded && (!state || state === 'complete' || state === 'loaded')){
                // Handle memory leak in IE
                script.onload = script.onreadystatechange = null;
                
                // Remove script element once loaded
                if (!keep){
                    head.removeChild(script); 
                }
                
                loaded = true;
                callback.call(target);
            }
        };
        // Async loading (extra hinting for compliant browsers)
        script.async = true;
        
        // Apply the src
        script.src = src;
        
        // And go...
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

    function multiple(srcs, callback, options){
        var
            length = srcs.length,
            loaded = 0,
            checkIfComplete, i;
        
        // Check if all scripts have loaded
        checkIfComplete = function(){
            if (++loaded === length){
                callback.call(options.target);
            }
        };
        
        // Doesn't call callback until after all scripts have loaded
        for (i = 0; i < length; i++){
            single(srcs[i], checkIfComplete, options);
        }
    }

    // **
    
    var
        method = (typeof srcs === 'string') ? single : multiple;
    
    options = options || {};
    if (!options.charset){
        options.charset = 'utf-8';
    }
    if (!options.target){
        options.target = window;
    }
    
    callback = callback || function(){};        
    return method.call(this, srcs, callback, options);
}


    // **

    var
        window = this,
        document = window.document;

    function isArray(obj){
        return Object.prototype.toString.call(obj) === "[object Array]" || obj.constructor === Array || obj instanceof Array;
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
            // deliberately not using hasOwnProperty, as this is not implemented against the window object in some older browsers
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

    function Sandie(){
        this.init.apply(this, arguments);
    }
    
    Sandie.prototype = {
        settings: {
            blankDocText:
                '<!doctype html>' + '\n' +
                '<html><head></head><body></body></html>'
        },
        
        // whether iframe should auto-remove after first run
        persist: false,
    
        init: function(scripts, callback, persist){
            var
                self = this,
                iframe = this.iframe = document.createElement('iframe'),
                body = hostBody();

            if (!body){
                throw 'Sandie: no host DOM';
            }
            //iframe.src = 'about:blank';
            iframe.style.display = 'none';
            body.appendChild(iframe);
            
            self.write() // create blank HTML document
                .load(scripts, callback, persist);
        },
        
        load: function(scripts, callback, persist){
            var self = this,
                target = self.window(),
                cacheProps = ownProps(target),
                loaded = 0,
                length, checkIfComplete, fnKey, i, script;
            
            if (!scripts){
                return self;
            }
            if (!target){
                throw 'Sandie: already closed';
            }
            if (typeof persist === 'boolean'){
                self.persist = persist;
            }
            if (!isArray(scripts)){
                scripts = [scripts];
            }
            length = scripts.length;
            callback = callback || function(){};

            // Check if all scripts have loaded
            checkIfComplete = function(){
                var newVars;
                
                if (++loaded === length){                
                    newVars = propDiff(target, cacheProps);
                    callback.call(self, newVars);
                    if (!self.persist){
                        self.close();
                    }
                }
            };
                
            // Doesn't call callback until after all scripts have loaded
            for (i = 0; i < length; i++){
                script = scripts[i];
                if (typeof script === 'string'){
                    getScript(script, checkIfComplete, {target: target});
                }
                else if (typeof script === 'function'){
                    script.call(target);
                    checkIfComplete();
                }
                else if (typeof script === 'object'){
                    for (fnKey in script){
                        if (script.hasOwnProperty(fnKey)){
                            target[fnKey] = script[fnKey];
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
            var self = this,
                doc = self.document();
            
            docText = typeof docText === 'string' ?
                docText :
                this.settings.blankDocText;
            
            doc.open();
            doc.write(docText);
            doc.close();
            return self;
        },

        close: function(){
            var self = this;
            hostBody().removeChild(self.iframe);
            return self;
        }
    };

    return function(script, props, callback){
        return new Sandie(script, props, callback);
    };
}());

/*jslint browser: true, devel: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */
