const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const multer  = require('multer')
const uniqid = require('uniqid');
const _ = require("lodash");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/leboncoin");
const app = express();

var upload = multer({ dest: 'public/uploads/' });


app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: false }))


// 1) Definir le schema - A faire qu'une fois
var ads = new mongoose.Schema(
    {
        selection: String,
        type : String,
        title: String,
        description : String,
        price : Number,
        city: String,
        pseudo: String,
        email: String,
        phone: String,
        photo: String
    });
  
  // 2) Definir le model - A faire qu'une fois
  var Ads = mongoose.model("Ads", ads);

var limit = 2;

// Page d'accueil
app.get('/', function(req, res){
    var page = req.query.page;
    Ads.count({}, function (err, count) {
        if (!err) {
            Ads.find({}, function(err, ads) {
                if (!err) {
                console.log(page);
                    res.render("offre.ejs", {
                        ads,
                        page,
                        count
                    });
                }    
            }).skip(page * limit - limit).limit(limit);
        }
      });
})

// Filtres des annonces
app.get('/offres/', function(req, res){
    Ads.find({ type: "offres" }).find(function (err, ads) {
        res.render('offre.ejs', {
      ads,
        });
    });
});

app.get('/demandes/', function(req, res){
    Ads.find({ type: "demandes" }).find(function (err, ads) {
        res.render('offre.ejs', {
      ads,
        })
    })
})

app.get('/particuliers/', function(req, res){
    Ads.find({ selection: "particuliers" }).find(function (err, ads) {
        res.render('offre.ejs', {
      ads,
        });
    });
});

app.get('/professionels/', function(req, res){
    Ads.find({ selection: "professionels" }).find(function (err, ads) {
        res.render('offre.ejs', {
      ads,
        })
    })
})

// Parti modification, recherche de la fiche a modifié dans la DB
app.get('/modify/:id', function(req, res){
    var id = req.params.id;

    Ads.findById(id, function (err, ads) {
        res.render('modifyAd.ejs', {
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

    Ads.findByIdAndUpdate(id, updateAd, {new: true}, function (err, updateAd) {
        if (err) return console.log(err);
        // console.log( "Dans le findByIdUpdate la creation du updateAd "+id)
        res.redirect("/annonce/" + id);
      });
});


// Suppression d'un fiche
app.post("/remove/:id", function(req, res){
    var id = req.params.id;
    
    Ads.findByIdAndRemove(id, function(err){
        //console.log("remove test " + " " + id)
        res.redirect("/");
    })
    
})

// Affichage d'une annonce unique
app.get("/annonce/:id", function(req, res){
    var id = req.params.id;

    Ads.findById(id, function (err, ads) {
          res.render('annonce.ejs', {
        ads,
        })
    })
})


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
        phone: req.body.phone

    }

    if (req.file){
        ad.photo = req.file.filename;
    }

    //console.log(ad.type)

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
    
    res.render('depose.ejs');
    
    }); 

// Fonction de validation du formulaire

// (function() {
//     'use strict';
//     window.addEventListener('load', function() {
//       // Fetch all the forms we want to apply custom Bootstrap validation styles to
//       var forms = document.getElementsByClassName('needs-validation');
//       // Loop over them and prevent submission
//       var validation = Array.prototype.filter.call(forms, function(form) {
//         form.addEventListener('submit', function(event) {
//           if (form.checkValidity() === false) {
//             event.preventDefault();
//             event.stopPropagation();
//           }
//           form.classList.add('was-validated');
//         }, false);
//       });
//     }, false);
//   })();



app.listen(3000, () => console.log('Server is Listing!'));



// var newAd = new Ads({
//     title: "Bras essuie glace",
//     description : "Equipement voiture mégane",
//     price : 20,
//     city: "Saint-Just-en-Chaussée",
//     pseudo: "Jo",
//     email: "youssefattia@gmail.com",
//     phone: "0695908756",
//     photo: "lbc_bras_essuie_glace.jpg"

// });

// newAd.save(function(err, obj) {
// if (err) {
//   console.log("something went wrong");
// } else {
//   console.log("we just saved the new student " + obj.title);
// }
// });

// var newAd1 = new Ads({
// title: "Gps volkswagen",
// description : "Equipement voiture golf 2017",
// price : 380,
// city: "Saint-Georges-sur-Baulche",
// pseudo: "Jo",
// email: "youssef@gmail.com",
// phone: "0014567892",
// photo: "lbc_gps.jpg"

// });
// newAd1.save(function(err, obj) {
//     if (err) {
//       console.log("something went wrong");
//     } else {
//       console.log("we just saved the new student " + obj.title);

//       Ads.find({}, function(err, ads) {
//         if (!err) {
//          // console.log(ads);
//         }
//     });
//   }
// });
