const express = require("express");
const app = express();
const DButilsAzure = require('./DButils');
const jwt = require("jsonwebtoken");


app.use(express.json());

var countryDictionary = {
    1: "Australia",
    2: "Bolivia",
    3: "China",
    4: "Denmark",
    5: "Israel",
    6: "Latvia",
    7: "Monaco",
    8: "August",
    9: "Norway",
    10: "Panama",
    11: "Switzerland",
    12: "USA"
};

secret = "secret";

app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin","*");
    res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get("/getCountries", function(req, res){
    res.send(countryDictionary);
});

app.post("/registerUser", function(req, res){

    let userName = req.body.userName;
    let pw = req.body.password;
    let fname = req.body.fname;
    let lname = req.body.lname;
    let city = req.body.city;
    let country = req.body.country;
    let email = req.body.email;
    let interests = req.body.interests;
    let questions = req.body.questions;
    let answers = req.body.answers;

    var interest_list = "";
    var questions_answers_list = "";

    for (let i = 0; i < interests.length; i++) { // Checked for one category
        let str = "(" + "'" + userName + "','" + interests[i] + "),";
        // let str = userName + ',"' + interests[i] + '",0';
        interest_list = interest_list + str;
    }
    interest_list = interest_list.substring(0, interest_list.length - 1) + ";";

    for (let i = 0; i < questions.length; i++) { // Checked for one category
        let str = "(" + "'" + userName + "','" + questions[i] + "','" + answers[i] + "'),";
        // let str = userName + ',"' + interests[i] + '",0';
        questions_answers_list = questions_answers_list + str;
    }
    questions_answers_list = questions_answers_list.substring(0, questions_answers_list.length - 1) + ";";

    console.log(interest_list);
    console.log(questions_answers_list);

    let p = DButilsAzure.execQuery("INSERT INTO Users (userName, pass, fName, lName, city, country, email)\n" +
        "VALUES ('" + userName + "','" + pw + "','" + fname + "','" + lname + "','" + city + "','" + country + "','" + email + "')" );
    p.then(function(ans1){
        p2 = DButilsAzure.execQuery("INSERT INTO UsersToCategories (userName, poiName) VALUES" + interest_list);
        p2.then(function(ans2){
            if(ans2.length === 0) {
                p3 = DButilsAzure.execQuery("INSERT INTO SecurityQuestions (userName, question, answer) VALUES" + questions_answers_list);
                p3.then(function (ans3) {
                    res.send(ans2);
                });
            }
        });
    });
});

app.use('/auth', function(req,res,next){
    const token = req.header('x-auth-token');
    if(!token){
        res.status(401).send("Access is denied. No token was provided");
    }
    try{
        const decoded = jwt.verify(token, secret);
        req.decoded = decoded;
        next();
    }   catch(exception){
        res.status(400).send("Invalid Token.");
    }
});

app.get('/auth/nizo', function(req,res){
   res.send('nizo');
});

app.post("/login", (req, res) => {
    let userName = req.body.userName;
    let pw = req.body.password;

    let p = DButilsAzure.execQuery("SELECT pass FROM Users WHERE userName = '" + userName + "'");

    p.then(function(ans){
       if(ans.length > 0){
           if(ans[0].pass === pw){
               payload = {id: userName};
               options = {expiresIn: "1d"};
               const token = jwt.sign(payload, secret, options);
               res.send(token);
           }
           else{
               res.send("Password is incorrect.");
           }
       }
       else{
           res.send("User not found in DB.");
       }
    });
});

const port = process.env.PORT || 3000; //environment variable
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

app.get("/restorePassword/:userName/:answer/:question", function(req,res){
    let userName = req.params.userName;
    let answer = req.params.answer;
    let question = req.params.question + "?";
    console.log(question);
    let query = "SELECT answer FROM SecurityQuestions WHERE userName = '"+ userName + "' AND question = '" + question + "'";
    let p = DButilsAzure.execQuery(query);

    p.then(function(ans1){
        if(ans1.length === 1){
            if(ans1[0].answer == answer){
                let p2 = DButilsAzure.execQuery("SELECT pass FROM Users WHERE userName = '"+ userName + "'");
                p2.then(function(ans2){
                    res.send(ans2);
                })
            }
        }
    });
});

app.get("/getUserCategories/:userName", function(req,res){
    let userName = req.params.userName;
    let p = DButilsAzure.execQuery("SELECT categoryName FROM UsersToCategories WHERE userName = '" + userName + "'");
    p.then(function(ans){
        res.send(ans);
    })
});

app.get("/getUserSecurityQuestions/:userName", function(req,res){
    let userName = req.params.userName;
    let p = DButilsAzure.execQuery("SELECT question FROM SecurityQuestions WHERE userName = '" + userName + "'");
    p.then(function(ans){
        res.send(ans);
    })
});

app.get("/getRandomPOI/:number", function(req,res){ // Checked
    let numOfPois = req.params.number;
    let p =  DButilsAzure.execQuery("SELECT TOP " + numOfPois + " * FROM POIs\n" +
        "ORDER BY NEWID()");
    p.then(function(result){
        res.send(result)
    });
});

app.get("/auth/getUserFavoriteInterests/:userName", function(req,res){
    let userName = req.params.userName;

    let p = DButilsAzure.execQuery("SELECT * FROM UsersToPOIs WHERE userName = '" + userName + "' AND isFavourite = 1");

    p.then(function(ans){
        let poiNames = "(";
        for(let i=0; i < ans.length; i++){
            poiNames = poiNames + "'" + ans[i].poiName +"',";
        }
        poiNames = poiNames.substring(0, poiNames.length - 1) + ")";

        let p2 = DButilsAzure.execQuery("SELECT * FROM POIs WHERE poiName in " + poiNames);

        p2.then(function(ans2){
            res.send(ans2);
        });
    });
});

