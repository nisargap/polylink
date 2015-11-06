var express = require('express');
var diff = require('diff');
var Parse = require('../parse-module/parse');

// filesystem module needed for questions/answers storage
var fs = require('fs');

var router = express.Router();
var indexPartials = { footer : 'footer' };
var memPartials = { memNav : 'memNav',
                    memHead : 'memHead',
                    memFooter : 'memFooter'};
Parse.User.enableUnsafeCurrentUser()
var currentUser = null;

// question answer storage
var configFile = fs.readFileSync('site_data/qa.json');
var config = JSON.parse(configFile);

// tasks storage
var tasksFile = fs.readFileSync('site_data/tasks.json');
var tasks = JSON.parse(tasksFile);

function appendQuestion(obj){

  var questionId = obj["question"].replace(/\W/g, '');
  questionId = questionId.toLowerCase();
  config["questions"][questionId] = {"answer" : obj.answer,
                                     "actual" : obj["question"]};

  var configJSON = JSON.stringify(config);
  fs.writeFileSync('site_data/qa.json', configJSON);
    

}
function checkIfExists(question){
  
  var question = question.replace(/\W/g, '');
  question = question.toLowerCase();
  if(config["questions"][question]){
      return true;
  } else {
      return false;
  }
    
}

function setAnswer(id, answer){
    
  config["questions"][id]["answer"] = answer;
  var configJSON = JSON.stringify(config);
  fs.writeFileSync('site_data/qa.json', configJSON);
  
}

function getAnswer(question) {

  var question = question.replace(/\W/g, '');
  question = question.toLowerCase();
  return config["questions"][question]["answer"];
    
}

function getId(question){
    
  var id = question.replace(/\W/g, '');
  id = id.toLowerCase();
  return id;

}
function loggedIn() {
    
    var currentUser = Parse.User.current();
    
    if(currentUser){
        return true;
    }
    return false;
}

router.get('/', function(req, res, next) {
  if(loggedIn()){
        res.redirect('/dashboard');
    }
  res.render('index', { title: 'polylink',
                        ready: req.flash('ready'),
                        error: req.flash('error'),
                       partials : indexPartials
                      });
});

router.get('/login', function(req, res, next) {
   if(loggedIn()){
        res.redirect('/dashboard');
    }
  res.render('login', { title: 'dashboard',
                       error: req.flash('error'),
                       success: req.flash('success'),
                       partials : indexPartials
                      });
});
router.get('/dashboard', function(req,res,next) {

    var currentUser = Parse.User.current();
    if (currentUser) {
        // do stuff with the user
        console.log(currentUser.get("username"));
        res.render('dashboard', {title: 'dashboard',username: currentUser.get("username"), partials: memPartials});
    } else {
        // show the signup or login page
        res.redirect('login');
    }
    
    
});
router.get('/getTasks', function(req,res,next) {
    
    var currentUser = Parse.User.current();
    
    if(currentUser){
        
        var username = currentUser.get("username");
        
        res.send(JSON.stringify(tasks[username]));
        
    }
    else {
        
        res.redirect('/login');
    }
});
router.get('/addTask', function(req,res,next) {
    
    var currentUser = Parse.User.current();
    if(currentUser){
        
        var username = currentUser.get("username");
        var task = req.query.t;
        
        if(!tasks[username]){
            
            tasks[username] = [];
        }
        tasks[username].push(task);
        
        var tasksJSON = JSON.stringify(tasks);
        fs.writeFileSync('site_data/tasks.json', tasksJSON);
        
        
        res.send("added");
        
    }
    else {
        
        res.redirect('/login');
    }
    
});
router.get('/deleteTask', function(req,res,next) {
    
    var id = req.query.id;
    var currentUser = Parse.User.current();
    if(currentUser){
        
        var username = currentUser.get("username");
        if(id > -1){
            tasks[username].splice(id, 1);
        }else {
            res.send('invalid id');
        }
        var tasksJSON = JSON.stringify(tasks);
        fs.writeFileSync('site_data/tasks.json', tasksJSON);
        res.send('deleted');
    }
    else {
        
        res.redirect('/login');
        
    }
    
});

router.get('/question', function(req, res, next) {
    
    if(loggedIn()){
        
        
        var qAnswer = null;
        var question = req.query.q;
        var contrYes = null;
        if(question){
            
            if(!checkIfExists(question)){
               
                var question = {question: req.query.q, answer: null};
                appendQuestion(question)
                qAnswer = "Sorry we do not have an answer for that question at this time";
                contrYes = true;
                
            }
            else {
                var answer = getAnswer(question);
                
                if(answer != null){
                    qAnswer = answer;
                } else {
                    
                    qAnswer = "Sorry we do not have an answer for that question at this time";
                    contrYes = true;
                }
                
            }
        }
        
        res.render('question', {partials: memPartials, question: req.query.q, answer: qAnswer, contr: contrYes});
    } else {
        
        res.redirect('login');
    }
    
});
router.get('/logout', function(req, res,next){
    
    req.flash('success', "You have successfully logged out");
    Parse.User.logOut();
    res.redirect('/login')
    
});
// post requests
router.post('/register', function(req,res,next) {
    
    var user = new Parse.User();
    user.set("username", req.body.username);
    user.set("password", req.body.password);
    user.set("email", req.body.email);
    if(req.body.password == req.body.password_again){
    
        user.signUp(null, {
            success: function(user) {
                
                req.flash('ready', "You are now ready to login!");
                res.redirect('/dashboard');
                
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
router.post('/login', function(req,res,next) {
    Parse.User.logIn(req.body.username, req.body.password, {
      success: function(user) {
            // Do stuff after successful login.
          
          console.log("valid user!");
          res.redirect('/dashboard');
      },
      error: function(user, error) {
        // The login failed. Check error to see why.
          
          req.flash('error', error.message);
          res.redirect('/login');
      }
    });
    
});
router.post('/contribute', function(req,res,next) {
    
    var question = req.body.q;
    var answer = req.body.answer;
    var id = getId(question);
    console.log("The question ID is" + id);
    setAnswer(id, answer);
    res.redirect('/dashboard');
    
});

module.exports = router;