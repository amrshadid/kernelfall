# init's version, one command per line, typed into bash.
# init started sleep as PID 401 and yes as PID 402 (level.yaml's processes:).
kill -CONT 401
cat /proc/401/status
cat /proc/$$/status
cat /proc/402/status
ps -e -o pid,stat,time,comm
kill -STOP 402
ps -e -o pid,stat,time,comm
kill 402
cat /proc/402/status
kill -CONT 402
kill 401
kill 1
ps -e -o pid,ppid,user,stat,time,comm
