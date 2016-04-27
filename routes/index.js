var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('mainPage', { title: 'mainPage' });
});

router.get('/check-page', function(req, res, next) {
    res.render('check', {title: 'checkPage'});
});

router.get('/record-page', function(req, res, next) {
    res.render('record', {title: 'recordPage'});
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
 * ls execute using spawn
 *
 *
 * */
router.get('/spawn-ls', function(req, res){
    const spawn = require('child_process').spawn;
    const ls = spawn('ls', ['-lh', '/usr']);

    ls.stdout.on('data', function(data) {
        console.log('stdout: ', data);
        res.send("data: " + data);
    });

    ls.stderr.on('data', function(data){
        console.log('stderr: ', data);
        res.send("error");
    });

    ls.on('close', function(code) {
        console.log('child process exited with code ', code);
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
    var textGridCommand = praatCommand + __dirname + "/../praat-script/" + scriptToRun + " " + scriptParameters; //+ " 2>&1 ";
    //console.log("textGridCommand: ", textGridCommand);
    var options = {
        encoding: 'utf8',
        timeout: 0,
        killSignal: 'SIGTERM',
        cwd: praat_dir,
        env: process.env
    };
    childProcess.exec(textGridCommand , options, function(error, stdout, stderr) {
        if(error){
            console.log('error occurred, ', error);
            res.send('error');
        } else {
            console.log('std: ', stdout, stderr);
            res.send('exec success');
        }
    });
});

/*
* execute praat using spawn.
* it has no stdout
* it just end
* */
router.get('/spawn-praat', function(req, res){
    var childProcess = require('child_process');
    const spawn = childProcess.spawn;

    //praat command path
    //praat.exe file should download to project home directory
    var praatCommand = path.join(__dirname, "..") + "/praat.exe";
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
    var scriptDir = __dirname + "/../praat-script/" + scriptToRun;
    var scriptParams = [-20, 4, 0.4, 0.1, "no", workingDir, wavFile];

    //command
    var textGridCommand = praatCommand + __dirname + "/../praat-script/" + scriptToRun + " " + scriptParameters; //+ " 2>&1 ";
    //console.log("textGridCommand: ", textGridCommand);
    var options = {
        encoding: 'utf8',
        timeout: 0,
        killSignal: 'SIGTERM',
        cwd: praat_dir,
        env: process.env
    };
    const praat = spawn(praatCommand, [scriptDir, scriptParameters], options);

    praat.stdout.on('data', function(data) {
        console.log('stdout: ', data);
        res.send("praat data: " + data);
    });

    praat.stderr.on('data', function(data){
        console.log('stderr: ', data);
        res.send("error");
    });

    praat.on('close', function(code) {
        console.log('child process exited with code ', code);
    });
});

module.exports = router;
