var mongoose = require('mongoose');

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
        photo: Array,
        user_id : String
    });
  
  // 2) Definir le model - A faire qu'une fois
module.exports  = mongoose.model("Ads", ads);