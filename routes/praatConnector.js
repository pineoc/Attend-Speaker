/**
 * Created by pineoc on 2016-04-27.
 * Praat script execute module
 */

var path = require('path');

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
            console.log('make data error occurred, ', error);
            callback(false);
        } else {
            console.log('make data std: ', stdout, stderr);
            callback(true);
        }
    });
};

/*
 * compare data personPath
 * @params: dataDirPath, filename1, filename2
 * @result:
 * */
exports.compareDatas = function(dataDirPath, filename1, filename2, callback){
    var child_proc = require('child_process');
    var comp_dir = path.join(__dirname, '../data-compare-sol/data-compare-sol/x64/Debug');
    var comp_cmd = path.join(__dirname, '../data-compare-sol/data-compare-sol/x64/Debug') + "/data-compare-sol";
    comp_cmd = comp_cmd.replace(/\\/g, '/');

    //"dev" used for test with compare program
    var comp_cmd_params = dataDirPath + filename1 + " " + dataDirPath + filename2 + " dev";

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
            if(stdout_result.pitch_rate > 70.0 && stdout_result.int_rate > 70.0)
                isValid = true;

            callback({
                resCode: 1,
                msg: 'exec success',
                pitch_rate: stdout_result.pitch_rate,
                int_rate: stdout_result.int_rate,
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