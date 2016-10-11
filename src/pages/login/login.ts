import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FlickrService } from '../../services/flickr.service';
import { Platform } from 'ionic-angular';

declare var window: any; // to use the cordova-inapp-browser plugin

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  tokens: string[];
  verifier: string;

  authorizeUrl: string = 'https://www.flickr.com/services/oauth/authorize';
  callback: string = 'http://designthinktravel.com/callback/'

  constructor(public navCtrl: NavController, private flickrService: FlickrService,
    private platform: Platform) { }

  ionViewDidLoad() {

  }

  login() {

    this.platform.ready().then(() => {
      this.flickrService.authenticateStep1().subscribe(
        response => this.saveTokens(response), // step 1 response
        error => console.log(error), // step 1 error
        () => this.getUserAuthorization() // step 1 complete
      ); // end authenticateStep1.subscribe()
    }); // end platform ready

  } // end login function

  saveTokens(tokens: string[]) {
    this.tokens = tokens;
    console.log('received request tokens ');
    console.log(tokens);
    console.log('request token: ' + tokens[0]);
    console.log('request secret: ' + tokens[1]);
  }

  // Step 2 of Flickr auth flow. Display the Flickr login page to the user. When the user logs in, Flickr
  // will redirect to our callback URL with an auth token and verifier.
  getUserAuthorization() {
    let authUrl: string = this.authorizeUrl + '?oauth_token=' + this.tokens[0];
    var browserRef = window.cordova.InAppBrowser.open(authUrl, '_blank', null);

    let verifier = '';
    browserRef.addEventListener('loadstart', (event) => {
      if ((event.url).indexOf(this.callback) >= 0) {
        browserRef.removeEventListener("exit", (event) => { });
        browserRef.close();

        // Sample response url: http://www.example.com/?oauth_token=72157626737672178-022bbd2f4c2f3432&oauth_verifier=5d1b96a26b494074
        console.log('event.url: ' + event.url);
        var oauthVerifier = ((event.url).split("&")[1]).split("=");

        if (oauthVerifier !== undefined && oauthVerifier !== null) {
          // Move on to step 3
          verifier = oauthVerifier[1];
          console.log('received verifier ' + verifier + ' in login.ts');
          //  Call service to get auth tokens
          this.getAccessToken(this.tokens[0], this.tokens[1], verifier)
        } else {
          // Handle the error
          verifier = 'error';
        }
      }
    });
    browserRef.addEventListener("exit", function (event) {
      // Quit the auth flow
    });
  }

  getAccessToken(reqToken: string, reqSecret: string, verifier: string){
    this.flickrService.getAccessToken(reqToken, reqSecret, verifier).subscribe(
      response => console.log('received access tokens: ' + response),
      error => console.log(error),
      () => console.log('finished')
    );
  }
}