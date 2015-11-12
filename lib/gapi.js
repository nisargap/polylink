var googleapis = require('googleapis'),
    OAuth2Client = googleapis.auth.OAuth2,
    client = '412299697603-vl2ntqnn12q3p5vpphv58tec741i6mnu.apps.googleusercontent.com',
    secret = 'oMc2IGAnRZOb0bBDaYVx9-Ip',
    redirect = 'http://localhost:3000/oauth2callback',
    calendar_auth_url = '',
    oauth2Client = new OAuth2Client(client, secret, redirect);

exports.ping = function() {
    console.log('pong');
};
calendar_auth_url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.me'
});
exports.url = calendar_auth_url;
exports.client = oauth2Client;
