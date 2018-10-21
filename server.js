
var steam   = require('./index');
const express = require('express')
const app = express()
const port = process.env.PORT || 4000




app.use(require('express-session')({ resave: false, saveUninitialized: false, secret: 'a secret' }));

app.use(steam.middleware({
	realm: 'https://ongamelogin.herokuapp.com/', 
	verify: 'https://ongamelogin.herokuapp.com/verify',
	apiKey: 'EFC19234FBBF9E8D23E2C2E6BD59B444'}
));

app.listen(port, () => console.log(`Listening on ${port}`));
app.get('/', function(req, res) {
	res.send(req.user == null ? 'not logged in' : 'hello ' + req.user.username).end();
});

app.get('/authenticate', steam.authenticate(), function(req, res) {
	res.redirect('/');
});

app.get('/verify', steam.verify(), function(req, res) {

	console.log(req.user._json.steamid)
	res.redirect('https://ongame.io/#!/steamlogin/id='+req.user._json.steamid);
	// res.send(req.user).end();
});


app.get('/livelogin/:param' , function(req, res) {
	console.log(this.location)
	console.log(req.params);
	//res.redirect('https://ongame.io/#!/steamlogin/id='+req.user._json.steamid);
	// res.send(req.user).end();
    //Given the request "/592363122?foo=bar&hello=world"
    //the below would log out 
    // {
    //   some_id: 592363122,
    //   foo: 'bar',
    //   hello: 'world'
    // }

    //return res.json(this);
});

app.get('/logout', steam.enforceLogin('/'), function(req, res) {
	req.logout();
	res.redirect('/');
});