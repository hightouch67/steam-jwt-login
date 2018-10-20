var express = require('express'),
    steam   = require('./index');

var app = express();
const port = process.env.PORT || 4000

app.listen(port, () => console.log(`Listening on ${port}`));


app.use(require('express-session')({ resave: false, saveUninitialized: false, secret: 'a secret' }));

app.use(steam.middleware({
	realm: 'https://ongamelogin.herokuapp.com:4000/', 
	verify: 'https://ongamelogin.herokuapp.com:4000/verify',
	apiKey: 'B3942C1CD7D1B4E06FAEE6BE192E97BE'}
));

app.get('/', function(req, res) {
	res.send(req.user == null ? 'not logged in' : 'hello ' + req.user.username).end();
});

app.get('/authenticate', steam.authenticate(), function(req, res) {
	res.redirect('/');
});

app.get('/verify', steam.verify(), function(req, res) {
	res.send(req.user).end();
});

app.get('/logout', steam.enforceLogin('/'), function(req, res) {
	req.logout();
	res.redirect('/');
});