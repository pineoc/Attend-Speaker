var express = require('express');
var router = express.Router();
var fs = require('fs');
var async = require('async');
var mkdirp = require('mkdirp');

var praatConnector = require('./praatConnector');
var dbController = require('./dbController');

const SOUND_DATA_PATH = __dirname + "/../sound-data/";

/* GET users listing.
 * get list of user
 * use table, select data from DB
 * */
router.get('/list', function(req, res, next) {
    res.send('check attendance list');
});

/*
 * receive audio data from page
 *
 *
 * */
router.post('/send-attend', function(req, res, next) {
    var recvData = req.body;
    //TODO 1: receive audio file check. not null, file is vaild
    //TODO 2: file save to tmp dir, get path
    //TODO 3: compare data with database datas
    //TODO 4: return name who check attendance
    res.json(recvData);
});


/*
 * receive audio data register person
 * @param : recNum, dataURL, blobData, personName, idNum
 * @result : isValid(Boolean)
 * */
router.post('/register', function(req, res, next){
    var recvData = req.body;
    //console.log(recvData);
    if(typeof recvData.recNum === 'undefined' || recvData.recNum === null){
        res.json({resCode:-1, msg: "no recNum"});
        return;
    }
    if(typeof recvData.personName === 'undefined' || recvData.personName === null){
        res.json({resCode:-1, msg: "no personName"});
        return;
    }
    if(typeof recvData.blobData === 'undefined' || recvData.blobData === null){
        res.json({resCode:-1, msg: "no audioData"});
        return;
    }
    if(typeof recvData.idNum === 'undefined' || recvData.idNum === null){
        res.json({resCode:-1, msg: "no idNum"});
        return;
    }

    async.waterfall([
            function(cb){
                //check if same name
                dbController.selectOne('T_USER', 'user_name=? AND user_idnum=?', [recvData.personName,  recvData.idNum], function(result){
                    if(result.resCode){
                        console.log("w0 check success");
                        cb(null, {resCode: 1, msg: recvData.recNum + "good, w0 success"});
                    } else {
                        cb("err", {resCode: -1, msg: recvData.recNum + "bad, already exist"});
                    }
                });
            },
            function(arg, cb){
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
                //TODO 3: check recNum, if num==1 (just save data)
                //          if num==2 (compare with first data, return result)
                //          if num==3 (compare with second data, return result, insert to db or not)
                console.log("w2 start, arg: ", arg, recvData.recNum);
                var recNum = parseInt(recvData.recNum);
                if(recNum === 1) {
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
                } else if(recNum === 2) {
                    var user_path = SOUND_DATA_PATH + recvData.personName + recvData.idNum;
                    mkdirp(user_path, function(err){
                        if(err){
                            console.log('1mkdirp error');
                            cb('err', {resCode: -1, msg: "2bad directory error"});
                        } else {
                            console.log("2mkdirp success");
                            praatConnector.makeDatas(arg.saveFileDirPath, arg.filename, user_path, arg.filename, function(resBool){
                                if(resBool){
                                    //TODO : compare with first datas, if valid data-> next step
                                    //      not valid, cb('err', {resCode: -1, msg: '2bad'});
                                    var filename1 = arg.filename;
                                    var filename2 = recvData.personName.toString() + (recvData.recNum - 1).toString() + ".wav";
                                    praatConnector.compareDatas(user_path + "/", filename1, filename2, function(result){
                                        if(result.resCode === 1){
                                            if(result.isValid) {
                                                cb(null, {resCode: 1, msg: '2good'});
                                            } else {
                                                console.log('data2 isValid : false, values: ', result.pitch_rate, result.int_rate);
                                                cb('err', {resCode: -1, msg: '2bad'});
                                            }
                                        } else {
                                            console.log('data2 compareDatas() error!');
                                            cb('err', {resCode: -1, msg: '2bad'});
                                        }
                                    });
                                    //cb(null, {resCode: 1, msg: '2good'});
                                } else {
                                    cb('err', {resCode: -1, msg: '2bad'});
                                }
                            });
                        }
                    });
                } else if(recNum === 3) {
                    var user_path = SOUND_DATA_PATH + recvData.personName + recvData.idNum;
                    mkdirp(user_path, function(err){
                        if(err){
                            console.log('3mkdirp error');
                            cb('err', {resCode: -1, msg: "3bad directory error"});
                        } else {
                            console.log("3mkdirp success");
                            praatConnector.makeDatas(arg.saveFileDirPath, arg.filename, user_path, arg.filename, function(resBool){
                                if(resBool){
                                    //TODO : compare with first datas, if valid data-> next step
                                    //      not valid, cb('err', {resCode: -1, msg: '3bad'});
                                    var filename1 = arg.filename;
                                    var filename2 = recvData.personName.toString() + (recvData.recNum - 1).toString() + ".wav";
                                    praatConnector.compareDatas(user_path + "/", filename1, filename2, function(result){
                                        if(result.resCode === 1){
                                            if(result.isValid) {
                                                cb(null, {resCode: 1, msg: '3good'});
                                            } else {
                                                console.log('data3 isValid : false, values: ', result.pitch_rate, result.int_rate);
                                                cb('err', {resCode: -1, msg: '3bad'});
                                            }
                                        } else {
                                            console.log('data3 compareDatas() error!');
                                            cb('err', {resCode: -1, msg: '3bad'});
                                        }
                                    });
                                } else {
                                    cb('err', {resCode: -1, msg: '3bad'});
                                }
                            });
                        }
                    });
                }
            }, function(arg, cb){
                //if last phase, insert data to DB
                if(arg.msg === '3good'){
                    //user path data
                    var user_path = SOUND_DATA_PATH + recvData.personName + recvData.idNum + "/";
                    //insert user
                    dbController.insertOneUser([user_path, recvData.personName, recvData.idNum],function(result){
                        if(result.resCode){
                            cb(null, {resCode: 1, msg: "user insert success"});
                        } else {
                            //error on db insert
                            console.log("user insert error msg: ", result.msg);
                            cb('err', {resCode: -1, msg: "user insert fail"});
                        }
                    });
                } else {
                    cb(null, {resCode: 1, msg: recvData.recNum + 'good'});
                }
            }
        ],
        function(err, result){
            //final function
            if(err){
                console.log('err: ', err, 'result: ', result);
                res.json(result);
            } else {
                console.log('registration success');
                res.json(result);
            }
        });
});

module.exports = router;
