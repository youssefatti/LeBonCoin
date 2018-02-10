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

app.use(bodyParser.urlencoded({ extended: false }));

var limit = 11;
var nbrPages;  

// Page d'accueil
app.get('/', function(req, res){
    // Recupération de la page en cours pour la pagination
    var currentPage = parseInt(req.query.page); // Le parseInt permet de convertir en entier une string, utile pour le calcul de la page suivante et précedente 
    var type = req.query.type;// Récupération du type d'annonce, OFFRES ou DEMANDES
    
    //Partie avec la pagination
    Ads.count({}, function (err, count) { // Count permet de récupérer le nombre total d'annonce
        if (!err) {
            // Calcul du nombre de page
            nbrPages = Math.ceil(count/limit);
            if(!req.query.type && !req.query.selection){
                Ads.find({}, function(err, ads) {
                    if (!err) {
                        res.render("home", {
                            ads,
                            nbrPages,
                            currentPage,
                            type
                        });
                    }    
                }).skip(currentPage * limit - limit).limit(limit); // Afichage de la page en cours avec le bon nombre d'annonce
            //console.log("pas de type")
            }
            else if (req.query.type){
                //console.log("il y a un type")
                //var type = req.query.type;
                console.log(type)
                Ads.count({type : type}, function (err, count) { // Count permet de récupérer le nombre total d'annonce
                    if (!err) {
                        // Calcul du nombre de page
                        nbrPages = Math.ceil(count/limit);
                        Ads.find({type : type}, function(err, ads) {
                            if (!err) {
                                res.render("home", {
                                ads,
                                nbrPages,
                                currentPage,
                                type
                                });
                            }    
                        }).skip(currentPage * limit - limit).limit(limit); // Afichage de la page en cours avec le bon nombre d'annonce    
                    }
                });
            }
        }
    });
})

app.get('/particuliers/', function(req, res){
    Ads.find({ selection: "particuliers" }, function(err, ads) {
            if (!err) {
                res.render("home", {
                    ads,
                });
            }    
        })

    // Ads.count({}, function (err, count) {
    //     if (!err) {
    //         nbrPages = Math.ceil(count/limit);
    //         Ads.find({ selection: "particuliers" }, function(err, ads) {
    //             if (!err) {
    //                 res.render("home", {
    //                     ads,
    //                     nbrPages,
    //                     count
    //                 });
    //             }    
    //         }).skip(nbrPages * limit - limit).limit(limit);
    //     }
    //   });
});

app.get('/professionels/', function(req, res){
    Ads.find({ selection: "professionels" }, function(err, ads) {
        if (!err) {
            res.render("home", {
                ads,
            });
        }    
    })
    // Ads.count({}, function (err, count) {
    //     if (!err) {
    //         nbrPages = Math.ceil(count/limit);
    //         Ads.find({ selection: "professionels" }, function(err, ads) {
    //             if (!err) {
    //                 res.render("home", {
    //                     ads,
    //                     nbrPages,
    //                     count
    //                 });
    //             }    
    //         }).skip(nbrPages * limit - limit).limit(limit);
    //     }
    //   });
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
app.post('/modify/:id', upload.fields('photo', 3), function(req,res){
    var selection = req.body.selection;
    var type = req.body.type;
    var title = req.body.title;
    var description = req.body.description;
    var price = req.body.price;
    var city = req.body.city;
    var pseudo = req.body.pseudo;
    var email = req.body.email;
    var phone = req.body.phone;
    var photo = req.files.filename;
    var id = req.params.id;
    //var user_id = ads.user_id;

    console.log(photo); 
 
    Ads.findById(id, function(err, ads){
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
            photo: photo,
            user_id: ads.user_id
        };
        if (req.isAuthenticated()) {
            if (ads.user_id == req.user._id){
                Ads.findByIdAndUpdate(id, updateAd, {new: true}, function (err, updateAd) {
                        if (err) return console.log(err);
                        res.redirect("/annonce/" + id);
                        console.log("Annonce modifié"+ads.user_id);
                      });
            }
        }
        
    })
});

// Suppression d'un fiche
app.post("/remove/:id", function(req, res){
    var id = req.params.id;
    var userid = req.user._id;
    
    // recherche dans la base de donnée l'id et supprime l'annonce correspondante
    console.log("verification si user egale a l'annonce"+userid)
    Ads.findById(id, function(err,ads){
        if (req.isAuthenticated()) {
            if (ads.user_id == userid){
                console.log("Authentifié et proprio de l'annonce");
            }
          } 
        console.log(ads.user_id)
        res.redirect("/");
    })
    
})

// Affichage d'une annonce unique
app.get("/annonce/:id", function(req, res){
    var id = req.params.id;
    //var user_id = req.user_id;
    if (!req.user) var userid = null
    if (req.user) var userid = req.user._id
    
    Ads.findById(id, function (err, ads) {
        console.log(ads)
        res.render('annonce', {
            ads,
            userid
        })  
    })
})

// Récupération des infos entré dans le formulaire
app.post('/depose', upload.array('photo', 3), function(req,res){
    // Dans le cas ou il n'est pas enregistré, il crée son compte
            
    var ad = {
        selection: req.body.selection,
        type : req.body.type,
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        city: req.body.city,
        pseudo: req.body.pseudo,
        email: req.body.email,
        phone: req.body.phone
        //user_id : user._id avoir a metre si pas de user
        //user_id : req.user._id
    }
    

    if (req.files){
        var photo =[];
        var length = req.files; 
        for(var i=0; i<length.length; i++){
            photo.push(req.files[i].filename);        
        }
        ad.photo = photo;        
    }


    var newAd = new Ads(ad);
    
    newAd.save(function(err, obj) {
        if (err) {
        console.log("something went wrong");
        } else {
            //console.log(newAd._id)
            res.redirect("/annonce/" + newAd._id);
            }
    });    
});

// Mise en ligne des infos du formulaire
app.get('/depose/', function(req, res){
    var isLogin = req.isAuthenticated();
    //console.log(requ);
    // S'excute quand je click sur le bouton déposer une annonce et renvoi vers le fichier depose
  
    //console.log("hello")
    res.render('depose', {
        isLogin
    });
    
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
            res.render("home", {
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
//             res.render("home", {
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
      res.redirect('/home');
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