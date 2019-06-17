DROP TABLE UsersToPOIs
DROP TABLE SecurityQuestions
DROP TABLE POIsToReview
DROP TABLE Reviews
DROP TABLE Users
DROP TABLE POIs
DROP TABLE Categories

CREATE TABLE Users
(
	userName varchar(10) primary key not null,
	CONSTRAINT userNameLength CHECK (DATALENGTH(userName) >= 3 and DATALENGTH(userName) <= 8),
	pass varchar(10) not null,
	CONSTRAINT passLength CHECK (DATALENGTH(pass) >= 5 and DATALENGTH(pass) <= 10),
	fName varchar(50) not null,
	CONSTRAINT fname CHECK(fName not like '%[^a-zA-Z]%'),
	lName varchar(50) not null,
	CONSTRAINT lName CHECK(lName not like '%[^a-zA-Z]%'),
	city varchar(50) not null,
	country varchar(50) not null,
	email varchar(50) not null,
	CONSTRAINT email CHECK(email like '%@%' and email like '%.%'),
	UNIQUE (userName)
);


CREATE TABLE Categories
(
	categoryName nvarchar(50) primary key not null,
	UNIQUE (categoryName)
);


CREATE TABLE POIs
(
	poiName varchar(50) primary key  not null,
	CONSTRAINT name CHECK(poiName not like '%[^a-zA-Z]%'),
	image varbinary(max),
	viewsNum integer DEFAULT 0,
	lastReviewID integer DEFAULT -1,
	beforeLastReviewID integer DEFAULT -1,
	poiRank float DEFAULT 0, 
	categoryName nvarchar(50) foreign key references Categories(categoryName) ON UPDATE CASCADE ON DELETE no action,
	UNIQUE (poiName)
);

CREATE TABLE UsersToPOIs
(
	primary key CLUSTERED ( userName, poiName ),
	userName varchar(10) foreign key references Users(userName) ON UPDATE CASCADE ON DELETE no action,
	poiName varchar(50) foreign key references POIs(poiName) ON UPDATE CASCADE ON DELETE no action,
	isFavourite BIT DEFAULT 0
);

CREATE TABLE UsersToCategories(
	primary key CLUSTERED ( userName, categoryName ),
	userName varchar(10) foreign key references Users(userName) ON UPDATE CASCADE ON DELETE no action,
	categoryName nvarchar(50) foreign key references Categories(categoryName) ON UPDATE CASCADE ON DELETE no action,
);

CREATE TABLE Reviews
(
	reviewID integer primary key not null IDENTITY,
	poiName varchar(50) not null,
	reviewDescription nvarchar(max),
	reviewRank integer not null,
	CONSTRAINT reviewRank CHECK(reviewRank >= 1 and reviewRank <= 5),
);

CREATE TABLE SecurityQuestions
(
	ID integer primary key not null IDENTITY,
	userName varchar(10) foreign key references Users(userName) not null,
	question nvarchar(100) not null,
	answer nvarchar(100) not null,
	UNIQUE (ID)
);


CREATE TABLE POIsToReview
(
	primary key CLUSTERED ( poiName, reviewID ),
	poiName varchar(50) foreign key references POIs(poiName) ON UPDATE CASCADE ON DELETE no action,
	reviewID integer foreign key references Reviews(reviewID) ON UPDATE CASCADE ON DELETE no action,
);


INSERT INTO Categories (categoryName)
VALUES ('historic')

INSERT INTO POIs (poiName, image, viewsNum, lastReviewID, beforeLastReviewID, categoryName)
VALUES ('merkazhanegev', NULL , 100, 2, 1, 'historic')

INSERT INTO Users (userName, pass, fName, lName, city, country, email)
VALUES ('chen', 'barvaz','chen', 'yanai', 'beersheva', 'israel', 'chen@gmail.com')

INSERT INTO Users (userName, pass, fName, lName, city, country, email)
VALUES ('nitzan', 'sOOki', 'nitzan', 'maarek', 'beersheva', 'israel', 'nitzan@gmail.com')

INSERT INTO Categories (categoryName)
VALUES ('food')

INSERT INTO POIs (poiName, image, viewsNum, lastReviewID, beforeLastReviewID, categoryName)
VALUES ('abudhabi', NULL , 150, 5, 6, 'food')