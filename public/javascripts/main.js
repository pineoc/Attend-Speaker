/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var recIndex = 0;
var recNum = 1;

var currblob = null;
/* TODO:

- offer mono option
- "Monitor input" switch
*/

function saveAudio() {
    audioRecorder.exportWAV( doneEncoding );
    // could get mono instead by saying
    // audioRecorder.exportMonoWAV( doneEncoding );
}

function gotBuffers( buffers ) {
    var canvas = document.getElementById( "wavedisplay"+ recNum);

    drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), buffers[0] );

    // the ONLY time gotBuffers is called is right after a new recording is completed - 
    // so here's where we should set up the download.
    audioRecorder.exportWAV( doneEncoding );
}

function doneEncoding( blob ) {
    Recorder.setupDownload( blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav" );

    currblob = blob;

    if(document.getElementById("regiBtn"))
    { reqRegiResult(); }
    else
    { checkBtn(); }
    
}

function toggleRecording( e ) {
    //check name, number
    if(document.getElementById("user_name").value === "" || typeof document.getElementById("user_name").value === 'undefined'){
        $("#alertModal-reg").find("#modal_text").html("이름을 입력해 주세요.");
        $("#alertModal-reg").modal();
        return;
    }
    if(document.getElementById("student_num").value === "" || typeof document.getElementById("student_num").value === 'undefined'){
        $("#alertModal-reg").find("#modal_text").html("학번을 입력해 주세요.");
        $("#alertModal-reg").modal();
        return;
    }

    if (e.classList.contains("recording")) {
        // stop recording
        audioRecorder.stop();
        e.classList.remove("recording");
        e.innerHTML = "녹음 시작";
        audioRecorder.getBuffers( gotBuffers );
    } else {
        // start recording
        if (!audioRecorder)
            return;
        e.classList.add("recording");
        e.innerHTML = "녹음 완료";
        audioRecorder.clear();
        audioRecorder.record();
    }
}

function toggleChecking( e ) {
    if(e.classList.contains("recording")) {
        //stop recording
        audioRecorder.stop();
        e.classList.remove("recording");
        e.innerHTML = "녹음 시작";
        audioRecorder.getBuffers( gotBuffers );
    } else {
        //start recording
        if(!audioRecorder)
            return;
        e.classList.add("recording");
        e.innerHTML = "녹음 완료";
        audioRecorder.clear();
        audioRecorder.record();
    }
}

function buttonBlock(e){
    if(e.classList.contains("disabled")){
        //cur : send -> disabled
        e.classList.remove("disabled");
    }else{
        e.classList.add("disabled");
    }
}

function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}

function cancelAnalyserUpdates() {
    window.cancelAnimationFrame( rafID );
    rafID = null;
}

function updateAnalysers(time) {
    if (!analyserContext) {
        var canvas = document.getElementById("analyser");
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        analyserContext = canvas.getContext('2d');
    }

    // analyzer draw code here
    {
        var SPACING = 3;
        var BAR_WIDTH = 1;
        var numBars = Math.round(canvasWidth / SPACING);
        var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

        analyserNode.getByteFrequencyData(freqByteData); 

        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
        analyserContext.fillStyle = '#F6D565';
        analyserContext.lineCap = 'round';
        var multiplier = analyserNode.frequencyBinCount / numBars;

        // Draw rectangle for each frequency bin.
        for (var i = 0; i < numBars; ++i) {
            var magnitude = 0;
            var offset = Math.floor( i * multiplier );
            // gotta sum/average the block, or we miss narrow-bandwidth spikes
            for (var j = 0; j< multiplier; j++)
                magnitude += freqByteData[offset + j];
            magnitude = magnitude / multiplier;
            var magnitude2 = freqByteData[i * multiplier];
            analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
            analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
        }
    }
    
    rafID = window.requestAnimationFrame( updateAnalysers );
}

function toggleMono() {
    if (audioInput != realAudioInput) {
        audioInput.disconnect();
        realAudioInput.disconnect();
        audioInput = realAudioInput;
    } else {
        realAudioInput.disconnect();
        audioInput = convertToMono( realAudioInput );
    }

    audioInput.connect(inputPoint);
}

function gotStream(stream) {
    inputPoint = audioContext.createGain();

    // Create an AudioNode from the stream.
    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);

//    audioInput = convertToMono( input );

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect( analyserNode );

    audioRecorder = new Recorder( inputPoint );

    zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    inputPoint.connect( zeroGain );
    zeroGain.connect( audioContext.destination );
    updateAnalysers();
}

function initAudio() {
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, function(e) {
            alert('Error getting audio');
            console.log(e);
        });
}

function reqRegiResult(){

    //disable button
    buttonBlock(document.getElementById("regiBtn"));

    //console.log("currblob : ", currblob);
    var blobToBase64 = function(blob, cb) {
        var reader = new FileReader();
        reader.onload = function() {
            var dataUrl = reader.result;
            var base64 = dataUrl.split(',')[1];
            cb(base64);
        };
        reader.readAsDataURL(blob);
    };
    blobToBase64(currblob, function(base64){
        //var update = {'blob': base64};
        //set btns
        processCheckFunction(recNum, "progress");
        $.post("/users/register",{
            recNum : recNum,
            dataURL : document.getElementById("save").href,
            blobData : base64,
            personName : document.getElementById("user_name").value,
            idNum : document.getElementById("student_num").value
        }, function(data, status){
            console.log("data: ", data, "status: ", status);
            //enable button
            buttonBlock(document.getElementById("regiBtn"));
            if(status == "success"){
                var user_name = document.getElementById("user_name").value;
                var user_num = document.getElementById("student_num").value;
                if(data.resCode == 1){
                    //record&store success
                    var graph_data_string = "/" + user_name + user_num + "/" + user_name + recNum + ".wav";
                    //debug graph setting
                    $("#reg_graph_" + recNum).find("iframe").attr("src", "/get-graph?file=" + graph_data_string, function ( i, val ) { return val; });
                    if(data.msg == "1good"){
                        //set btns
                        processCheckFunction(recNum, "success");

                        recNum++; recIndex++;
                        //data info set to div reg_corr_rate
                        var html_string = "";
                        $("#reg_corr_rate").html(html_string);

                    }else if(data.msg == "2good"){
                        //set btns
                        processCheckFunction(recNum, "success");

                        recNum++; recIndex++;

                        //data info set to div reg_corr_rate
                        //debug text data, second data information
                        $("#corr2").remove();
                        var html_string = "<p id='corr2'>compare 1 vs 2<br/>" +
                            "pitch rate: " + data.pitch_rate + "<br/>" +
                            "intensity rate: " + data.int_rate +"<br/>"+
                            "f2 rate: " + data.f2_rate + "<br/>" +
                            "f3 rate: " + data.f3_rate + "<br/>" +
                            "</p>";
                        $("#reg_corr_rate").append(html_string);

                    }else{ //3good
                        //set btns
                        processCheckFunction(recNum, "success");

                        recNum=0; recIndex=0;
                        $("#alertModal-reg").find("#modal_text").html("등록되셨습니다. " + document.getElementById("user_name").value + "님 반갑습니다." + "<br/>" +
                                "메인화면으로 돌아갑니다.");
                        $("#alertModal-reg").modal();
                        $("#alertModal-reg").on("hidden.bs.modal", function(){
                            if($(".debug:visible").length === 0)
                                location.replace("/");  //go to main
                        });

                        //debug text data, third data information
                        $("#corr3").remove();
                        var html_string = "<p id='corr3'>compare 2 vs 3<br/>" +
                            "pitch rate: " + data.pitch_rate + "<br/>" +
                            "intensity rate: " + data.int_rate +"<br/>"+
                            "f2 rate: " + data.f2_rate + "<br/>" +
                            "f3 rate: " + data.f3_rate + "<br/>" +
                            "</p>";
                        $("#reg_corr_rate").append(html_string);

                    }
                } else {
                    if(data.msg.indexOf("0bad") !== -1){
                        //already exist
                        $("#alertModal-reg").find("#modal_text").html("이미 등록된 사용자입니다.");
                        $("#alertModal-reg").modal();
                    } else if(data.msg.indexOf("directory") !== -1 || data.msg.indexOf("write") !== -1 || data.msg.indexOf("system") !== -1) {
                        //system error
                        $("#alertModal-reg").find("#modal_text").html("등록 중에 문제가 생겼습니다.<br/>다시 시도해주세요.(새로고침 됩니다)");
                        $("#alertModal-reg").modal();
                        $("#alertModal-reg").on("hidden.bs.modal", function(){
                            if($(".debug:visible").length === 0)
                                location.reload();  //go to main
                        });

                        //set btns
                        processCheckFunction(recNum, "fail");

                    } else {
                        $("#alertModal-reg").find("#modal_text").html("음성이 앞서 녹음한 데이터와 많이 다릅니다.<br/>다시 한번 시도해주세요.");
                        $("#alertModal-reg").modal();
                        var graph_data_string = "/" + user_name + user_num + "/" + user_name + recNum + ".wav";
                        //debug graph setting
                        $("#reg_graph_" + recNum).find("iframe").attr("src", "/get-graph?file=" + graph_data_string, function ( i, val ) { return val; });
                        $('#corr' + recNum).remove();
                        var html_string = "<p id='corr" + recNum + "'>compare" + (recNum - 1) + " vs " + (recNum) + "<br/>" +
                            "pitch rate: " + data.pitch_rate + "<br/>" +
                            "intensity rate: " + data.int_rate +"<br/>"+
                            "f2 rate: " + data.f2_rate + "<br/>" +
                            "f3 rate: " + data.f3_rate + "<br/>" +
                            "</p>";
                        $("#reg_corr_rate").append(html_string);

                        //set btns
                        processCheckFunction(recNum, "fail");
                    }
                }
            }else{
                console.log("status fail");
            }
            currblob = null;
        });
    });

}

function checkBtn(){
    //disable button
    buttonBlock(document.getElementById("checkBtn"));

    //console.log("currblob : ", currblob, currblob.length);
    var blobToBase64 = function(blob, cb) {
        var reader = new FileReader();
        reader.onload = function() {
            var dataUrl = reader.result;
            var base64 = dataUrl.split(',')[1];
            cb(base64);
        };
        reader.readAsDataURL(blob);
    };
    blobToBase64(currblob, function(base64){
        //var update = {'blob': base64};
        $.post("/users/send-attend",{
            dataURL : document.getElementById("save").href,
            blobData : base64
        }, function(data, status){
            //alert("post success, data " + data + "\nstatus: " + status);
            console.log("data: ", data, "status: ", status);
            //enable button
            buttonBlock(document.getElementById("checkBtn"));
            if(status == "success"){
                if(data.resCode == 1){
                    $("#alertModal").find("#modal_text").html("출석 체크 되었습니다. " + data.checkResult.user_name + "님 반갑습니다.");
                    $("#alertModal").modal();
                    $("#alertModal").on("hidden.bs.modal", function(){
                        if($(".debug:visible").length === 0)
                            location.replace("/");  //go to main
                    });

                    //graph iframe src setting
                    $("#check_graph_1").find("iframe").attr("src", "/get-graph?file=" + data.checkResult.data_file, function ( i, val ) { return val; });

                    $("#check_graph_2").find("iframe").attr("src", "/get-graph?file=" + data.newFile, function ( i, val ) { return val; });

                    //data info set to div check_corr_rate
                    var html_string = "매칭률 : " + data.checkResult.comp_val + "<br/>" +
                        "intensity rate: " + data.checkResult.int_rate + "<br/>" +
                        "pitch rate: " + data.checkResult.pitch_rate + "<br/>" +
                        "f2 rate: " + data.checkResult.f2_rate + "<br/>" +
                        "f3 rate: " + data.checkResult.f3_rate + "<br/>" +
                        "user: " + data.checkResult.user_name + "<br/>";
                    $("#check_corr_rate").html(html_string);

                }else{
                    //alert("record again please!");
                    $("#alertModal").find("#modal_text").html("소리가 정확하지 않습니다. 다시 한번 시도해주세요.");
                    $("#alertModal").modal();

                    //graph iframe src setting
                    $("#check_graph_1").find("iframe").attr("src", "/get-graph?file=" + data.checkResult.data_file, function ( i, val ) { return val; });

                    $("#check_graph_2").find("iframe").attr("src", "/get-graph?file=" + data.newFile, function ( i, val ) { return val; });

                    //data info set to div check_corr_rate
                    var html_string = "matching rate : " + data.checkResult.comp_val + "<br/>" +
                        "intensity rate: " + data.checkResult.int_rate + "<br/>" +
                        "pitch rate: " + data.checkResult.pitch_rate + "<br/>" +
                        "f2 rate: " + data.checkResult.f2_rate + "<br/>" +
                        "f3 rate: " + data.checkResult.f3_rate + "<br/>" +
                        "user: " + data.checkResult.user_name + "<br/>";
                    $("#check_corr_rate").html(html_string);
                }
            }else{
                console.log("status fail");
            }
            currblob = null;
        });
    });    
}

function processCheckFunction(idx, state){
    if(state === "fail"){
        if($("#wave" + idx + "_f").hasClass("disabled"))
            $("#wave" + idx + "_f").removeClass("disabled");
        $("#wave" + idx + "_f").addClass("active");

        if($("#wave" + idx + "_w").hasClass("active"))
            $("#wave" + idx + "_w").removeClass("active");
        $("#wave" + idx + "_w").addClass("disabled");

        if($("#wave" + idx + "_s").hasClass("active"))
            $("#wave" + idx + "_s").removeClass("active");
        $("#wave" + idx + "_s").addClass("disabled");
    } else if(state === "progress"){
        if($("#wave" + idx + "_f").hasClass("active"))
            $("#wave" + idx + "_f").removeClass("active");
        $("#wave" + idx + "_f").addClass("disabled");

        if($("#wave" + idx + "_w").hasClass("disabled"))
            $("#wave" + idx + "_w").removeClass("disabled");
        $("#wave" + idx + "_w").addClass("active");

        if($("#wave" + idx + "_s").hasClass("active"))
            $("#wave" + idx + "_s").removeClass("active");
        $("#wave" + idx + "_s").addClass("disabled");
    } else if(state === "success"){
        if($("#wave" + idx + "_f").hasClass("active"))
            $("#wave" + idx + "_f").removeClass("active");
        $("#wave" + idx + "_f").addClass("disabled");

        if($("#wave" + idx + "_w").hasClass("active"))
            $("#wave" + idx + "_w").removeClass("active");
        $("#wave" + idx + "_w").addClass("disabled");

        if($("#wave" + idx + "_s").hasClass("disabled"))
            $("#wave" + idx + "_s").removeClass("disabled");
        $("#wave" + idx + "_s").addClass("active");
    }
}

window.addEventListener('load', initAudio );
