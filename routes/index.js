var express = require('express');
var Parse = require('../parse-module/parse');
var router = express.Router();

function isRealValue(obj){
 return obj && obj !== "null" && obj!== "undefined";
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express',
                        ready: req.flash('ready'),
                        error: req.flash('error')
                      });
});


router.post('/register', function(req,res,next) {
    
    var user = new Parse.User();
    user.set("username", req.body.username);
    user.set("password", req.body.password);
    user.set("email", req.body.email);
    if(req.body.password == req.body.password_again){
    
        user.signUp(null, {
            success: function(user) {
                
                req.flash('ready', "You are now ready to login!");
                res.redirect('/');
                
            },
            error: function(user, error) {
                
                //req.flash('error', "Error: " + error.code + " " + error.message);
                req.flash('error', error.message);
                res.redirect('/');
            }
        });
        
    }else {
        
        req.flash('error', "passwords must match");
        res.redirect('/');
        
    }
});

module.exports = router;