var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('mainPage', { title: 'mainPage' });
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

module.exports = router;
