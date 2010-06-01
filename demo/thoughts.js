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
