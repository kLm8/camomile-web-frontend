var express = require("express"),
    app = express(),
    program = require('commander'),
    fs = require('fs'),
    request = require('request'),
    async = require('async'),
    sprintf = require('sprintf').sprintf;

// remember cookie
var request = request.defaults({
    jar: true
});

// read parameters from command line or from environment variables 
// (CAMOMILE_API, CAMOMILE_LOGIN, CAMOMILE_PASSWORD, PYANNOTE_API)

// PBR patch : support parametrized shotIn and shotOut
program
    .option('--camomile <url>', 'URL of Camomile server (e.g. https://camomile.fr/api)')
    .option('--login <login>', 'Login for Camomile server (for queues creation)')
    .option('--password <password>', 'Password for Camomile server')
    .option('--pyannote <url>', 'URL of PyAnnote server (e.g. https://camomile.fr/tool)')
    .option('--port <int>', 'Local port to listen to (default: 8070)')
    .parse(process.argv);

var camomile_api = program.camomile || process.env.CAMOMILE_API;
var login = program.login || process.env.CAMOMILE_LOGIN;
var password = program.password || process.env.CAMOMILE_PASSWORD;
var pyannote_api = program.pyannote || process.env.PYANNOTE_API;
var port = parseInt(program.port || process.env.PORT || '8070', 10);
var shot_in = program.shotIn;
var shot_out = program.shotOut;
var head_in = program.headIn;
var head_out = program.headOut;
var evidence_in = program.evidenceIn;
var evidence_out = program.evidenceOut;
var label_in = program.labelIn;
var label_out = program.labelOut;

// configure express app
app.configure(function () {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/app'));
    app.use(app.router);
});

// handle the hidden form submit
app.post('/', function (req, res) {
    console.log("là");
    res.redirect('/');
});

app.get('/lig', function (req, res) {
    res.sendfile(__dirname + '/app/indexLIG.html');
});

app.get('/limsi', function (req, res) {
    res.sendfile(__dirname + '/app/indexLimsi.html');
});

// log in Camomile API and callback
function log_in(callback) {

    var options = {
        url: camomile_api + '/login',
        method: 'POST',
        body: {
            'username': login,
            'password': password
        },
        json: true
    };

    request(
        options,
        function (error, response, body) {
            // TODO: error handling
            callback(null);
        });
};

// log out from Camomile API and callback
function log_out(callback) {

    var options = {
        url: camomile_api + '/logout',
        method: 'POST'
    };

    request(
        options,
        function (error, response, body) {
            // TODO: error handling
            callback(null);
        });
};

function getQueueByName(name, callback) {

    var options = {
        url: camomile_api + '/queue',
        method: 'GET',
        qs: {
            name: name
        },
        json: true,
    };

    request(
        options,
        function (error, response, body) {
            if (body.length === 0) {
                queue = undefined;
            } else {
                queue = body[0]._id;
            };
            callback(error, queue);
        });
};

function getAllQueues(callback) {

    async.parallel({

            // Active learning "Shot" use case
            shotIn: function (callback) {
                getQueueByName('activelearning.shot.in', callback);
            },
            shotOut: function (callback) {
                getQueueByName('activelearning.shot.out', callback);
            },
            // Active learning "Head" use case
            headIn: function (callback) {
                getQueueByName('activelearning.head.in', callback);
            },
            headOut: function (callback) {
                getQueueByName('activelearning.head.out', callback);
            },
            // MediaEval "Evidence" use case
            evidenceIn: function (callback) {
                getQueueByName('mediaeval.evidence.in', callback);
            },
            evidenceOut: function (callback) {
                getQueueByName('mediaeval.evidence.out', callback);
            },
            // MediaEval "Label" use case
            labelIn: function (callback) {
                getQueueByName('mediaeval.label.in', callback);
            },
            labelOut: function (callback) {
                getQueueByName('mediaeval.label.out', callback);
            },
        },
        function (err, queues) {
            callback(err, queues);
        });
};

// create NodeJS route "GET /config" returning front-end configuration as JSON
// and callback (passing no results whatsoever)
function create_config_route(queues, callback) {

    // ~~~~ Sample /config response ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // {
    //     'camomile_api': 'http://camomile.fr/api',
    //     'pyannote_api': 'http://pyannote.lu',
    //     'queues': {
    //         'shotIn': '54476ba692e66a08009cc355',
    //         'shotOut': '54476ba692e66a08009cc356',
    //         'headIn': '54476ba692e66a08009cc357',
    //         'headOut': '54476ba692e66a08009cc358',
    // }
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var get_config = function (req, res) {
        res.json({
            'camomile_api': camomile_api,
            'pyannote_api': pyannote_api,
            'queues': {
                'shotIn': queues.shotIn,
                'shotOut': queues.shotOut,
                'headIn': queues.headIn,
                'headOut': queues.headOut,
                'evidenceIn': queues.evidenceIn,
                'evidenceOut': queues.evidenceOut,
                'labelIn': queues.labelIn,
                'labelOut': queues.labelOut
            }
        });
    };

    app.get('/config', get_config);

    console.log('   * shotIn  --> /queue/' + queues.shotIn);
    console.log('   * shotOut --> /queue/' + queues.shotOut);
    console.log('   * headIn  --> /queue/' + queues.headIn);
    console.log('   * headOut --> /queue/' + queues.headOut);
    console.log('   * evidenceIn  --> /queue/' + queues.evidenceIn);
    console.log('   * evidenceOut --> /queue/' + queues.evidenceOut);
    console.log('   * labelIn  --> /queue/' + queues.labelIn);
    console.log('   * labelOut --> /queue/' + queues.labelOut);

    callback(null);

}

// create AngularJS module 'Config' in /app/config.js ('DataRoot' + 'ToolRoot')
// and callback (passing no results whatsoever)
// WARNING: this should be deprecated in favor of route "GET /config"
function create_config_file(callback) {

    // ~~~~ Sample /app/config.js ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     angular.module('myApp.config', [])
    //         .value('DataRoot', 'http://camomile.fr/api')
    //         .value('ToolRoot', 'http://pyannote.lu');
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    config_js = sprintf(
        "angular.module('myApp.config', [])" + "\n" +
        "   .value('DataRoot', '%s')" + "\n" +
        "   .value('ToolRoot', '%s');",
        camomile_api, pyannote_api
    );

    fs.writeFile(
        __dirname + '/app/config.js', config_js,
        function (err) {
            if (err) {
                console.log(err);
            } else {
                callback(null);
            }
        }
    );
};

// run app when everything is set up
function run_app(err, results) {
    // TODO: error handling
    app.listen(port);
    console.log('App is running at http://localhost:' + port + ' with');
    console.log('   * Camomile API --> ' + camomile_api);
    console.log('   * PyAnnote API --> ' + pyannote_api);
};

// this is where all these functions are actually called, in this order:
// log in, create queues, create route /config, log out, create /app/config.js
// and (then only) run the app
async.waterfall(
    [log_in, getAllQueues, create_config_route, log_out, create_config_file],
    run_app
);