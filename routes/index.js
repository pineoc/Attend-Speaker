var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
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

router.get('/exec-dir', function(req, res, next){
    var child_proc = require('child_process');
    var file_name = 'dir';
    var exec_callback = function(err, stdout, stderr){
        if(err){
            console.log('error occurred, ', err);
            res.json({
                msg:'exec result',
                err: err
            });
        }
        console.log('exec result: ', stdout, stderr);
        res.json({
            msg: 'exec result',
            stdout: stdout,
            stderr: stderr
        });
    };
    child_proc.exec(file_name, exec_callback, {
        encoding: 'utf8',
        timeout: 0,
        killSignal: 'SIGTERM',
        cwd: "C:/Users/Administrator/Documents/GitHub/data-compare-sol/data-compare-sol/x64/Debug",
        env: process.env
    });
});
/*
* praat execute test
*
*
* */
router.get('/exec-praat', function(req, res){
    var childProcess = require('child_process');

    //praat command path
    //praat.exe file should download to project home directory
    var praatCommand = path.join(__dirname, "..") + "/praat ";
    var praatMacCommand = " Applications/Praat.app/Contents/MacOS/Praat ";

    //c:\Users\Administrator\Desktop\capstone\attend-speaker
    var praat_dir = path.join(__dirname, '..');

    //script for praat script function
    var scriptToRun = "file-write.praat";
    //sound file working directory
    var workingDir = "./sound-data";
    //sound file
    var wavFile = "test1.wav";
    //script params
    var scriptParameters = "-20 4 0.4 0.1 no \"" + workingDir + "\"   \"" + wavFile + "\"";

    //command
    var textGridCommand = praatCommand + __dirname + "/../praat-script/" + scriptToRun + "  " + scriptParameters; //+ " 2>&1 ";

    childProcess.exec(textGridCommand , function(error, stdout, stderr) {
        if(error){
            console.log('error occurred, ', error);
            res.send('error');
        } else {
            console.log('std: ', stdout, stderr);
            console.log("Script execution is complete, here are the results: " + stdout);
            res.send('success');
        }
    }, {
        encoding: 'utf8',
        timeout: 0,
        killSignal: 'SIGTERM',
        cwd: praat_dir,
        env: process.env
    });
});

module.exports = router;
