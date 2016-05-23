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
    if(typeof recvData.blobData === 'undefined' || recvData.blobData === null) {
        res.json({resCode: -1, msg: "no audioData"});
        return;
    }

    async.waterfall([
        function(cb){
            //TODO 2: file save to tmp dir, get path
            var buff = new Buffer(recvData.blobData, 'base64');
            var dateVal = new Date().getTime();
            var saveFilePath = __dirname + "/../sound-data/tmp/" + dateVal + ".wav";

            fs.writeFile(saveFilePath, buff, function(err){
                if(err){
                    console.log('attend, w1 write file error: ', err);
                    cb('err', {resCode: -1, msg: "attend bad, write file error"});
                } else {
                    console.log('attend, w1 write file success');
                    var filename = dateVal + ".wav";
                    var saveFileDirPath = __dirname + "/../sound-data/tmp";
                    var outFileDirPath = __dirname + "/../sound-data/tmp/data";
                    praatConnector.makeDatas(saveFileDirPath + "/", filename, outFileDirPath, filename, function(resBool){
                        if(resBool){
                            var nextArg = {
                                filename: filename,
                                outFileDirPath : outFileDirPath
                            };
                            cb(null, nextArg);
                        } else {
                            console.log('attend, make datas fail');
                            cb('err', {resCode: -1, msg: 'make data fail'});
                        }
                    });
                }
            });
        }, function(arg, cb) {
            //TODO 3: compare data with database datas
            dbController.selectAll('T_USER', function(result){
                if(result.resCode){
                    var dataArr = result.data;
                    var corrArr = [];
                    var dataCnt = dataArr.length;
                    var isErr = false;
                    dataArr.forEach(function(elem){
                        var data1 = elem.user_dir + elem.user_name + "1.wav";
                        var data2 = arg.outFileDirPath + "/" + arg.filename;
                        //console.log("data1: ", data1, "data2: ", data2);
                        praatConnector.compareDatas_attend(data1, data2, "block_cosine", function(result){
                            if(result.resCode === 1){
                                //console.log("pitch_rate", elem.pitch_rate, "int_rate", elem.int_rate);
                                var corrObj = {
                                    user_idx: elem.user_idx,
                                    user_name: elem.user_name,
                                    pitch_rate: result.pitch_rate,
                                    int_rate: result.int_rate,
                                    comp_val: result.pitch_rate * 0.6 + result.int_rate * 0.4,
                                    f2_rate: result.f2_rate,
                                    f3_rate: result.f3_rate,
                                    data_file: data1
                                };
                                corrArr.push(corrObj);
                                dataCnt--;

                                if(dataCnt === 0){
                                    //end foreach
                                    if(!isErr)
                                        cb(null, {data: corrArr, newFile: data2});
                                    else
                                        cb('err', {resCode: -1, msg: 'compare_attend err'});
                                }
                            } else {
                                console.log('compareDatas_attend() error!');
                                isErr = true;
                                //return cb('err', {resCode: -1, msg: 'compare_attend err'});
                            }
                        });
                    });
                } else {
                    //select error
                    cb('err', {resCode: -1, msg: 'SelectAll err'});
                }
            });
        } , function(arg, cb) {
            //sort corrArr
            var dataArr = arg.data;
            //sort by comp_val
            dataArr.sort(function(a, b){
                return b.comp_val - a.comp_val;
            });

            console.log('dataArr: ', dataArr);
            console.log('attend person: ', dataArr[0]);

            var newFile_name = arg.newFile;
            newFile_name = newFile_name.substring(__dirname.length + 14);
            dataArr[0].data_file = dataArr[0].data_file.substring(__dirname.length + 14);
            //if comp_val is 90 point, success
            if(dataArr[0].comp_val > 80.0)
                cb(null, {resCode: 1, checkResult: dataArr[0], checkDataArr: dataArr, newFile: newFile_name});
            else {
                //send check result data for debug
                cb('err', {
                    resCode: -1,
                    checkResult: dataArr[0],
                    checkDataArr: dataArr,
                    newFile: newFile_name,
                    msg: 'not matched'});
            }
        }
    ],function(err, result){
        if(err){
            res.json(result);
        } else {
            //TODO 4: return name who check attendance
            res.json(result);
        }
    });
});


