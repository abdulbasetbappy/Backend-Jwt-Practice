const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const limiter = require("express-rate-limit");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const passport = require('passport');
const bcrypt = require("bcrypt");
const saltRounds = 10;
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));
app.use(helmet());
app.use(passport.initialize());

//Require Passport
require('./config/passport')

//Database
require("./config/database");
const User = require("./models/user.model");
//environment variables
require("dotenv").config();

//Limiter
app.use(
  limiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

//HomeRoute
app.get("/", (req, res) => {
  res.send("Welcome to the Home Route");
});

//RegisterRoute
app.post("/Register", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user) {
      return res.status(400).json({
        message: "User Already Exists",
      });
    }
    bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
      const newUser = new User({
        username: req.body.username,
        password: hash,
      });
      await newUser
        .save()
        .then((user) =>
          res.send({
            success: true,
            message: "User Created Successfully",
            user: {
              id: user._id,
              username: user.username,
              createdOn: user.createdOn,
            },
          })
        )
        .catch((error) => {
          res.send({
            success: false,
            message: "User is not created",
            error: error,
          });
        });
    });
  } catch (error) {
    res.send({
      success: false,
      message: "User is not created",
      error: error,
    });
  }
});

//LoginRoute
app.post("/Login", async (req, res) => {
    try{
        const user = await User.findOne({ username: req.body.username });
        if(!user){
            return res.status(401).send({
                success: false,
                message: "User Not Found",
            })
        }
        if(!bcrypt.compareSync(req.body.password, user.password)){
            return res.status(401).send({
                success: false,
                message: "Incorrect Password",
            })
        }
        const payload = {
            id: user._id,
            username: user.username,
        }
        const token = jwt.sign(payload, process.env.SECRET_KEY, {
            expiresIn: '2d',
        });
        return res.status(200).send({
            success: true,
            message: "User Logged In",
            token: "Bearer " + token,
        })
    }
    catch(error){
        res.send({
            success: false,
            message: "User is not logged in",
            error: error,
        })
    }
});

//ProfileRoute
app.get("/Profile", 
passport.authenticate('jwt',{session:false}),
(req, res) => {
  return res.status(200).send({
    success: true,
    message: "User Profile",
    user: {
      id: req.user._id,
      username: req.user.username,
    },
  });
}
);

//Route Not Found
app.use((req, res, next) => {
   res.status(404).json({
    message: "Route Not Found",
  });
});

//Server Error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something Broke on Server",
  });
});
module.exports = app;
