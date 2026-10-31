# init's walk, one command per line, typed into bash from /home/you.
cd /etc
pwd
cd ..
pwd
cd home/you
pwd
cat ../../etc/motd
mkdir /tmp/survey
mkdir /tmp/survey/maps
mkdir -p /tmp/survey/notes/old
cp /etc/motd /tmp/survey/maps/motd
cp /etc/os-release /tmp/survey/maps/
ls -i /etc/motd /tmp/survey/maps/motd
cd /tmp/survey/maps
ls -i motd
mv motd motd.old
ls -i motd.old
mv motd.old ../notes/
rm ../notes/motd.old
rmdir ../notes
rmdir ../notes/old
ls -R /tmp/survey
cd /tmp/survey
pwd
