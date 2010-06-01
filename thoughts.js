/*

sandie('foo.js', function(sandie){ // callback on window load
    var jQuery = sandie.exports.jQuery;
    this // sandie
        .doSomething();
});

var s = sandie();
s
    .script('foo.js') // == getScript
    .script(fn, callback)
    .ready(callback) // === window.load()
    .window.load(callback) // window loaded
    .document.ready(callback) // document ready
    .window[0].jQuery = jQuery // add directly to iframe window
    .close();

sandie('foo.js', callback, {autoclose:true});

*/

//

function ownProperties(obj1, obj2){
    var
        exports = {},
        prop;

    for (prop in obj1){
        if (
            obj1.hasOwnProperty(prop) &&
            (!obj2 || obj2 && !obj2.hasOwnProperty(prop))
        ){
            try{
                exports[prop] = obj1[prop];
            }
            catch(e){}
        }
    }
    return exports;
}

var exports = ownProperties(sandieAfter, cachedSandieBefore);
