const express = require('express');
var expressSession = require('express-session');    
const bodyParser = require('body-parser');
const ejs = require('ejs');
const multer  = require('multer')
const uniqid = require('uniqid');
const _ = require("lodash");
var MongoStore = require('connect-mongo')(expressSession);
const mongoose = require("mongoose");
var passport = require('passport');
var LocalStrategy = require('passport-local');
var User = require('./models/user');
var Ads = require('./models/ad');

// Connexion au serveur mongoose
mongoose.connect("mongodb://localhost:27017/leboncoin");

const app = express();

var upload = multer({ dest: 'public/uploads/' });

// Permet de ne pas mettre les .ejs dans les render
app.set('view engine', 'ejs');

// activation de la récupération des infos récupérer dans un formulaire
app.use(bodyParser.urlencoded({extended: true}));

// Activer la gestion de la session
app.use(expressSession({
  secret: 'thereactor09',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));

// Activer `passport`
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()); // JSON.stringify
passport.deserializeUser(User.deserializeUser()); // JSON.parse

// permet l'acces aux element du dossier public
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: false }))


// 1) Definir le schema - A faire qu'une fois
// var ads = new mongoose.Schema(
//     {
//         selection: String,
//         type : String,
//         title: String,
//         description : String,
//         price : Number,
//         city: String,
//         pseudo: String,
//         email: String,
//         phone: String,
//         photo: String
//     });
  
//   // 2) Definir le model - A faire qu'une fois
//   var Ads = mongoose.model("Ads", ads);

var limit = 15;
var nbrPages;  

// Page d'accueil
app.get('/', function(req, res){
    //var page = req.query.page;
    Ads.find({}, function(err, ads) {
        if (!err) {
            res.render("offre", {
                ads,
            });
        }       
    })
    

    // Partie avec la pagination
    // Ads.count({}, function (err, count) {
    //     if (!err) {
    //         nbrPages = Math.ceil(count/limit);
    //         Ads.find({}, function(err, ads) {
    //             if (!err) {
    //                 res.render("offre", {
    //                     ads,
    //                     nbrPages,
    //                     count
    //                 });
    //             }    
    //         }).skip(nbrPages * limit - limit).limit(limit);
    //     }
    //   });
})

// Filtres des annonces
app.get('/offres/', function(req, res){

    Ads.find({ type: "offres" }, function (err, ads) {
        if (!err) {
            res.render("offre", {
                ads,
            });
        }    
    })

    // Partie avec pagination
    // Ads.count({}, function (err, count) {
    //     if (!err) {
    //         var nbrPages = Math.ceil(count/limit);
    //         Ads.find({ type: "offres" }).find(function (err, ads) {
    //             if (!err) {
    //                 res.render("offre", {
    //                     ads,
    //                     nbrPages,
    //                     count
    //                 });
    //             }    
    //         }).skip(nbrPages * limit - limit).limit(limit);
    //     }
    // });
});

app.get('/demandes/', function(req, res){

    Ads.find({ type: "demandes" }, function (err, ads) {
        if (!err) {
            res.render("offre", {
                ads,
            });
        }    
    })


    // Partie avec la pagination
    // Ads.count({}, function (err, count) {
    //     if (!err) {
    //         nbrPages = Math.ceil(count/limit);
    //         Ads.find({type: "demandes"}, function(err, ads) {
    //             if (!err) {
    //                 res.render("offre", {
    //                     ads,
    //                     nbrPages,
    //                     count
    //                 });
    //             }    
    //         }).skip(nbrPages * limit - limit).limit(limit);
    //     }
    //   });
})

app.get('/particuliers/', function(req, res){
    Ads.count({}, function (err, count) {
        if (!err) {
            nbrPages = Math.ceil(count/limit);
            Ads.find({ selection: "particuliers" }, function(err, ads) {
                if (!err) {
                    res.render("offre", {
                        ads,
                        nbrPages,
                        count
                    });
                }    
            }).skip(nbrPages * limit - limit).limit(limit);
        }
      });
});

app.get('/professionels/', function(req, res){
    Ads.count({}, function (err, count) {
        if (!err) {
            nbrPages = Math.ceil(count/limit);
            Ads.find({ selection: "professionels" }, function(err, ads) {
                if (!err) {
                    res.render("offre", {
                        ads,
                        nbrPages,
                        count
                    });
                }    
            }).skip(nbrPages * limit - limit).limit(limit);
        }
      });
})

// Parti modification, recherche de la fiche a modifié dans la DB
app.get('/modify/:id', function(req, res){
    var id = req.params.id;

    Ads.findById(id, function (err, ads) {
        res.render('modifyAd', {
      ads
        })
    })
}); 

