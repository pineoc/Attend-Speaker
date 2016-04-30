var express = require('express');
var router = express.Router();


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
* @param : regNum, dataURL, personName
* @result : isValid(Boolean)
* */
router.post('/register', function(req, res, next){
    var recvData = req.body;
    //TODO 1:
    //TODO 2:
    //TODO 3:
    //TODO 4:
    res.json(recvData);
});

module.exports = router;
