/**
 * Created by pineoc on 2016-04-27.
 */

var mysql = require('mysql');
var config = require('./config');

var pool = mysql.createPool(config.dbConfig);

/*
 * Check database status for use MySQL
 * @param
 * @result true, false
 * */
exports.getDBStatus = function(callback){
    pool.getConnection(function(err, conn){
        if(err)
            callback(false);
        else {
            conn.query('SELECT COUNT(*) FROM T_USER',[],function(err, result){
                if(err){
                    callback(false);
                } else {
                    callback(true);
                }
                conn.release();
            });
        }
    });
};

/*
 * Get data from table (select all)
 * @param: tableName
 * @result: resCode, data(array)
 * */
exports.selectAll = function(tableName, callback){
    pool.getConnection(function(err, conn){
        if(err)
            callback({resCode: false, data: null, msg: 'getConnection fail, code: ' + err});
        else {
            conn.query('SELECT * FROM ' + tableName, [], function(err, result){
                if(err){
                    callback({resCode: false, data: null, msg: err });
                } else {
                    callback({resCode: true, data: result});
                }
                conn.release();
            });
        }
    });
};

/*
 * Get data from table is exist
 * @param: tableName, wherePhrase, params
 * @result: resCode, data(object)
 * */
exports.checkExist = function(tableName, wherePhrase, params, callback){
    pool.getConnection(function(err, conn){
        if(err)
            callback({resCode: false, data: null, msg: 'getConnection fail, code: ' + err});
        else {
            conn.query('SELECT * FROM ' + tableName + ' WHERE ' + wherePhrase, params, function(err, result){
                if(err){
                    callback({resCode: false, data: null, msg: err });
                } else {
                    if(result.length === 0){
                        callback({resCode: true, data: result, msg: 'no data'});
                    } else {
                        callback({resCode: false, data: result, msg: 'exist'});
                    }
                }
                conn.release();
            });
        }
    });
};

/*
 * Insert data INTO T_USER, insertOne
 * @param: insertData(user_dir, user_name, user_idnum)
 * @result: resCode, data(object)
 * */
exports.insertOneUser = function(insertData, callback){
    pool.getConnection(function(err, conn){
        if(err)
            callback({resCode: false, data: null, msg: 'getConnection fail, code: ' + err});
        else {
            conn.query('INSERT INTO T_USER(user_dir, user_name, user_idnum) VALUES(?,?,?)', insertData, function(err, result){
                if(err){
                    callback({resCode: false, data: null, msg: err });
                } else {
                    callback({resCode: true, data: result});
                }
                conn.release();
            });
        }
    });
};

/*
 * update data set T_USER
 * @param: updateData(user_idx, user_dir, user_name)
 * @result: resCode, data(object)
 * */
exports.updateOneUser = function(updateData, callback){
    pool.getConnection(function(err, conn){
        if(err)
            callback({resCode: false, data: null, msg: 'getConnection fail, code: ' + err});
        else {
            conn.query('UPDATE T_USER SET user_dir=IF(ISNULL(?), user_dir, ?), ' +
                'user_name = IF(ISNULL(?), user_name, ?), ' +
                'user_attend = IF(ISNULL(?), user_attend, ?), ' +
                'user_spec = IF(ISNULL(?), user_spec, ?) ' +
                'WHERE user_idx=?', updateData, function(err, result){
                if(err){
                    callback({resCode: false, data: null, msg: err });
                } else {
                    callback({resCode: true, data: result});
                }
                conn.release();
            });
        }
    });
};