/*
 * receive audio data register person
 * @param : recNum, dataURL, blobData, personName, idNum
 * @result : isValid(Boolean)
 * */
router.post('/register', function(req, res, next){
    var recvData = req.body;
    //console.log(recvData);

    //check params
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
                dbController.checkExist('T_USER', 'user_idnum=?', [recvData.idNum], function(result){
                    if(result.resCode){
                        console.log("w0 check success");
                        cb(null, {resCode: 1, msg: recvData.recNum + "good, w0 success"});
                    } else {
                        cb("err", {resCode: -1, msg: "0bad, already exist"});
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
                            //console.log('1mkdirp error');
                            cb('err', {resCode: -1, msg: "2bad directory error"});
                        } else {
                            //console.log("2mkdirp success");
                            praatConnector.makeDatas(arg.saveFileDirPath, arg.filename, user_path, arg.filename, function(resBool){
                                if(resBool){
                                    //TODO : compare with first datas, if valid data-> next step
                                    //      not valid, cb('err', {resCode: -1, msg: '2bad'});
                                    var filename1 = arg.filename;
                                    var filename2 = recvData.personName.toString() + (recvData.recNum - 1).toString() + ".wav";
                                    praatConnector.compareDatas(user_path + "/", filename1, filename2, "dev", function(result){
                                        if(result.resCode === 1){
                                            if(result.isValid) {
                                                cb(null, {
                                                    resCode: 1,
                                                    msg: '2good',
                                                    pitch_rate: result.pitch_rate,
                                                    int_rate: result.int_rate,
                                                    f2_rate: result.f2_rate,
                                                    f3_rate: result.f3_rate
                                                });
                                            } else {
                                                console.log('data2 isValid : false, values: ', result.pitch_rate, result.int_rate);
                                                cb('err', {
                                                    resCode: -1,
                                                    msg: '2bad',
                                                    pitch_rate: result.pitch_rate,
                                                    int_rate: result.int_rate,
                                                    f2_rate: result.f2_rate,
                                                    f3_rate: result.f3_rate
                                                });
                                            }
                                        } else {
                                            console.log('data2 compareDatas() error!');
                                            cb('err', {resCode: -1, msg: '2bad, system'});
                                        }
                                    });
                                } else {
                                    cb('err', {resCode: -1, msg: '2bad, system'});
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
                            //console.log("3mkdirp success");
                            praatConnector.makeDatas(arg.saveFileDirPath, arg.filename, user_path, arg.filename, function(resBool){
                                if(resBool){
                                    //TODO : compare with first datas, if valid data-> next step
                                    //      not valid, cb('err', {resCode: -1, msg: '3bad'});
                                    var filename1 = arg.filename;
                                    var filename2 = recvData.personName.toString() + (recvData.recNum - 1).toString() + ".wav";
                                    praatConnector.compareDatas(user_path + "/", filename1, filename2, "dev", function(result){
                                        if(result.resCode === 1){
                                            if(result.isValid) {
                                                cb(null, {
                                                    resCode: 1,
                                                    msg: '3good',
                                                    pitch_rate: result.pitch_rate,
                                                    int_rate: result.int_rate,
                                                    f2_rate: result.f2_rate,
                                                    f3_rate: result.f3_rate
                                                });
                                            } else {
                                                console.log('data3 isValid : false, values: ', result.pitch_rate, result.int_rate);
                                                cb('err', {
                                                    resCode: -1,
                                                    msg: '3bad',
                                                    pitch_rate: result.pitch_rate,
                                                    int_rate: result.int_rate,
                                                    f2_rate: result.f2_rate,
                                                    f3_rate: result.f3_rate
                                                });
                                            }
                                        } else {
                                            console.log('data3 compareDatas() error!');
                                            cb('err', {resCode: -1, msg: '3bad, system'});
                                        }
                                    });
                                } else {
                                    cb('err', {resCode: -1, msg: '3bad, system'});
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
                            cb(null, {
                                resCode: 1,
                                msg: "user insert success",
                                pitch_rate: arg.pitch_rate,
                                int_rate: arg.int_rate,
                                f2_rate: arg.f2_rate,
                                f3_rate: arg.f3_rate
                            });
                        } else {
                            //error on db insert
                            console.log("user insert error msg: ", result.msg);
                            cb('err', {resCode: -1, msg: "user insert fail"});
                        }
                    });
                } else {
                    cb(null, {
                        resCode: 1,
                        msg: recvData.recNum + 'good',
                        pitch_rate: arg.pitch_rate,
                        int_rate: arg.int_rate,
                        f2_rate: arg.f2_rate,
                        f3_rate: arg.f3_rate
                    });
                }
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

//get test data
//test algorithms raw, cosine, median-cosine, block-parsing + cosine
//@param: null
//@result: raw:float, cosine:float, median-cosine:float, block-cosine:float
router.get('/user-test', function(req, res) {
    //test datas
    var test_data_lys_true = __dirname + "/../sound-data/trueLYS11111114/trueLYS1.wav";
    var test_data_lys_false = __dirname + "/../sound-data/falseLYS11111113/falseLYS1.wav";
    var test_data_ljy_true = __dirname + "/../sound-data/trueLJY11111111/trueLJY1.wav";
    var test_data_ljy_false = __dirname + "/../sound-data/falseLJY11111112/falseLJY1.wav";

    //result datas
    var raw_res = 0;
    var cosine_res = 0;
    var med_cosine_res = 0;
    var block_cosine_res = 0;

    async.waterfall([
        //raw test functions
        function(cb){
            testCompareDatas(test_data_lys_true, 'raw', function(res){
                if(res.resCode === 1 && res.user_name == "이윤석"){
                    raw_res += 1;
                }
                cb(null);
            });
        }, function(cb){
            testCompareDatas(test_data_ljy_true, 'raw', function(res) {
                if (res.resCode === 1 && res.user_name == "이지윤") {
                    raw_res += 1;
                }
                cb(null);
            });
        }, function(cb){
            testCompareDatas(test_data_ljy_false, 'raw', function(res){
                if(res.resCode == -1)
                    raw_res += 1;
                cb(null);
            });
        }, function(cb){
            testCompareDatas(test_data_lys_false, 'raw', function(res){
                if(res.resCode == -1)
                    raw_res += 1;
                cb(null);
            });
        },
        //cosine
        function(cb){
            testCompareDatas(test_data_lys_true, 'cosine', function(res){
                console.log(res);
                if(res.resCode === 1 && res.user_name == "이윤석"){
                    cosine_res += 1;
                }
                cb(null);
            });
        }, function(cb){
            testCompareDatas(test_data_ljy_true, 'cosine', function(res) {
                if (res.resCode === 1 && res.user_name == "이지윤") {
                    cosine_res += 1;
                }
                cb(null);
            });
        }, function(cb){
            testCompareDatas(test_data_ljy_false, 'cosine', function(res){
                if(res.resCode == -1)
                    cosine_res += 1;
                cb(null);
            });
        }, function(cb){
            testCompareDatas(test_data_lys_false, 'cosine', function(res){
                if(res.resCode == -1)
                    cosine_res += 1;
                cb(null);
            });
        },
        //median
        function(cb){
            testCompareDatas(test_data_lys_true, 'median', function(res){
                if(res.resCode === 1 && res.user_name == "이윤석"){
                    med_cosine_res += 1;
                }
                cb(null);
            });
        }, function(cb){
            testCompareDatas(test_data_ljy_true, 'median', function(res) {
                if (res.resCode === 1 && res.user_name == "이지윤") {
                    med_cosine_res += 1;
                }
                cb(null);
            });
        }, function(cb){
            testCompareDatas(test_data_ljy_false, 'median', function(res){
                if(res.resCode == -1)
                    med_cosine_res += 1;
                cb(null);
            });
        }, function(cb){
            testCompareDatas(test_data_lys_false, 'median', function(res){
                if(res.resCode == -1)
                    med_cosine_res += 1;
                cb(null);
            });
        },
        //block similarity, block_cosine
        function(cb){
            testCompareDatas(test_data_lys_true, 'block_cosine', function(res){
                if(res.resCode === 1 && res.user_name == "이윤석"){
                    block_cosine_res += 1;
                }
                cb(null);
            });
        }, function(cb){
            testCompareDatas(test_data_ljy_true, 'block_cosine', function(res) {
                if (res.resCode === 1 && res.user_name == "이지윤") {
                    block_cosine_res += 1;
                }
                cb(null);
            });
        }, function(cb){
            testCompareDatas(test_data_ljy_false, 'block_cosine', function(res){
                if(res.resCode == -1)
                    block_cosine_res += 1;
                cb(null);
            });
        }, function(cb){
            testCompareDatas(test_data_lys_false, 'block_cosine', function(res){
                if(res.resCode == -1)
                    block_cosine_res += 1;
                cb(null);
            });
        }
    ], function(err, result){
        if(err) {
            console.log('waterfall err');
        } else {
            res.send({
                raw_rate: raw_res / 4.0,
                cosine_rate: cosine_res / 4.0,
                median_rate: med_cosine_res / 4.0,
                block_rate: block_cosine_res / 4.0
            });
        }
    });

    function testCompareDatas(data, method, cb){
        dbController.selectAll('T_USER', function (result) {
            if (result.resCode) {
                var dataArr = result.data;
                var corrArr = [];
                var dataCnt = dataArr.length;
                var isErr = false;
                dataArr.forEach(function (elem) {
                    var data1 = elem.user_dir + elem.user_name + "3.wav";
                    var data2 = data;
                    praatConnector.compareDatas_attend(data1, data2, method, function (result) {
                        if (result.resCode === 1) {
                            //console.log("pitch_rate", elem.pitch_rate, "int_rate", elem.int_rate);
                            var corrObj = {
                                user_idx: elem.user_idx,
                                user_name: elem.user_name,
                                pitch_rate: result.pitch_rate,
                                int_rate: result.int_rate,
                                comp_val: result.pitch_rate * 0.6 + result.int_rate * 0.4,
                                f2_rate: result.f2_rate,
                                f3_rate: result.f3_rate,
                                pitch_avg: result.pitch_avg
                            };
                            corrArr.push(corrObj);
                            dataCnt--;

                            if (dataCnt === 0) {
                                //end foreach
                                if (!isErr){
                                    corrArr.sort(function(a, b){
                                        return b.comp_val - a.comp_val;
                                    });
                                    console.log(method + " attend_name: ", corrArr[0].user_name, "datas: ", corrArr[0]);
                                    if(corrArr[0].comp_val > 80 && corrArr[0].pitch_avg > 80)
                                        cb({resCode: 1, attend_name: corrArr[0].user_name});
                                    else
                                        cb({resCode: -1});
                                }
                                else
                                    cb({resCode: -1, msg: 'dataCompare() err: ' + result.msg});
                            }
                        } else {
                            console.log('compareDatas_attend() error!');
                            isErr = true;
                        }
                    });
                });
            } else {
                //select error
                cb('err', {resCode: -1, msg: 'SelectAll err'});
            }
        });
    }


});
module.exports = router;
