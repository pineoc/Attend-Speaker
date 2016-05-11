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

/*
router.get('/exec-test', function(req, res, next){
    var child_proc = require('child_process');
    var comp_dir = path.join(__dirname, '../data-compare-sol');
    var cmd_file = path.join(__dirname, '../data-compare-sol') + "/data-compare-sol.exe";
    cmd_file = cmd_file.replace(/\\/g, '/');
    console.log('cmd_file: ', cmd_file);
    var exec_callback = function(err, stdout, stderr){
        if(err){
            console.log('error occurred, ', err);
            res.json({
                msg:'exec result',
                err: err
            });
        } else {
            res.json({
                msg: 'exec result',
                stdout: stdout,
                stderr: stderr
            });
        }
    };
    var options = {
        encoding: 'utf8',
        timeout: 0,
        killSignal: 'SIGTERM',
        cwd: comp_dir,
        env: process.env
    };
    child_proc.exec(cmd_file, options, exec_callback);
});
*/

/*
* get data parsing
* @params: fileDir, fileName
* */
router.get('/get-data', function(req, res){
    var recvData = req.query;
    console.log(recvData, recvData.name, recvData.dir);

    async.waterfall([
            function(cb){
                //pitch data
                var filePath = __dirname + "/../sound-data/" + recvData.dir + "/" + recvData.name + "-p.out";
                fs.readFile(filePath, function(err, result){
                    if(err){
                        console.log('w1 file read err, ', err);
                        cb('err', err);
                    }
                    else{
                        var array = [];
                        var dataArr = [];
                        array = result.toString().split("\r\n");
                        for(var i=0; i< array.length; i++){
                            array[i].toString().replace("\r\n", "");
                            var dataDouble = array[i].toString().split("\t");
                            if(dataDouble[1] === "--undefined--")
                                dataDouble[1] = "0.0";
                            dataArr.push(dataDouble[1]);
                        }
                        cb(null, dataArr);
                    }
                });
            }, function(arg, cb){
                //int data
                var filePath = __dirname + "/../sound-data/" + recvData.dir + "/" + recvData.name + "-i.out";
                fs.readFile(filePath, function(err, result){
                    if(err){
                        console.log('w2 file read err, ', err);
                        cb('err', err);
                    }
                    else{
                        var array = [];
                        var dataArr = [];
                        array = result.toString().split("\r\n");
                        for(var i=0; i< array.length; i++){
                            array[i].toString().replace("\r\n", "");
                            var dataDouble = array[i].toString().split("\t");
                            dataArr.push(dataDouble[1]);
                        }
                        var sendData = {
                            pitchData: arg,
                            intensityData: dataArr
                        };
                        cb(null, sendData);
                    }
                });
            }, function(arg, cb){
                //formant data
                var filePath = __dirname + "/../sound-data/" + recvData.dir + "/" + recvData.name + "-f.out";
                fs.readFile(filePath, function(err, result){
                    if(err){
                        console.log('w3 file read err, ', err);
                        cb('err', err);
                    }
                    else{
                        var array = [];
                        var dataArr_f2 = [];
                        var dataArr_f3 = [];
                        array = result.toString().split("\r\n");
                        for(var i=0; i< array.length; i++){
                            array[i].toString().replace("\r\n", "");
                            var dataDouble = array[i].toString().split("\t");
                            dataArr_f2.push(dataDouble[1]);
                            dataArr_f3.push(dataDouble[2]);
                        }
                        var sendData = {
                            pitchData: arg.pitchData,
                            intensityData: arg.intensityData,
                            f2Data: dataArr_f2,
                            f3Data: dataArr_f3
                        };
                        cb(null, sendData);
                    }
                });
            }
        ],
        function(err, result){
            if(err){
                console.log('err: ', err);
                res.json({err: err});
            } else {
                res.json(result);
            }
    });

});

module.exports = router;