// Mise à jour de la fiche modifié
app.post('/modify/:id', upload.single('photo'), function(req,res){
    var selection = req.body.selection;
    var type = req.body.type;
    var title = req.body.title;
    var description = req.body.description;
    var price = req.body.price;
    var city = req.body.city;
    var pseudo = req.body.pseudo;
    var email = req.body.email;
    var phone = req.body.phone;
    var photo = req.file.filename;
    var id = req.params.id;
 
    var updateAd = {
        selection : selection,
        type : type,
        title: title,
        description : description,
        price : price,
        city: city,
        pseudo: pseudo,
        email: email,
        phone: phone,
        photo: photo
    
    };

    // recherche dans la base de donnée l'id et met à jour l'annonce correspondante
    Ads.findByIdAndUpdate(id, updateAd, {new: true}, function (err, updateAd) {
        if (err) return console.log(err);
        res.redirect("/annonce/" + id);
      });
});


// Suppression d'un fiche
app.post("/remove/:id", function(req, res){
    var id = req.params.id;
    
    // recherche dans la base de donnée l'id et supprime l'annonce correspondante
    Ads.findByIdAndRemove(id, function(err){
        res.redirect("/");
    })
    
})

// Affichage d'une annonce unique
app.get("/annonce/:id", function(req, res){
    var id = req.params.id;
    //var userId = req.cookies;
    var userid = req.user._id;

    Ads.find(userid, function(err, ads){
        console.log("user id du cookies"+ ads.user_id);
    })
    console.log("user id du cookies");
    console.log("user id du user_id" + userid);

    Ads.findById(id, function (err, ads) {
        res.render('annonce', {
            ads,
        })
        
    })
})

// Ads.find((userId), function(err, ads){
           
// })

// Récupération des infos entré dans le formulaire
app.post('/depose', upload.single('photo'), function(req,res){

    var ad = {
        selection: req.body.selection,
        type : req.body.type,
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        city: req.body.city,
        pseudo: req.body.pseudo,
        email: req.body.email,
        phone: req.body.phone,
        user_id : req.user._id

    }

console.log("user id de l'utilisateur afin de lui associer ces annonces "+ " " +ad.user_id)

    if (req.file){
        ad.photo = req.file.filename;
    }

    var newAd = new Ads(ad);

    newAd.save(function(err, obj) {
        if (err) {
          console.log("something went wrong");
        } else {
          //console.log("we just saved the new student " + obj.title);
          res.redirect("/annonce/" + newAd._id);
      }
    });
    
});

// Mise en ligne des infos du formulaire
app.get('/depose/', function(req, res){
    
    res.render('depose');
    
    }); 

// Mes annonces
app.get('/myAds/', function(req, res){
    var id = req.user._id;

    //console.log(req.users)
    
    User.find({}), function(err, user){
        if (!err) {
            console.log(user)
        }  
    }

    Ads.find({ user_id: id }, function(err, ads) {
        if (!err) {
            res.render("offre", {
                ads,
            });
        }    
    });

// Partie avec
//     Ads.count({}, function (err, count) {
//         if (!err) {
//             nbrPages = Math.ceil(count/limit);
//     Ads.find({ user_id: id }, function(err, ads) {
//         if (!err) {
//             res.render("offre", {
//                 ads,
//                 nbrPages,
//                 count
//             });
//         }    
//     }).skip(nbrPages * limit - limit).limit(limit);

// }
// });
    
}); 

// ***** Parti authentification ********//

app.get('/myAccount', function(req, res) {
    console.log("affichage du user id "+req.user._id)

    if (req.isAuthenticated()) {
      console.log("hello je suis conecté "+req.user);
      res.render('myAccount');
    } else {
      res.redirect('/offre');
    }
  });
  
  app.get('/register', function(req, res) {
    if (req.isAuthenticated()) {
      res.redirect('/myAccount');
    } else {
      res.render('register');
    }
  });
  
  app.post('/register', function(req, res) {
    // Créer un utilisateur, en utilisant le model defini
    // Nous aurons besoin de `req.body.username` et `req.body.password`
    User.register(
      new User({
        username: req.body.username,
        email: req.body.email,       
      }),
      req.body.password, // password will be hashed
      function(err, user) {
        if (err) {
          console.log(err);
          return res.render('register');
        } else {
          passport.authenticate('local')(req, res, function() {
            res.redirect('/myAccount');
          });
        }
      }
    );
    //console.log(req.sessionID)
  });
  
  app.get('/login', function(req, res) {
    if (req.isAuthenticated()) {
      res.redirect('/myAccount');
    } else {
      res.render('login');
    }
  });
  
  app.post('/login', passport.authenticate('local', {
    successRedirect: '/myAccount',
    failureRedirect: '/login'
  }));
  
  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect('/');
  });
  

app.listen(3000, () => console.log('Server is Listing!'));