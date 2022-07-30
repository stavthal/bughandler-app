const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');

require('dotenv').config();


//making a new app
const app = express();


app.use(
   auth({
      authRequired: true,
      auth0Logout: true,
      issuerBaseURL: process.env.ISSUER_BASE_URL,
      baseURL: process.env.BASE_URL,
      clientID: process.env.CLIENT_ID,
      secret: process.env.SECRET
   })
)


//setting up the view engine to 'EJS'
app.set('view engine', 'ejs');

//setting up bodyParser to tap into html values
app.use(bodyParser.urlencoded({extended: true}));

//setting up express to use public folder for assets
app.use(express.static("public"));


//connecting to the MongoDB database

const mongo_database = process.env.MONGOSECRET;

mongoose.connect(mongo_database);


//making a Bug model to use for storing information
const BugModel = {
   title: {
      type: String,
   } ,
   body: {
      type: String,
   },
   status: {
      type: String ,
      default: 'Open',
   },

   author: {
      type: String,
   }
};

const Bug = mongoose.model('Bug', BugModel);




app.get('/', (req,res) => {


   if (req.oidc.isAuthenticated()) {
      const loggedUser = req.oidc.user.email;

      console.log(loggedUser);


      Bug.find({ author: loggedUser}, (err,bugs) => {
         if(!err) {
            res.render('index', {
               bugs : bugs
            });
         } else {
            res.render('/', {bugs : ""});
         }
      })
   }});



  


app.get('/bug-submit', (req,res) =>{
   res.render('bug-submit');
});

//getting the profile from openid connect

app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});



app.get('/404', (req,res) => {
   res.send('ERROR 404. PAGE NOT FOUND');
})



app.get('/bug/:bugId', (req,res) => {
   const requestedBugId = req.params.bugId;
   const loggedUser = req.oidc.user.email;



   Bug.findOne({_id: requestedBugId, author: loggedUser}, function(err,bug){
      if(err){
         console.log(err);
         res.redirect('/404');
      } else {
         res.render("bug", { bug: bug });
         
      }
   })
});


//GET METHODS FOR BUTTONS

app.get("/set-under-work/:bugId", (req,res) =>{
   
   const requestedBugId = req.params.bugId;
   const loggedUser = req.oidc.user.email;

   

   Bug.updateOne({_id: requestedBugId, author: loggedUser} , {$set: {
      status: 'Working on it' } 
      }, { upsert:true}, function(err){
         if(err) {
         console.log(err);
      } else {
         console.log("Successfully updated!");
      }
      })

   // res.redirect("/bug/" + req.params.bugId);
   res.redirect("/");


   });


app.get("/set-open/:bugId", (req,res) => {
   const requestedBugId = req.params.bugId;

   const loggedUser = req.oidc.user.email;



   Bug.updateOne({_id: requestedBugId, author: loggedUser} , {$set: {
      status: 'Open' } 
      }, { upsert:true}, function(err){
         if(err) {
         console.log(err);
      } else {
         console.log("Successfully updated!");
      }
      })

   // res.redirect("/bug/" + req.params.bugId);
   res.redirect("/");
});


app.get("/set-handled/:bugId", (req,res) => {
   const requestedBugId = req.params.bugId;
   const loggedUser = req.oidc.user.email;

   Bug.updateOne({_id: requestedBugId, author: loggedUser} , {$set: {
      status: 'Handled' } 
      }, { upsert:true}, function(err){
         if(err) {
         console.log(err);
      } else {
         console.log("Successfully updated!");
      }
      })

   // res.redirect("/bug/" + req.params.bugId);
   res.redirect('/');
})



app.get("/delete-bug/:bugId", (req,res) => {
   const requestedBugId = req.params.bugId;
   const loggedUser = req.oidc.user.email;

   var query = { _id: requestedBugId, author: loggedUser};
   console.log(query);



   Bug.deleteOne(query, function(err, obj) {
      if (err) {
         console.log(err);
      } else {
         console.log("Document deleted");
      }
   } );


   

   res.redirect("/");
})


app.get('/about', (req,res) => {
   res.render('about');
})




//POST


app.post('/bug-submit', (req,res) => {
   console.log(req.body.title);
   console.log(req.body.body);

   const loggedUser = req.oidc.user.email;

   const bug = new Bug({
      title: req.body.title,
      body: req.body.body,
      author: loggedUser
      
   });


   bug.save(function(err){
      if(!err) {
         res.redirect("/");
      }
   });


})








const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`SERVER STARTED ON ${PORT}`));
