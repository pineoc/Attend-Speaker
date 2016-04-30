
#script execute command
#praat.exe file-write.praat "c:\Users\Administrator\Desktop\capstone\attend-speaker\sound-data\" "test1.wav" "c:\Users\Administrator\Desktop\capstone\attend-speaker\sound-data\" "text1.out"

#file read operate

#read command line params
form Test command line calls
    	sentence datadir_text c:\Users\Administrator\Desktop\capstone\attend-speaker\sound-data\
        sentence dataname_text test1.wav
        sentence outputdatadir_text c:\Users\Administrator\Desktop\capstone\attend-speaker\sound-data\
        sentence outputdata_text test1.out
endform

#if sentence, add $ to tail to param_name
#if not sentence, remove



#writeFileLine test
outputPath$ = "'outputdatadir_text$'" + "'outputdata_text$'"
writeFileLine: "'outputPath$'", "data_dir sentence: ", datadir_text$ + "\" + dataname_text$
appendFileLine: "'outputPath$'", "data_name sentence: ", dataname_text$
appendFileLine: "'outputPath$'", newline$

#.wav file read and formant test
#set max formant
maxFormant = 5500
#read file
Read from file... 'datadir_text$''dataname_text$'
soundname$ = selected$ ("Sound", 1)

#get formant
To Formant (burg)... 0.01 5 'maxFormant' 0.025 50

#formant get data f2, f3
startTime = Get start time
endTime = Get end time
numberOfTimeSteps = (endTime - startTime) / 0.01
appendInfoLine: "numberOfTimeSteps: ", numberOfTimeSteps
appendInfoLine: "time", tab$, "f2", tab$, "f3"
for i to numberOfTimeSteps
    time = startTime + 0.01 * i
    f2 = Get value at time... 2 time Hertz Linear
    f3 = Get value at time... 3 time Hertz Linear
    #appendInfoLine: fixed$ (time, 3), tab$, fixed$ (f2, 3), tab$, fixed$ (f3, 3)
endfor

#2 newline
appendInfoLine: newline$, newline$

#get pitch

appendInfoLine: "soundname : ", soundname$

select Sound 'soundname$'
To Pitch... 0.0 75.0 600.0

#get pitch datas
appendInfoLine: "time", tab$, "pitch"
for i to numberOfTimeSteps
	time = startTime + 0.01 * i
	pitch = Get value at time... time Hertz Linear
	appendInfoLine: fixed$ (time, 3), tab$, fixed$ (pitch, 3)
endfor
	



