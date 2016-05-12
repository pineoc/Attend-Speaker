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
    var filename = recvData.dirname + "/" + recvData.filename;
    //filename="fm12345678/fm1.wav";
    res.render('d3graph', {filename: filename});
});

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
                        var secondData = [];
                        var dataArr_f2 = [];
                        var dataArr_f3 = [];
                        array = result.toString().split("\r\n");
                        for(var i=0; i< array.length; i++){
                            array[i].toString().replace("\r\n", "");
                            var dataDouble = array[i].toString().split("\t");
                            secondData.push(dataDouble[0]);
                            dataArr_f2.push(dataDouble[1]);
                            dataArr_f3.push(dataDouble[2]);
                        }
                        var sendData = {
                            secondData: secondData,
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
