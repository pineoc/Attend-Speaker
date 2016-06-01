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
            var saveFilePath = __dirname + "/../sound-data/tmp/" + dateVal + "t.wav";

            fs.writeFile(saveFilePath, buff, function(err){
                if(err){
                    console.log('attend, w1 write file error: ', err);
                    cb('err', {resCode: -1, msg: "attend bad, write file error"});
                } else {
                    console.log('attend, w1 write file success');
                    var filename = dateVal + "t.wav";
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
                        var data1 = elem.user_dir + elem.user_name + "3.wav";
                        var data2 = arg.outFileDirPath + "/" + arg.filename;
                        //console.log("data1: ", data1, "data2: ", data2);
                        praatConnector.compareDatas_attend(data1, data2, "block_cosine", function(result){
                            if(result.resCode === 1){
                                //console.log("pitch_rate", elem.pitch_rate, "int_rate", elem.int_rate);
                                var corrObj = result;
                                corrObj["user_idx"] = elem.user_idx;
                                corrObj["user_name"] = elem.user_name;
                                corrObj["comp_val"] = result.pitch_rate * 0.6 + result.int_rate * 0.4;
                                corrObj["data_file"] = data1;
                                /*
                                {
                                    user_idx: elem.user_idx,
                                    user_name: elem.user_name,
                                    pitch_rate: result.pitch_rate,
                                    int_rate: result.int_rate,
                                    comp_val: result.pitch_rate * 0.6 + result.int_rate * 0.4,
                                    f2_rate: result.f2_rate,
                                    f3_rate: result.f3_rate,
                                    data_file: data1
                                };
                                */
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

            //console.log('dataArr: ', dataArr);
            console.log('attend person: ', dataArr[0]);

            var newFile_name = arg.newFile;
            newFile_name = newFile_name.substring(__dirname.length + 14);
            dataArr[0].data_file = dataArr[0].data_file.substring(__dirname.length + 14);
            //if comp_val is 90 point, success
            if(dataArr[0].comp_val > 80.0)
                cb(null, {
                    resCode: 1,
                    checkResult: dataArr[0],
                    checkDataArr: dataArr,
                    newFile: newFile_name
                });
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
                //console.log("w2 start, arg: ", arg, recvData.recNum);
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
                                    praatConnector.compareDatas(user_path + "/", filename1, filename2, "block_cosine", function(result){
                                        if(result.resCode === 1){
                                            if(result.isValid) {
                                                var cb_res = result;
                                                cb_res['resCode'] = 1;
                                                cb_res['msg'] = '2good';
                                                cb(null, cb_res);
                                            } else {
                                                console.log('data2 isValid : false, values: ', result.pitch_rate, result.int_rate);
                                                var cb_res = result;
                                                cb_res['resCode'] = -1;
                                                cb_res['msg'] = '2bad';
                                                cb('err', cb_res);
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
                                    praatConnector.compareDatas(user_path + "/", filename1, filename2, "block_cosine", function(result){
                                        if(result.resCode === 1){
                                            if(result.isValid) {
                                                var cb_res = result;
                                                cb_res['resCode'] = 1;
                                                cb_res['msg'] = '3good';
                                                cb(null, cb_res);
                                            } else {
                                                console.log('data3 isValid : false, values: ', result.pitch_rate, result.int_rate);
                                                var cb_res = result;
                                                cb_res['resCode'] = -1;
                                                cb_res['msg'] = '3bad';
                                                cb('err', cb_res);
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
                            var cb_res = arg;
                            cb_res['resCode'] = 1;
                            cb_res['msg'] = 'user insert success';
                            cb(null, cb_res);
                        } else {
                            //error on db insert
                            console.log("user insert error msg: ", result.msg);
                            cb('err', {resCode: -1, msg: "user insert fail"});
                        }
                    });
                } else {
                    cb(null, arg);
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

/*
* test for ROC
*
* */
router.get('/user-test-roc', function(req, res){
    var lys_t_arr = ["lys-t-1", "lys-t-2", "lys-t-3", "lys-t-4", "lys-t-5",
        "lys-t-6", "lys-t-7", "lys-t-8", "lys-t-9", "lys-t-10"];
    var lys_f_arr = ["lys-f-1", "lys-f-2", "lys-f-3", "lys-f-4", "lys-f-5",
        "lys-f-6", "lys-f-7", "lys-f-8", "lys-f-9", "lys-f-10"];
    var ljy_t_arr = ["ljy-t-1", "ljy-t-2", "ljy-t-3", "ljy-t-4", "ljy-t-5",
        "ljy-t-6", "ljy-t-7", "ljy-t-8", "ljy-t-9", "ljy-t-10"];
    var ljy_f_arr = ["ljy-f-1", "ljy-f-2", "ljy-f-3", "ljy-f-4", "ljy-f-5",
        "ljy-f-6", "ljy-f-7", "ljy-f-8", "ljy-f-9", "ljy-f-10"];
    var compare_str_arr = ["pitch_rate", "pitch_avg", "int_rate", "f2_rate", "f3_rate"];
    var stand_data_arr = [70, 80, 90];

    var raw_result = {}; //if done, size=300
    var cosine_result = {};
    var block_cosine_result = {};
    var median_result = {};

    for(var i=0; i<5;i++){
        for(var j=0;j<3;j++){
            raw_result[compare_str_arr[i]+stand_data_arr[j]] = new Array();
            cosine_result[compare_str_arr[i]+stand_data_arr[j]] = new Array();
            block_cosine_result[compare_str_arr[i]+stand_data_arr[j]] = new Array();
            median_result[compare_str_arr[i]+stand_data_arr[j]] = new Array();
        }
    }

    async.waterfall([
        function(cb){
            //raw
            var count = 300;

            //비교대상, pitch_rate, int_rate, ...
            for(var i = 0; i < 5; i++){
                //기준, 70, 80, 90
                for(var j = 0; j < 3; j++){
                    //lys-t-arr
                    //raw_result[compare_str_arr[i] + stand_data_arr[j]] = new Array();
                    for(var k = 0; k < 10; k++){
                        testCompareDatasROC(lys_t_arr[k], "raw", compare_str_arr[i], stand_data_arr[j],function(result){
                            if(result.resCode === 1 && result.user_name == "이윤석"){
                                raw_result[compare_str_arr[i]+stand_data_arr[j]].push(1);
                            } else {
                                raw_result[compare_str_arr[i]+stand_data_arr[j]].push(0);
                            }
                            count--;
                            if(count==0){
                                console.log('raw test end');
                                cb(null);
                            }
                        });
                    }
                }
            }
            //비교대상, pitch_rate, int_rate, ...
            for(var i=0; i < 5; i++){
                //기준, 70, 80, 90
                for(var j = 0; j < 3; j++){
                    //lys-t-arr
                    for(var k = 0; k < 10; k++){
                        testCompareDatasROC(ljy_t_arr[k], "raw", compare_str_arr[i], stand_data_arr[j], function(result){
                            if(result.resCode === 1 && result.user_name == "이지윤"){
                                raw_result[compare_str_arr[i]+stand_data_arr[j]].push(1);
                            } else {
                                raw_result[compare_str_arr[i]+stand_data_arr[j]].push(0);
                            }
                            count--;
                            if(count==0){
                                console.log('raw test end');
                                cb(null);
                            }
                        });
                    }
                }
            }
        }, function(cb){
            //cosine
            var count = 300;
            //비교대상, pitch_rate, int_rate, ...
            for(var i = 0; i < 5; i++){
                //기준, 70, 80, 90
                for(var j = 0; j < 3; j++){
                    //lys-t-arr
                    for(var k = 0; k < 10; k++){
                        testCompareDatasROC(lys_t_arr[k], "cosine", compare_str_arr[i], stand_data_arr[j],function(result){
                            if(result.resCode === 1 && result.user_name == "이윤석"){
                                cosine_result[compare_str_arr[i]+stand_data_arr[j]].push(1);
                            } else {
                                cosine_result[compare_str_arr[i]+stand_data_arr[j]].push(0);
                            }
                            count--;
                            if(count==0){
                                console.log('cosine test end');
                                cb(null);
                            }
                        });
                    }
                }
            }
            //비교대상, pitch_rate, int_rate, ...
            for(var i=0; i < 5; i++){
                //기준, 70, 80, 90
                for(var j = 0; j < 3; j++){
                    //lys-t-arr
                    for(var k = 0; k < 10; k++){
                        testCompareDatasROC(ljy_t_arr[k], "cosine", compare_str_arr[i], stand_data_arr[j],function(result){
                            if(result.resCode === 1 && result.user_name == "이지윤"){
                                cosine_result[compare_str_arr[i]+stand_data_arr[j]].push(1);
                            } else {
                                cosine_result[compare_str_arr[i]+stand_data_arr[j]].push(0);
                            }
                            count--;
                            if(count==0){
                                console.log('cosine test end');
                                cb(null);
                            }
                        });
                    }
                }
            }
        }, function(cb){
            //block
            var count = 300;
            //비교대상, pitch_rate, int_rate, ...
            for(var i = 0; i < 5; i++){
                //기준, 70, 80, 90
                for(var j = 0; j < 3; j++){
                    //lys-t-arr
                    for(var k = 0; k < 10; k++){
                        testCompareDatasROC(lys_t_arr[k], "block_cosine", compare_str_arr[i], stand_data_arr[j],function(result){
                            if(result.resCode === 1 && result.user_name == "이윤석"){
                                block_cosine_result[compare_str_arr[i]+stand_data_arr[j]].push(1);
                            } else {
                                block_cosine_result[compare_str_arr[i]+stand_data_arr[j]].push(0);
                            }
                            count--;
                            if(count==0){
                                console.log('block test end');
                                cb(null);
                            }
                        });
                    }
                }
            }
            //비교대상, pitch_rate, int_rate, ...
            for(var i=0; i < 5; i++){
                //기준, 70, 80, 90
                for(var j = 0; j < 3; j++){
                    //lys-t-arr
                    for(var k = 0; k < 10; k++){
                        testCompareDatasROC(ljy_t_arr[k], "block_cosine", compare_str_arr[i], stand_data_arr[j],function(result){
                            if(result.resCode === 1 && result.user_name == "이지윤"){
                                block_cosine_result[compare_str_arr[i]+stand_data_arr[j]].push(1);
                            } else {
                                block_cosine_result[compare_str_arr[i]+stand_data_arr[j]].push(0);
                            }
                            count--;
                            if(count==0){
                                console.log('block test end');
                                cb(null);
                            }
                        });
                    }
                }
            }
        }, function(cb){
            //block+median
            var count = 300;
            //비교대상, pitch_rate, int_rate, ...
            for(var i = 0; i < 5; i++){
                //기준, 70, 80, 90
                for(var j = 0; j < 3; j++){
                    //lys-t-arr
                    for(var k = 0; k < 10; k++){
                        testCompareDatasROC(lys_t_arr[k], "median", compare_str_arr[i], stand_data_arr[j],function(result){
                            if(result.resCode === 1 && result.user_name == "이윤석"){
                                median_result[compare_str_arr[i]+stand_data_arr[j]].push(1);
                            } else {
                                median_result[compare_str_arr[i]+stand_data_arr[j]].push(0);
                            }
                            count--;
                            if(count==0){
                                console.log('median block test end');
                                cb(null);
                            }
                        });
                    }
                }
            }
            //비교대상, pitch_rate, int_rate, ...
            for(var i=0; i < 5; i++){
                //기준, 70, 80, 90
                for(var j = 0; j < 3; j++){
                    //lys-t-arr
                    for(var k = 0; k < 10; k++){
                        testCompareDatasROC(ljy_t_arr[k], "median", compare_str_arr[i], stand_data_arr[j],function(result){
                            if(result.resCode === 1 && result.user_name == "이지윤"){
                                median_result[compare_str_arr[i]+stand_data_arr[j]].push(1);
                            } else {
                                median_result[compare_str_arr[i]+stand_data_arr[j]].push(0);
                            }
                            count--;
                            if(count==0){
                                console.log('median block test end');
                                cb(null);
                            }
                        });
                    }
                }
            }
        }
    ],function(err,result){
        if(err){
            console.log('roc error on waterfall ', err);
            res.json({result:'err', msg: err});
        } else {
            res.json({
                result: 'success',
                raw_result: raw_result,
                cosine_result: cosine_result,
                block_result: block_cosine_result,
                median_result: median_result
            });
        }
    });

});

router.get('/user-test-roc-each', function(req, res){
    var recvData = req.query;
    //console.log(recvData);
    var lys_t_arr = ["lys-t-1", "lys-t-2", "lys-t-3", "lys-t-4", "lys-t-5",
        "lys-t-6", "lys-t-7", "lys-t-8", "lys-t-9", "lys-t-10"];
    var ljy_t_arr = ["ljy-t-1", "ljy-t-2", "ljy-t-3", "ljy-t-4", "ljy-t-5",
        "ljy-t-6", "ljy-t-7", "ljy-t-8", "ljy-t-9", "ljy-t-10"];
    var ljy_f_arr = ["ljy-f-1", "ljy-f-2", "ljy-f-3", "ljy-f-4", "ljy-f-5",
        "ljy-f-6", "ljy-f-7", "ljy-f-8", "ljy-f-9", "ljy-f-10"];
    var compare_str_arr = ["pitch_rate", "pitch_avg", "int_rate", "f2_rate", "f3_rate"];
    var stand_data_arr = [70, 80, 90];


    if(recvData.dataname == 'lys'){
        testCompareDatasROC(
            lys_t_arr[parseInt(recvData.dataidx)],
            recvData.method,
            compare_str_arr[parseInt(recvData.standstr)],
            stand_data_arr[parseInt(recvData.standval)], function(result){
                if(result.resCode==1 && result.user_name=='이윤석')
                    res.json({resCode: 1});
                else
                    res.json({resCode: -1});
            });
    } else {
        if(recvData.testType == "true"){
            testCompareDatasROC(
                ljy_t_arr[parseInt(recvData.dataidx)],
                recvData.method,
                compare_str_arr[parseInt(recvData.standstr)],
                stand_data_arr[parseInt(recvData.standval)], function(result){
                    if(result.resCode==1 && result.user_name=='이지윤')
                        res.json({resCode: 1});
                    else
                        res.json({resCode: -1});
                });
        } else {
            //false positive & negative
            testCompareDatasROC(
                ljy_f_arr[parseInt(recvData.dataidx)],
                recvData.method,
                compare_str_arr[parseInt(recvData.standstr)],
                stand_data_arr[parseInt(recvData.standval)], function(result){
                    if(result.resCode == 1 && result.user_name == '이지윤')
                        res.json({resCode: -1});
                    else {
                        res.json({resCode: 1});
                    }
                });
        }

    }

});

function testCompareDatasROC(data, method, comp_val, standValue, cb){
    dbController.selectAll('T_USER', function (result) {
        if (result.resCode) {
            var dataArr = result.data;
            var corrArr = [];
            var dataCnt = dataArr.length;
            var isErr = false;
            dataArr.forEach(function (elem) {
                var data1 = elem.user_dir + elem.user_name + "3.wav";
                var data2 = __dirname + "/../sound-data/test-data/" + data;
                praatConnector.compareDatas_attend(data1, data2, method, function (result) {
                    if (result.resCode === 1) {
                        //console.log("pitch_rate", elem.pitch_rate, "int_rate", elem.int_rate);
                        var corrObj = {
                            user_idx: elem.user_idx,
                            user_name: elem.user_name,
                            pitch_rate: result.pitch_rate,
                            int_rate: result.int_rate,
                            comp_val: result[comp_val],
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
                                console.log(method + " attend_name: ", corrArr[0].user_name);
                                //check settings
                                if(corrArr[0].comp_val > standValue)
                                    cb({resCode: 1, user_name: corrArr[0].user_name, data: corrArr[0]});
                                else
                                    cb({resCode: -1, user_name: corrArr[0].user_name, data: corrArr[0]});
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


module.exports = router;
