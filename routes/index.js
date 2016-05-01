var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('mainPage', { title: 'mainPage' });
});

router.get('/register-speaker', function(req, res, next) {
    res.render('record', {title: 'recordPage'});
});

/*
 * show check attendance page
 *
 *
 * */
router.get('/check-attendance', function(req, res, next) {
    res.render('check', {title: 'checkPage'});
});


router.get('/exec-test', function(req, res, next){
    var child_proc = require('child_process');
    var comp_dir = path.join(__dirname, '../data-compare-sol/data-compare-sol/x64/Debug');
    var cmd_file = path.join(__dirname, '../data-compare-sol/data-compare-sol/x64/Debug') + "/data-compare-sol.exe";
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

/*
//test db user insert
router.post('/user-insert-test', function(req, res){
    var dbController = require('./dbController');
    dbController.insertOneUser(["c:/Users/test/Documents/GitHub/Attend-Speaker/routes/../sound-data/jiyoon1234/", "jiyoon", "1234"], function(result){
        if(result.resCode){
            console.log("result: ", result);
            res.json({resCode: 1, msg: "insert success"});
        } else {
            //error on db insert
            console.log("error msg: ", result.msg);
            res.json({resCode: -1, msg: "insert fail"});
        }
    });
});
*/

router.get('/comp-test', function(req,res){
    var praatCont = require('./praatConnector');
    var user_path = "C:/Users/test/Documents/GitHub/Attend-Speaker/sound-data/jiyoon1234";
    var filename1 = "jiyoon1.wav";
    var filename2 = "jiyoon2.wav";
    praatCont.compareDatas(user_path + "/", filename1, filename2, function(result){
        if(result.resCode == 1){
            //success
            //console.log('comp success, data: ', result);
            res.json({result: "success", data: result});
        } else {
            //fail
            console.log('comp fail, data: ', result);
            res.send('fail');
        }
    });
});



module.exports = router;
