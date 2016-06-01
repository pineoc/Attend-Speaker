
#script execute command
#praat.exe file-write.praat "c:\Users\Administrator\Desktop\capstone\attend-speaker\sound-data\" "1464176055634t.wav" "c:\Users\Administrator\Desktop\capstone\attend-speaker\sound-data\" "1464176055634t"

#file read operate

#read command line params
form Test command line calls
    	sentence datadir_text c:\Users\Administrator\Desktop\capstone\attend-speaker\sound-data\tmp\
        sentence dataname_text 1464176055634t.wav
        sentence outputdatadir_text c:\Users\Administrator\Desktop\capstone\attend-speaker\sound-data\tmp\data\
        sentence outputdata_text 1464176055634t
endform

#if sentence, add $ to tail to param_name
#if not sentence, remove



#writeFileLine test
outputPath$ = "'outputdatadir_text$'" + "'outputdata_text$'"
writeFileLine: "'outputPath$'", "data_dir sentence: ", datadir_text$ + "\" + dataname_text$
appendFileLine: "'outputPath$'", "data_name sentence: ", dataname_text$
appendFileLine: "'outputPath$'", newline$


#.wav file read

Read from file... 'datadir_text$''dataname_text$'
soundname$ = selected$ ("Sound", 1)

#get MFCC
To MFCC... 12 0.015 0.01 100.0 100.0 0.0

#get mfcc datas (c0, each frame values)
frameNum = Get number of frames
writeInfoLine: "frameNum: ", frameNum
appendInfoLine: "fidx", tab$, "c0"
#file write to -mfcc.out
mfccOutputFile$ = "'outputPath$'" + "-mfcc.out"
writeFileLine: "'mfccOutputFile$'", "fidx", tab$, "c0"
for i to frameNum
	#coeffNum = Get number of coefficients... i
	c0 = Get c0 value in frame... i
	appendInfoLine: i, tab$, c0
	appendFileLine: "'mfccOutputFile$'", i, tab$, c0
	#for j to coeffNum
	#	val = Get value in frame... i j
	#	appendInfo: fixed$ (val,3), tab$
	#endfor
	#appendInfo: newline$
endfor



