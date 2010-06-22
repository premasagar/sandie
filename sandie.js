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

// DEPENDENCIES

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
    
    var window = this,
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
/* end getScript */
// end DEPENDENCIES


    // **

    var
        window = this,
        document = window.document;

    // Check if an object is an array
    function isArray(obj){
        return Object.prototype.toString.call(obj) === "[object Array]" || obj.constructor === Array || obj instanceof Array;
    }

    // Get the body element of the host document
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
    function varDiff(obj, lookup){
        var
            vars = {},
            prop;

        for (prop in obj){
            if (!lookup[prop]){
                vars[prop] = obj[prop];
            }
        }
        return vars;
    }

    // **

    function Sandie(){
        this.init.apply(this, arguments);
    }
    
    Sandie.prototype = {
        // whether iframe should auto-remove after first run
        persist: false,

        // initialise the sandbox
        init: function(scripts, callback, persist){
            var
                self = this,
                iframe = this.iframe = document.createElement('iframe'),
                body = hostBody();

            if (!body){
                throw 'Sandie: no host DOM';
            }
            iframe.style.display = 'none';
            body.appendChild(iframe);
            
            return self.flush()
                .load(scripts, callback, persist);
        },
        
        // Determine the properties of the iframe window
        props: function(){
            return ownProps(this.window());
        },
        
        // Determine which vars are new since the iframe was last created or flushed
        vars: function(){
            var self = this;
            return varDiff(self.window(), self._initProps);
        },
        
        // Load scripts, execute functions & attach objects to the sandboxed window; callback any new vars on completion
        load: function(scripts, callback, persist){
            var self = this,
                target = self.window(),
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
                if (++loaded === length){
                    callback.call(self, self.vars());
                    if (!self.persist){
                        self.close();
                    }
                }
            };
                
            // Doesn't call callback until after all scripts have loaded
            for (i = 0; i < length; i++){
                script = scripts[i];
                if (typeof script === 'string'){
                    // eval: experimental; this will be made more sophisticated in future
                    if (script.indexOf('<script>') === 0){
                        self.write({head:script});
                        checkIfComplete();
                    }
                    // load external scripts
                    else {
                        getScript(script, checkIfComplete, {target: target});
                    }
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
            return self;
        },
    
        // return the iframe's window
        window: function(){
            return this.iframe.contentWindow;
        },
    
        // return the iframe's document
        document: function(){
            return this.window().document;
        },
        
        // return the iframe's <head> element
        head: function(){
            return this.document().getElementsByTagName('head')[0];
        },
        
        // return the iframe's <body> element
        body: function(){
            return this.document().body;
        },
        
        html: function(options){
            options = options || {};
            return (options.doctype || '<!doctype html>') +
                '<html>' +
                    '<head>' + (options.head || '') + '</head>' +
                    '<body>' + (options.body || '') + '</body>' +
                '</html>';
        },

        // write out a new document
        // optional argument {doctype:'<!doctype html>', head:'<script>var foo = "bar";</script>', body:'<div></div>'}
        // TODO: Add an optional argument for an onload callback, for when an external script is added to the head
        write: function(htmlOptions){
            var self = this,
                doc = self.document();
            
            doc.open();
            doc.write(self.html(htmlOptions));
            doc.close();
            return self;
        },
        
        // Keep the iframe element intact, but refresh its window & document
        flush: function(htmlOptions){
            var self = this;
            self.write(htmlOptions); // create blank HTML document
            self._initProps = self.props();
            return self;
        },

        // remove the iframe element from the host page
        close: function(){
            var self = this;
            hostBody().removeChild(self.iframe);
            return self;
        }
    };

    // wrapper function for creating a new sandbox
    return function(script, props, callback){
        return new Sandie(script, props, callback);
    };
}());

/*jslint browser: true, devel: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */
