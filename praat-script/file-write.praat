
#script execute command
#praat.exe file-write.praat -20 4 0.4 0.1 no "./sound-data" "test1.wav"

#file read operate

#read command line params
form Test command line calls
    	integer first_int -20
    	real second_real 0.4
    	real third_real 0.4
    	real fourth_real 0.1
    	sentence bool_text no
    	sentence datadir_text C:\Users\test\Desktop\soundData\
	sentence dataname_text test.wav
	sentence outputdata_text test.out
endform

#if sentence, add $ to tail to param_name
#if not sentence, remove



#writeFileLine test
outputPath$ = "'datadir_text$'" + "'outputdata_text$'"
writeFileLine: "'outputPath$'", "first real: ", first_int
appendFileLine: "'outputPath$'", "second real: ", second_real
appendFileLine: "'outputPath$'", "third real: ", third_real
appendFileLine: "'outputPath$'", "fourth real: ", fourth_real
appendFileLine: "'outputPath$'", "book sentence: ", bool_text$
appendFileLine: "'outputPath$'", "data_dir sentence: ", datadir_text$ + "\" + dataname_text$
appendFileLine: "'outputPath$'", "data_name sentence: ", dataname_text$
appendFileLine: "'outputPath$'", newline$

#outLine test
outLine$ =  "f2" + tab$ + "f3" + tab$ + "duration" + newline$
outLine$ >> 'datadir_text$''outputdata_text$'
#writeInfoLine: outLine$

#.wav file read and formant test
#set max formant
maxFormant = 5500
#read file
Read from file... 'datadir_text$''dataname_text$'
#get formant
To Formant (burg)... 0.01 5 'maxFormant' 0.025 50
formant_startTime = Get start time
formant_endTime = Get end time
formant_totalTime = Get total duration
#check data use view
writeInfoLine: "start time : ", formant_startTime
appendInfoLine: "end time : ", formant_endTime
appendInfoLine: "total time : ", formant_totalTime

#formant f2, f3 get test
startTime = Get start time
endTime = Get end time
numberOfTimeSteps = (endTime - startTime) / 0.025
appendInfoLine: "numberOfTimeSteps: ", numberOfTimeSteps
appendInfoLine: "time", tab$, "f2", tab$, "f3"
for i to numberOfTimeSteps
    time = startTime + 0.025 * i
    f2 = Get value at time... 2 time Hertz Linear
    f3 = Get value at time... 3 time Hertz Linear
    appendInfoLine: fixed$ (time, 3), tab$, f2, tab$, f3, tab$
endfor
