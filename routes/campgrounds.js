var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware"); // Because the file inside middleware called "index.js", it automatically takes it and there is no need to specify explicitly: middleware/index.js
var geocoder = require("geocoder");

// ========================
// CAMPGROUNDS ROUTES
// ========================

// INDEX - show all campgrounds
router.get("/campgrounds", function(req, res){
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        }
        else{
            res.render("campgrounds/index", {campgrounds: allCampgrounds, currentUser: req.user, page: "campgrounds"});
        }
    });
});

// CREATE - add new campground to DB
router.post("/campgrounds", middleware.isLoggedIn, function(req, res){
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var desc = req.body.description;
    var author = 
        {
            id: req.user._id,
            username: req.user.username
        };
    geocoder.geocode(req.body.location, function(err, data){
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;
        var newCampGround = {name: name, price: price, image: image, description: desc, author: author, location: location, lat: lat, lng: lng};
        
        // Create a new campgroud and save to DB
        Campground.create(newCampGround, function(err, newlyCreated){
            if(err){
                console.log(err);
            }
            else{
                res.redirect("/campgrounds");
            }
        });
    });
});

// NEW - show form to create campground
router.get("/campgrounds/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new") ;
});


// SHOW - shows more info about one campground
router.get("/campgrounds/:id", function(req, res){
    // Find the campground with provided ID and 
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || foundCampground == undefined){
            console.log(err);
            req.flash('error', 'Sorry, that campground does not exist!');
            return res.redirect('/campgrounds');
        }
        console.log(foundCampground);
        // render the show template with that campground
        res.render("campgrounds/show", {campground: foundCampground});
    });
});


// EDIT CAMPGROUND ROUTE
router.get("/campgrounds/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || foundCampground == undefined){
            console.log(err);
            req.flash('error', 'Sorry, that campground does not exist!');
            return res.redirect('/campgrounds');
        }
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});


// UPDATE CAMPGROUND ROUTE
router.put("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req, res){
    geocoder.geocode(req.body.location, function(err, data){
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;
        var newData = {name: req.body.name, image: req.body.image, description: req.body.description, price: req.body.price, location: location, lat: lat, lng: lng};
        Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, campground){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success","Successfully Updated!");
                res.redirect("/campgrounds/" + campground._id);
            }
        });
    });
});


// DELETE CAMPGROUND ROUTE
router.delete("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req, res){
   Campground.findByIdAndRemove(req.params.id, function(err){
       if(err){
           res.redirect("/campgrounds");
       }
       else{
           res.redirect("/campgrounds");
       }
   });
});

module.exports = router;

