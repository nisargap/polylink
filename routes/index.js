var express = require('express');
var Parse = require('../parse-module/parse');
var router = express.Router();

function isRealValue(obj){
 return obj && obj !== "null" && obj!== "undefined";
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', 
                        taken: req.flash('taken'),
                        ready: req.flash('ready'),
                        match: req.flash('match')
                      });
});


router.post('/register', function(req,res,next) {
    
    var User = Parse.Object.extend("User");
    var user = new User();
    var creds = {
        username : req.body.username,
        email: req.body.email,
        password: req.body.password,
        password_again: req.body.password_again
    }
    var numErrors  = 0;
    var query = new Parse.Query(User);
    query.equalTo("username", req.body.username);
    query.find({
        success:function(list) {
            // the object has been found!

            if(list.length != 0){
                
                req.flash('taken', 'Username already taken!');
                res.redirect('/');
//                res.redirect("/");
                ++numErrors;
            }
        },
        error: function(error) {
            // error is an instance of Parse.Error.
            console.log(error.message);
        }
    });
    
    // check if passwords match
    if(creds.password == creds.password_again && numErrors == 0){
    
        user.save(creds).then(function(object) {
            console.log("user " + creds.username + " added!");
        });

        req.flash('ready', "You are now ready to login!");
        res.redirect('/');
        
    }else {
        
        req.flash('match', "Passwords do not match!");
        ++numErrors;
    }
    if(numErrors > 0){
        res.redirect('/');
    }
});

module.exports = router;