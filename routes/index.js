var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/exec-test', function(req, res, next){
    var child_proc = require('child_process');
    var file_name = 'C:/Users/Administrator/Documents/GitHub/data-compare-sol/data-compare-sol/x64/Debug/data-compare-sol.exe';
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
    var options = {
        encoding: 'utf8',
        timeout: 0,
        killSignal: 'SIGTERM',
        cwd: "C:/Users/Administrator/Documents/GitHub/data-compare-sol/data-compare-sol/x64/Debug",
        env: process.env
    };
    child_proc.exec(file_name, options, exec_callback);
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
