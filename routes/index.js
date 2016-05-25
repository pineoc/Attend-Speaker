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
    var filename = recvData.file;
    //filename="fm12345678/fm1.wav";
    res.render('d3graph', {filename: filename});
});

router.get('/make-test-data', function(req, res){
    res.render('index', {title:'index'});
});

module.exports = router;
