'use strict';

var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan'); // formerly express.logger
var fs = require('fs');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorhandler = require('errorhandler');
var app = express();
var mockApi = require('td-core-mock-api');
var querystring = require('querystring');
var url = require('url');


var configOptions = require('./configServer.js');


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var landingPageRouter = require('./routes/landingPageRouter.js');
var apiRouter = require('./routes/apiRouter.js');
var loader = require('./common/fileLoader.js');




// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);

// express/connect middleware
app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());

// serve up static assets
app.use(express.static(path.join(__dirname, 'public'),{'index':false}));

//app.use(express.static(path.join(__dirname, 'public')));

/*
 * Remove the following comment if you'd like to override data provided by the mock api.  The example in the comment
 * will read mock data from the directory "mock-data" relative to *this* file.  You can pass in as many paths as you
 * need by separating them with commas.
 */
app.use(mockApi(path.join(__dirname, 'mock-data')));

// development only
if ('development' === app.get('env')) {
  app.use(errorhandler());
}




// create a write stream (in append mode)
//var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'});

// setup the logger
//app.use(morgan('combined', {stream: accessLogStream}));




app.get('/formFieldsPropertyFile', function(req, res){

    var pdfFormFieldsConfig = loader.load(configOptions.SHARED_CONFIG +'formFields.json', {'parse': true});
    res.json(pdfFormFieldsConfig);
});

app.get('/formsPropertyFile', function(req, res){

    var pdfFormsConfig =  loader.load(configOptions.SHARED_CONFIG +'forms.json', {'parse': true});
    res.json(pdfFormsConfig);
});

app.get('/binRangePropertyFile', function(req, res){

    var binRange = loader.load(configOptions.SHARED_CONFIG +'binRange.json', {'parse': true});
    res.json(binRange);
});

app.get('/apiUrlsPropertyFile', function(req, res){

    var apiUrls = loader.load(configOptions.SHARED_CONFIG +'apiUrls.json', {'parse': true});
    res.json(apiUrls);
});

app.use(landingPageRouter);
app.use(apiRouter);


/*
 * code for getting response times from log file
 */
var thinServerUrl = loader.load(configOptions.SHARED_CONFIG +'apiUrls.json', {'parse': true}).apiUrls.THIN_SERVER_URL;

app.get('/logtimes', function(req, res) {    
    var path;
    if(req.query.calls) {
        path = '/getLogTimes?calls=' + req.query.calls; 
    }
    else {
        path = '/getLogTimes';
    }   

    var request = https.get(thinServerUrl+path, function(response) {
        var data = '';
        response.on('data', function(chunk) {
            data += chunk;
        });

        response.on('end', function() {
            res.send(data);
        }); 
    });

    request.on('error', function(err) {
        console.log(err);
        res.sendStatus(500);
    });

});






/*http.createServer(app).listen(app.get('port'), function () {
    if(typeof(console) != "undefined"){
        console.log('com.td.creditcards.bchHierarchyExp server listening on port ' + app.get('port'));
    }
});*/

var https = require('https');
var fs = require('fs');
var options = {
    key:loader.load(configOptions.SHARED_CONFIG+'cert/privateKey.pem', {'buffer': true}),
    passphrase: loader.load(configOptions.SHARED_CONFIG+'passphraseConfig.json', {'parse': true}).passphrase,
    cert: loader.load(configOptions.SHARED_CONFIG+'cert/publicCert.pem', {'buffer': true}),

};
// Create an HTTPS service identical to the HTTP service.
https.createServer(options, app).listen(app.get('port'), function () {
    console.log('com.td.creditcards.bchHierarchyExp server listening on port ' + app.get('port'));
});
