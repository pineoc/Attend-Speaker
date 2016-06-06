var express = require('express');
var router = express.Router();
var fs = require('fs');
var async = require('async');
//var path = require('path');
var dbController = require('./dbController');
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('mainPage', { title: 'mainPage' });
});

/* GET user list page */
router.get('/user-list', function(req, res){
    //get user list from DB
    dbController.selectAll('T_USER', function(result){
        if(result.resCode){

            var renderData = {
                title: 'user-listPage',
                dataMsg: 'success, get data',
                datas: result.data
            };
            console.log(renderData);
            res.render('user-list', renderData);
        } else {
            var renderData = {
                title: 'user-listPage',
                dataMsg: 'fail, noData',
                datas: []
            };
            res.render('user-list', renderData);
        }
    });
});

/* GET register user page */
router.get('/register-speaker', function(req, res, next) {
    res.render('record', {title: 'recordPage'});
});

/* GET show check attendance page */
router.get('/check-attendance', function(req, res, next) {
    res.render('check', {title: 'checkPage'});
});


router.get('/get-graph', function(req, res){
    var recvData = req.query;
    var filename = recvData.file;
    //filename="fm12345678/fm1.wav";
    res.render('d3graph', {filename: filename});
});

router.get('/register-for-test', function(req, res){
    res.render('record-for-test');
});

router.post('/register-test', function(req, res){
    var recvData = req.body;
    const SOUND_DATA_PATH = __dirname + "/../sound-data/";
    var praatConnector = require('./praatConnector');
    var mkdirp = require('mkdirp');
    async.waterfall([
            function(cb){
                //TODO 1: receive audio file check. not null, file is vaild
                //TODO 2: file save to tmp dir, get path
                var buff = new Buffer(recvData.blobData, 'base64');
                var saveFilePath = __dirname + "/../sound-data/tmp/" + recvData.personName.toString() + recvData.recNum.toString() + ".wav";
                fs.writeFile(saveFilePath, buff, function(err){
                    if(err){
                        console.log('w1 write file error: ', err);
                        cb('err', {resCode: -1, msg: recvData.recNum + "bad, write file error"});
                    } else {
                        console.log('w1 write file success');
                        var nextArg = {
                            resCode: 1,
                            msg: recvData.recNum + "good, w1 success",
                            filename: recvData.personName.toString() + recvData.recNum.toString() + ".wav",
                            saveFileDirPath : __dirname + "/../sound-data/tmp/"
                        };
                        cb(null, nextArg);
                    }
                });
            }, function(arg, cb){
                //check recNum, if num==1 (just save data)
                var user_path = SOUND_DATA_PATH + recvData.personName + recvData.idNum;
                mkdirp(user_path, function(err){
                    if(err){
                        console.log('1mkdirp error');
                        cb('err', {resCode: -1, msg: "1bad make directory error"});
                    } else {
                        console.log("1mkdirp success");
                        praatConnector.makeDatas(arg.saveFileDirPath, arg.filename, user_path, arg.filename, function(resBool){
                            if(resBool){
                                cb(null, {resCode: 1, msg: '1good'});
                            } else {
                                cb('err', {resCode: -1, msg: '1bad'});
                            }
                        });
                    }
                });
            }
        ],
        function(err, result){
            //final function
            if(err){
                console.log('err: ', err, 'result: ', result);
                res.json(result);
            } else {
                //console.log('registration success');
                res.json(result);
            }
        });
});

router.get('/make-test-data', function(req, res){
    res.render('index', {title:'index'});
});

module.exports = router;
