
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
    	sentence datadir_text c:\Users\Administrator\Desktop\capstone\attend-speaker\sound-data\
	sentence dataname_text test1.wav
	sentence outputdata_text test1.out
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
#intstart = Get first formant...1



#file write to squares.txt numbers
#for i to 100
#    appendFileLine: "squares.txt", "The square of ", i, " is ", i * i
#endfor