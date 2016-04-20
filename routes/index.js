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

router.get('/dir-test', function(req, res, next){
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

module.exports = router;