app.get("/auth/getUserInterests", function(req,res){
    let userName = req.body.userName;

    let p = DButilsAzure.execQuery("SELECT * FROM UsersToPOIs WHERE userName = '" + userName + "'");

    p.then(function(ans){
        // res.send(ans);
        let poiNames = "(";
        for(let i=0; i < ans.length; i++){
            poiNames = poiNames + "'" + ans[i].poiName +"',";
        }
        poiNames = poiNames.substring(0, poiNames.length - 1) + ")";

        let p2 = DButilsAzure.execQuery("SELECT * FROM POIs WHERE poiName in " + poiNames);

        p2.then(function(ans2){
           res.send(ans2);
        });
    })
});

app.get("/getInterestsByCategories", function(req,res) {
    let cats = req.body.categories;
    var i;
    var list = "(";
    for (i = 0; i < cats.length; i++) { // Checked for one category
        list = list + "'" + cats[i] +"',";
    }
    list = list.substring(0, list.length - 1) + ")";
    let p = DButilsAzure.execQuery('SELECT * FROM POIs WHERE categoryName in ' + list);

    p.then(function(ans){
        res.send(ans);
    });
});


app.get("/getInterestRank/:poiName", function(req,res){
    let poiName = req.params.poiName;

    let p = DButilsAzure.execQuery("SELECT AVG(reviewRank) AS average FROM Reviews WHERE poiName = '" + poiName + "'");

    p.then(function(ans){
       res.send(ans);
    });
});

app.get("/getInterestByName/:poiName", function(req,res){
    let poiName = req.params.poiName;

    let p = DButilsAzure.execQuery("SELECT * FROM POIs WHERE poiName = '" + poiName + "'");

    p.then(function(ans){
       res.send(ans);
    });
});

app.post("/auth/addInterestToFavorites", function(req,res){
    let poiName = req.body.poiName;
    let userName = req.body.userName;
    // p2 = DButilsAzure.execQuery("INSERT INTO UsersToPOIs (userName, poiName, isFavourite) VALUES" + interest_list);


    let p = DButilsAzure.execQuery("SELECT * FROM UsersToPOIs WHERE poiName = '" + poiName + "' AND userName = '" + userName + "'");

    p.then(function(ans){
       if(ans.length === 0){      // User hasn't saved given interest - just update.
           let p2 = DButilsAzure.execQuery("INSERT INTO UsersToPOIs (userName, poiName, isFavourite) VALUES ('" + userName + "','" + poiName + "','" + 1 +"')" );
           p2.then(function (ans2) {
              res.send(ans2);
           });
       }
       else{                    // User already saved given interest - insertion.
           let p2 = DButilsAzure.execQuery("UPDATE UsersToPOIs SET isFavourite = 1 WHERE userName = '" + userName + "' AND poiName = '" + poiName + "'");
           p2.then(function (ans2) {
               res.send(ans2);
           });
       }
    });

});

app.post("/auth/removeInterestFromFavorites", function(req,res){
    let poiName = req.body.poiName;
    let userName = req.body.userName;

    let p = DButilsAzure.execQuery("DELETE FROM UsersToPOIs WHERE userName = '" + userName + "' AND poiName = '" + poiName + "'");

    p.then(function(ans){
       res.send(ans)
        //TODO: maybe send "success"?
    });
});

app.get("/auth/getNumberOfFavorites/:userName", function(req,res){
    let username = req.params.userName;
    let p = DButilsAzure.execQuery("SELECT COUNT(*) AS count FROM UsersToPOIs WHERE userName = '" + username + "' AND isFavourite = '" + 1 + "'");
    p.then(function(ans){
        if(ans.length > 0){
            res.send(ans);
        }
    });
});

// app.post("/auth/saveFavorites", function(req,res){
//  // TODO: user addInterestToFavorites
// });

app.put("/auth/setRankToInterest", function(req,res){
    let rank = req.body.reviewRank;
    let reviewID = req.body.reviewID;

    let p = DButilsAzure.executeQuery("UPDATE Reviews\n" +"SET reviewRank = " + rank + "\n" +"WHERE ID = " + reviewID + ";");

    p.then(function(ans){
        res.send(ans);
    });
});


app.post("/auth/addReview", function(req,res){
   let poiName = req.body.poiName;
   let description = req.body.reviewDescription;
   let rank = req.body.reviewRank;

   let p = DButilsAzure.execQuery("INSERT INTO Reviews (poiName, reviewDescription, reviewRank)\n" +
       "VALUES ('" + poiName + "','" + description + "','" + rank +"')");

   p.then(function(ans1){
      p2 = DButilsAzure.execQuery("SELECT MAX(reviewID) AS LastID FROM Reviews");
      p2.then(function(ans2){
         if(ans2.length > 0){
             p3 = DButilsAzure.execQuery("INSERT INTO POIsToReview (poiName, reviewID)\n" +
                 "VALUES ('" + poiName + "','" + ans2[0].LastID + "')");
             p3.then(function(ans3){
                 res.send(ans3);
             })
         }
         else{
             res.send("No reviewID found.");
         }
      });
   });
});


app.get("/getReviews", function(req,res){
    let poiName = req.body.poiName;
    let p = DButilsAzure.execQuery("SELECT * FROM Reviews WHERE poiName = '" + poiName + "'");
    p.then(function(ans){
        if(ans.length > 0) {
            res.send(ans)
        }
        else{
            res.send("No reviews found.");
        }
    });
});




