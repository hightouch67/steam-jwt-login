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
    returnURL: 'http://localhost:3000/auth/steam/return',
    realm: 'http://localhost:3000/',
    apiKey: 'Steam Api Key'
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
});

app.listen(3000);
