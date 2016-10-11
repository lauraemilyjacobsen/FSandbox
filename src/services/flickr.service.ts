import { Injectable } from '@angular/core';
import { Response, Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/mergeMap';
import { Photo } from '../models/photo';

declare var OAuthSignature: any; // to use the oauthSignature js
declare var window: any; // to use the cordova-inapp-browser plugin

@Injectable()
export class FlickrService {

    apiKey: string = "293d62316b878b8768f868e454965800";
    apiSecret: string = "72826b1cbb6480e4";
    oauthSignature: any;
    requestUrl: string = 'https://www.flickr.com/services/oauth/request_token';
    authorizeUrl: string = 'https://www.flickr.com/services/oauth/authorize';
    callback: string = 'http://designthinktravel.com/callback/'
    accessUrl: string = 'https://www.flickr.com/services/oauth/access_token';

    apiUrl: string = 'https://api.flickr.com/services/rest/';

    constructor(public http: Http) {
        this.oauthSignature = window.oauthSignature;
     }

    // Load the first 100 photos for a user
    getPhotos(): Observable<Photo[]> {
        this.oauthSignature = window.oauthSignature;

        // Retrieve the user's token, secret, and user id
        let oauth_token = localStorage.getItem("oauth_token");
        let oauth_token_secret = localStorage.getItem("oauth_token_secret");
        let user_nsid = localStorage.getItem("user_nsid");

        console.log("retrieved from local storage: oauth_token: " + oauth_token +
            ", oauth_token_secret: " + oauth_token_secret + ", user_nsid: " + user_nsid);

        // Generate a nonce and a timestamp
        let nonce: string = this.getNonce();
        let timestamp: string = this.getTimestamp();

        // Build the parameters for a base string
        var httpMethod = 'GET',
            url = this.accessUrl,
            parameters = {
                nojsoncallback: '1',
                oauth_nonce: nonce,
                format: 'json',
                oauth_consumer_key: this.apiKey,
                oauth_timestamp: timestamp,
                oauth_signature_method: 'HMAC-SHA1',
                oauth_version: '1.0',
                oauth_token: oauth_token,
                user_id: 'me',
                method: 'flickr.photos.search'
            },
            consumerSecret = this.apiSecret;

        // Generate a signature for this request
        let signature = this.oauthSignature.generate(
            httpMethod, url, parameters, consumerSecret, oauth_token_secret, null);

        let photosUrl: string = this.apiUrl +
            '?nojsoncallback=1' +
            '&oauth_nonce=' + this.getNonce() +
            '&format=json' +
            '&oauth_consumer_key=' + this.apiKey +
            '&oauth_timestamp=' + this.getTimestamp() +
            '&oauth_signature_method=HMAC-SHA1' +
            '&oauth_version=1.0' +
            '&oauth_token=' + oauth_token +
            '&user_id=me' +
            '&method=flickr.photos.search' +
            '&oauth_signature=' + signature;

            // let url: string = this.photosUrl
            //     + 'api_key=' + this.apiKey + 
            //     '&user_id=' + user_nsid +
            //     '&format=json&nojsoncallback=1';
            console.log('photos url: ' + photosUrl);
        return this.http.get(photosUrl)
            .map(res => <Photo[]>res.json().photos.photo);
    }

    authenticateStep1(): Observable<string[]> {
        this.oauthSignature = window.oauthSignature; // from oauth-signature.js

        // Get the request token (actually two strings: a token and a secret)
        return this.getRequestToken();
    }

    // Step 1 of Flickr OAuth authentication. Builds a signed request and gets a request token from Flickr.
    // Returns a string array containing the parsed response.
    private getRequestToken(): Observable<string[]> {

        // 1a: Get an OAuth signature for this request
        let nonce: string = this.getNonce();
        let timestamp: string = this.getTimestamp();

        var httpMethod = 'GET',
            url = this.requestUrl,
            parameters = {
                oauth_nonce: nonce,
                oauth_timestamp: timestamp,
                oauth_consumer_key: this.apiKey,
                oauth_signature_method: 'HMAC-SHA1',
                oauth_version: '1.0',
                oauth_callback: this.callback
            },
            consumerSecret = this.apiSecret;

        // generates a RFC 3986 encoded, BASE64 encoded HMAC-SHA1 hash
        var encodedSignature = this.oauthSignature.generate(httpMethod, url, parameters, consumerSecret, null);
        console.log('signature: ' + encodedSignature);

        // 1b: Make the request 
        let requestTokenUrl: string = this.requestUrl +
            '?oauth_nonce=' + nonce +
            '&oauth_timestamp=' + timestamp +
            '&oauth_consumer_key=' + this.apiKey +
            '&oauth_signature_method=HMAC-SHA1' +
            '&oauth_version=1.0' +
            '&oauth_signature=' + encodedSignature +
            '&oauth_callback=' + this.callback;
        console.log('request url: ' + requestTokenUrl); // this url is working in the browser!

        return this.http.get(requestTokenUrl).map(response => this.extractTokens(response));
    }

    // Step 3 of Flickr Oauth flow. Exchange the verifier obtained in the previous steps for an access token and secret,
    // then persist the token and secret so they can be used to sign calls to the API. 
    getAccessToken(token: string, reqSecret: string, verifier: string): Observable<string[]> {

        // Build a request string
        let nonce: string = this.getNonce();
        let timestamp: string = this.getTimestamp();

        var httpMethod = 'GET',
            url = this.accessUrl,
            parameters = {
                oauth_nonce: nonce,
                oauth_timestamp: timestamp,
                oauth_verifier: verifier,
                oauth_consumer_key: this.apiKey,
                oauth_signature_method: 'HMAC-SHA1',
                oauth_version: '1.0',
                oauth_token: token
            },
            consumerSecret = this.apiSecret;

        // generates a RFC 3986 encoded, BASE64 encoded HMAC-SHA1 hash
        console.log('request secret: ' + reqSecret);

        let encodedAccessSignature = this.oauthSignature.generate(httpMethod, url, parameters, consumerSecret, reqSecret, null);
        console.log('access signature: ' + encodedAccessSignature);

        // Build the request URL
        let accessTokenUrl: string = this.accessUrl +
            '?oauth_nonce=' + nonce +
            '&oauth_timestamp=' + timestamp +
            '&oauth_verifier=' + verifier +
            '&oauth_consumer_key=' + this.apiKey +
            '&oauth_signature_method=HMAC-SHA1' +
            '&oauth_version=1.0' +
            '&oauth_token=' + token +
            '&oauth_signature=' + encodedAccessSignature;

        console.log('access url: ' + accessTokenUrl);

        // Receive the token and secret (finally!) along with user name and user id
        return this.http.get(accessTokenUrl)
            .map(response => this.extractAccessTokens(response));
    }

    private extractTokens(res: Response): string[] {
        let body = res.text();
        let res_tokens = body.split('&');
        return [res_tokens[1].split('=')[1], res_tokens[2].split('=')[1]];
    }

    private extractAccessTokens(res: Response): string[] {
        let body = res.text();
        let res_tokens = body.split('&');
        console.log(res_tokens);
        return res_tokens;
    }

    getNonce(): string {

        var text = "";
        var possible = "0123456789";
        for (var i = 0; i < 9; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    getTimestamp(): string {
        return String(Math.floor(new Date().getTime() / 1000));
    }
}