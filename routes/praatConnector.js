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
    console.log("textGridCommand: ", textGridCommand);
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
 * @params: dataDirPath,
 * @result:
 * */
exports.compareDatas = function(){

};