
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
    	sentence datadir_text ./sound-data
	sentence dataname_text test1.wav
endform

#if sentence, add $ to tail to param_name
#if not sentence, remove 
writeFileLine: "test1-t", "first real: ", first_int
appendFileLine: "test1-t", "second real: ", second_real
appendFileLine: "test1-t", "third real: ", third_real
appendFileLine: "test1-t", "fourth real: ", fourth_real
appendFileLine: "test1-t", "book sentence: ", bool_text$
appendFileLine: "test1-t", "data_dir sentence: ", datadir_text$ + "/" + dataname_text$
appendFileLine: "test1-t", "data_name sentence: ", dataname_text$



#file write to squares.txt numbers
#for i to 100
#    appendFileLine: "squares.txt", "The square of ", i, " is ", i * i
#endfor