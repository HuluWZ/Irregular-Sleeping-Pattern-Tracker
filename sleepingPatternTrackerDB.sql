show databases;

DROP DATABASE IF EXISTS sleepingpatterntracker;
CREATE DATABASE sleepingpatterntracker;
USE sleepingpatterntracker;

create table Users(
id int(150) primary key not null auto_increment,
username varchar(100),
email varchar(325) unique,
password varchar(255),
passwordResetToken varchar (255),
passwordResetExpires  varChar(255),
roles enum('user','admin') default'user'
);

create table sleep(
id int(150) primary key auto_increment,
userID int(150) ,
sleepTime datetime,
wakeupTime datetime,
duration varChar(255),
foreign key(userID) references users(id)
);