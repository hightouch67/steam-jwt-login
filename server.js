
const express = require('express')
const app = express()
const port = process.env.PORT || 4000

var session = require('express-session');



// ```
// 
// Lastly, configure this session manager and tell our Express server to
// use it.  We're going to pass a few options as we finally initialize our
// session manager.
// 
// First, we'll pass it a newly instantiated Firebase session manager that
// talks to our Firebase database.  Second, we'll need to choose a secret key to
// encrypt your session information to keep it safe.  This can be anything;
// it's basically a password that the session manager will use to encrypt stored
// session information and decrypt retrieved session information.
// 
// Third and fourth, we need to specify some required options.  These required
// options are somewhat specific to our application and database.  The `resave`
// option, if true, tells the session manager to store session information even
// if it hasn't been changed.  The `saveUninitialized` option tells the session
// manager to save brand new sessions even if they haven't been modified yet.
// You can read about more options in the [express-session docs].
// 
// [express-session docs]: https://github.com/expressjs/session
// 
// ```js

app.use(session({
    secret: 'YOURSESSIONSECRETKEY', // Change this to anything else
    resave: false,
    saveUninitialized: true
}));

// ```
// 
// Alright, we have sessions.  In your routes, you can now read and write to
// request.session and the values will persist between HTTP requests for this
// particular client.  The client will lose the session if they clear cookies.
// None of the data you set in `request.session` actually comes from the
// client!  It's stored in your Firebase database; the client merely sends the
// session ID with each request.  Our session manager populates the
// `request.session` object for us.
// 
// Sessions are useful on their own, but all of this was merely a pre-requiste
// OpenID.
//

var OpenIDStrategy = require('passport-openid').Strategy;
var SteamStrategy = new OpenIDStrategy({
        // OpenID provider configuration
        providerURL: 'http://steamcommunity.com/openid',
        stateless: true,
        // How the OpenID provider should return the client to us
        returnURL: 'https://ongamelogin.herokuapp.com:4000/auth/openid/return',
        realm: 'https://localhost:4000',
    },
    // This is the "validate" callback, which returns whatever object you think
    // should represent your user when OpenID authentication succeeds.  You
    // might need to create a user record in your database at this point if
    // the user doesn't already exist.
    function(identifier, done) {
        // The done() function is provided by passport.  It's how we return
        // execution control back to passport.
        // Your database probably has its own asynchronous callback, so we're
        // faking that with nextTick() for demonstration.
        process.nextTick(function () {
            // Retrieve user from Firebase and return it via done().
            var user = {
                identifier: identifier,
                // Extract the Steam ID from the Claimed ID ("identifier")
                steamId: identifier.match(/\d+$/)[0]
            };
            // In case of an error, we invoke done(err).
            // If we cannot find or don't like the login attempt, we invoke
            // done(null, false).
            // If everything went fine, we invoke done(null, user).
            return done(null, user);
        });
    });


var passport = require('passport');
passport.use(SteamStrategy);


passport.serializeUser(function(user, done) {
    done(null, user.identifier);
});

passport.deserializeUser(function(identifier, done) {
    // For this demo, we'll just return an object literal since our user
    // objects are this trivial.  In the real world, you'd probably fetch
    // your user object from your database here.
    done(null, {
        identifier: identifier,
        steamId: identifier.match(/\d+$/)[0]
    });
});


app.use(passport.initialize());
app.use(passport.session());

app.post('/auth/openid', passport.authenticate('openid'));

app.get('/auth/openid/return', passport.authenticate('openid'),
    function(request, response) {
        if (request.user) {
            response.redirect('/?steamid=' + request.user.steamId);
        } else {
            response.redirect('/?failed');
        }
});

app.post('/auth/logout', function(request, response) {
    request.logout();
    // After logging out, redirect the user somewhere useful.
    // Where they came from or the site root are good choices.
    response.redirect(request.get('Referer') || '/')
});

app.get('/', function(request, response) {
    response.write('<!DOCTYPE html>')
    if (request.user) {
        response.write(request.session.passport &&
            JSON.stringify(request.user) || 'None');
        response.write('<form action="/auth/logout" method="post">');
        response.write('<input type="submit" value="Log Out"/></form>');
    } else {
        if (request.query.steamid) {
            response.write('Not logged in.');
        }
        response.write('<form action="/auth/openid" method="post">');
        response.write(
            '<input name="submit" type="image" src="http://steamcommunity-a.' +
            'akamaihd.net/public/images/signinthroughsteam/sits_small.png" ' +
            'alt="Sign in through Steam"/></form>');
    }
    response.send();
});

app.listen(port, () => console.log(`Listening on ${port}`));
console.log('Listening on port ' + port);
