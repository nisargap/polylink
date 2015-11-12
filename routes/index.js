var express = require('express');
var diff = require('diff');
var parseFile = require('../parse-module/parse');
var rest = require('../lib/rest');
var Parse = parseFile.parseObj;

// filesystem module needed for questions/answers storage
var fs = require('fs');
var gapi = require('../lib/gapi');
var session = require('express-session');
var router = express.Router();
var indexPartials = { footer : 'footer' };
var memPartials = { memNav : 'memNav',
                    memHead : 'memHead',
                    memFooter : 'memFooter'};
var authToken = null;
String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}
Parse.User.enableUnsafeCurrentUser()
var currentUser = null;

// question answer storage
var configFile = fs.readFileSync('site_data/qa.json');
var config = JSON.parse(configFile);

// tasks storage
var tasksFile = fs.readFileSync('site_data/tasks.json');
var tasks = JSON.parse(tasksFile);
var authUser;
function authUserSessionToken(sessionToken, username){
    
    var options = {
        host: 'api.parse.com',
        port: 443,
        path: '/1/users/me',
        method: 'GET',
        headers: {
            'X-Parse-Application-Id' : parseFile.appKey,
            'X-Parse-REST-API-Key' : parseFile.restKey,
            'X-Parse-Session-Token' : sessionToken
        }      
    };
    
    rest.getJSON(options, function(statusCode, result){
        
        if(statusCode == 200){
            
            if(result.username == username){
                authUser = true;
                console.log(true);
            }
            
        }
        else {
            
            authUser = false;
            console.log(false);
            
        }
    });
    
}

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

// google apis oauth2 callback
router.get('/oauth2callback', function(req, res) {
  var code = req.query.code;
  gapi.client.getToken(code, function(err, tokens){
    authToken = tokens;
    
    
  });
 
  res.redirect('/dashboard');

});
router.get('/', function(req, res, next) {
  
  if(req.session.user != null || req.cookies.remember != null){
        res.redirect('/dashboard');
    }
  res.render('index', { title: 'polylink',
                        ready: req.flash('ready'),
                        error: req.flash('error'),
                       url: gapi.url,
                       partials : indexPartials
                      });
});

router.get('/login', function(req, res, next) {
   if(req.session.user != null || req.cookies.remember != null){
        res.redirect('/dashboard');
    }
  res.render('login', { title: 'dashboard',
                       error: req.flash('error'),
                       success: req.flash('success'),
                       partials : indexPartials
                      });
});
router.get('/dashboard', function(req,res,next) {

    if (req.session.user != null || req.cookies.remember != null) {
        
        res.render('dashboard', {title: 'dashboard',username: req.session.user, partials: memPartials});
    } else {
        // show the signup or login page
        res.redirect('login');
    }
    
    
});
router.get('/getTasks', function(req,res,next) {
    
    if(req.session.user != null || req.cookies.remember != null){
        
        var username = req.session.user;
        
        res.send(JSON.stringify(tasks[username]));
        
    }
    else {
        
        res.redirect('/login');
    }
});
router.get('/addTask', function(req,res,next) {
    
    if(req.session.user != null || req.cookies.remember != null){
        
        var username = req.session.user;
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
    if(req.session.user != null || req.cookies.remember != null){
        
        var username = req.session.user;
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
    
    if(req.session.user != null || req.cookies.remember != null){
        
        
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
    req.session.destroy();
    if(req.cookies.remember){
        // clear cookie
        res.clearCookie('remember');
    }
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
          
          //req.session.user = user.get('username').hashCode();
          req.session.user = user.getSessionToken();
          
          authUserSessionToken(user.getSessionToken(), user.getUsername());
          console.log(req.session.user);
          
          if(req.body.remember == 'on'){
              
            //console.log('cookie saved');
            var minute = 60 * 1000;
            
            res.cookie('remember', req.session.user, { maxAge: minute });
          }
          
          req.session.save();
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