const SteamStrategy = require('passport-steam').Strategy;
const passport = require('passport');
const jwt = require('jsonwebtoken');
const express = require('express');
const path = require('path');

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new SteamStrategy({
    returnURL: 'https://ongamelogin.herokuapp.com/auth/steam/return',
    realm: 'https://ongamelogin.herokuapp.com/',
    apiKey: 'B3942C1CD7D1B4E06FAEE6BE192E97BE'
  },
  (identifier, profile, done) => {
    process.nextTick(function () {
      profile.identifier = identifier;

      return done(null, {
        id: profile.id,
        name: profile.displayName
      });
    });
  }
));

const app = express();

app.use(passport.initialize());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/auth/steam', passport.authenticate('steam', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/');
});

app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }), (req, res) => {
  let token = jwt.sign({ user: req.user }, 'secret', { expiresIn: '2h' });
  res.send(`
    <script>
      window.opener.steamCallback({
        ok: true,
        token: '${token}'
      });
      window.close();
    </script>
  `)
  // res.redirect('http://localhost:3000/');
});

app.listen(8000);
