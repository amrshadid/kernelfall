# init's version, one command per line, typed into bash. Players read the PIDs from ps;
# the recorded run finds them with pidof, since they differ from run to run.
ps -o pid,ppid,user,stat,time,comm
kill -STOP $(pidof sleep)
kill -CONT $(pidof sleep)
cat /proc/$(pidof sleep)/status
cat /proc/$$/status
ps -o pid,stat,time,comm
kill -STOP $(pidof yes)
ps -o pid,stat,time,comm
kill $(pidof yes)
cat /proc/$(pidof yes)/status
kill -CONT $(pidof yes)
ps -o pid,stat,comm
kill $(pidof sleep)
kill 1
ps -o pid,ppid,user,stat,time,comm
