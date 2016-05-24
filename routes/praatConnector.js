/**
 * Created by pineoc on 2016-04-27.
 * Praat script execute module
 */

var path = require('path');

//compare function data set
var comp_dir = path.join(__dirname, '../data-compare-sol');
var comp_cmd = comp_dir + "/data-compare-sol";
comp_cmd = comp_cmd.replace(/\\/g, '/');
/*
* make data to personPath
* @params: wavFilePath, wavFilename, dataPath, dataName
* @result:
* */
exports.makeDatas = function(wavFilePath, wavFilename, dataPath, dataName, callback){
    var childProcess = require('child_process');

    //praat command path
    //praat.exe file should download to project home directory
    var praatCommand = path.join(__dirname, "..") + "/praat ";

    //c:\Users\Administrator\Desktop\capstone\attend-speaker
    var praat_dir = path.join(__dirname, '..');

    //script for praat script function
    var scriptToRun = "file-write.praat";
    //sound file working directory
    var workingDir = wavFilePath;
    //sound file
    var wavFile = wavFilename;
    //script params
    var scriptParameters = workingDir + " " + wavFile + " " + dataPath + "/ " + dataName;

    //command
    var textGridCommand = praatCommand + __dirname + "/../praat-script/" + scriptToRun + " " + scriptParameters; //+ " 2>&1 ";

    var options = {
        encoding: 'utf8',
        timeout: 0,
        killSignal: 'SIGTERM',
        cwd: praat_dir,
        env: process.env
    };
    childProcess.exec(textGridCommand , options, function(error, stdout, stderr) {
        if(error){
            console.log('make data error occurred, ', error);
            callback(false);
        } else {
            //console.log('make data std: ', stdout, stderr);
            callback(true);
        }
    });
};

/*
 * compare data personPath
 * @params: dataDirPath, filename1, filename2
 * @result:
 * */
exports.compareDatas = function(dataDirPath, filename1, filename2, method, callback){
    var child_proc = require('child_process');

    //"dev" used for test with compare program
    var comp_cmd_params = dataDirPath + filename1 + " " + dataDirPath + filename2 + " " + method;

    var result_cmd = comp_cmd + " " + comp_cmd_params;

    //console.log('result_cmd: ', result_cmd);
    var exec_callback = function(err, stdout, stderr){
        if(err){
            //console.log('compareDatas error occurred, ', err);
            callback({
                resCode: -1,
                msg:'exec err',
                err: err
            });
        } else {
            var stdout_result = JSON.parse(stdout);
            var isValid = false;

            //test standard rate = 70.0
            console.log(stdout_result);
            if(stdout_result.data_valid == 1) {
                isValid = true;
            }

            callback({
                resCode: 1,
                msg: 'exec success',
                pitch_rate: stdout_result.pitch_rate,
                int_rate: stdout_result.int_rate,
                f2_rate: stdout_result.f2_rate,
                f3_rate: stdout_result.f3_rate,
                pitch_avg: stdout_result.pitch_avg,
                isValid: isValid
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
    //execute
    child_proc.exec(result_cmd, options, exec_callback);
};

/*
 * compare data personPath
 * @params: filename1, filename2
 * @result:
 * */
exports.compareDatas_attend = function(filename1, filename2, method, callback){
    var child_proc = require('child_process');

    //"dev" used for test with compare program
    var comp_cmd_params = filename1 + " " + filename2 + " " + method;

    var result_cmd = comp_cmd + " " + comp_cmd_params;

    var exec_callback = function(err, stdout, stderr){
        if(err){
            callback({
                resCode: -1,
                msg:'exec err',
                err: err
            });
        } else {
            var stdout_result = null;
            try{
                stdout_result = JSON.parse(stdout);
                callback({
                    resCode: 1,
                    msg: 'exec success',
                    pitch_rate: stdout_result.pitch_rate,
                    pitch_avg: stdout_result.pitch_avg,
                    int_rate: stdout_result.int_rate,
                    f2_rate: stdout_result.f2_rate,
                    f3_rate: stdout_result.f3_rate
                });
            } catch(err){
                console.log('compareDatas_attend() err: ', err);
                return callback({resCode: -1, msg: 'json parse err'});
            }
        }
    };
    var options = {
        encoding: 'utf8',
        timeout: 0,
        killSignal: 'SIGTERM',
        cwd: comp_dir,
        env: process.env
    };

    //execute
    child_proc.exec(result_cmd, options, exec_callback);
};

exports.recordFileDelete = function(file, cb){

};