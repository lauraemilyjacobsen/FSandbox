var fs = require('fs-extra')

var dependencies = [
    ['node_modules/oauth-signature/dist/oauth-signature.js','www/libs/oauth-signature.js'],
    ['node_modules/localforage/dist/localforage.js','www/libs/localforage.js']
];

dependencies.forEach(function(value) {
    fs.copy(value[0],value[1]);
});