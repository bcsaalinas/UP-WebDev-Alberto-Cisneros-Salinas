require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cookieParser = require("cookie-parser");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "basic secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/LOTR";
mongoose.set("strictQuery", true);
mongoose
  .connect(mongoUrl)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Mongo connection error:", err.message));

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  secret: String,
  googleId: String,
});

userSchema.plugin(passportLocalMongoose, {
  usernameLowerCase: true,
});

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err));
});

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackURL =
  process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback";
const googleEnabled = Boolean(googleClientId && googleClientSecret);

if (googleEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackURL,
      },
      async function (_accessToken, _refreshToken, profile, done) {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            user = await User.create({
              googleId: profile.id,
              username:
                profile.emails?.[0]?.value ||
                profile.displayName ||
                `google-${profile.id}`,
              email: profile.emails?.[0]?.value || "",
            });
          }
          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );

  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  const callbackPath = new URL(googleCallbackURL).pathname;
  app.get(
    callbackPath,
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (_req, res) {
      res.redirect("/secrets");
    }
  );
} else {
  console.warn("Google OAuth keys are not set. Google login disabled.");
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    res.cookie("sessionUser", req.user.username || "google-user", {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
    });
    return next();
  }
  res.redirect("/login");
}

app.get("/", function (req, res) {
  res.render("home.ejs", { user: req.user, googleEnabled });
});

app
  .route("/register")
  .get(function (_req, res) {
    res.render("register.ejs", { errorMessage: "" });
  })
  .post(function (req, res) {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.render("register.ejs", {
        errorMessage: "Please fill out every field.",
      });
    }

    User.register({ username, email }, password, function (err) {
      if (err) {
        return res.render("register.ejs", { errorMessage: err.message });
      }
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    });
  });

app
  .route("/login")
  .get(function (_req, res) {
    res.render("login.ejs", { errorMessage: "" });
  })
  .post(function (req, res, next) {
    passport.authenticate("local", function (err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.render("login.ejs", {
          errorMessage: "Incorrect username or password.",
        });
      }
      req.logIn(user, function (error) {
        if (error) {
          return next(error);
        }
        return res.redirect("/secrets");
      });
    })(req, res, next);
  });

app.get("/secrets", ensureAuthenticated, async function (req, res) {
  const secrets = await User.find({ secret: { $nin: [null, ""] } }).lean();
  res.render("secrets.ejs", { user: req.user, secrets });
});

app
  .route("/submit")
  .get(ensureAuthenticated, function (req, res) {
    res.render("submit.ejs", { user: req.user, errorMessage: "" });
  })
  .post(ensureAuthenticated, async function (req, res) {
    try {
      await User.findByIdAndUpdate(req.user._id, { secret: req.body.secret });
      res.redirect("/secrets");
    } catch (error) {
      res.render("submit.ejs", {
        user: req.user,
        errorMessage: "Could not save your secret right now.",
      });
    }
  });

app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.clearCookie("sessionUser");
    res.redirect("/");
  });
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Listening on port " + port);
});
