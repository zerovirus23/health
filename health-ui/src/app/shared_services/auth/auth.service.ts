import { Injectable } from '@angular/core';
import { AUTH_CONFIG } from './auth-info';
import { Router } from '@angular/router';
import * as auth0 from 'auth0-js';

export const ACCESS_TOKEN_NAME:string = "access_token";
export const ID_TOKEN_NAME:string = "id_token";
const EXPIRE_TOKEN_NAME:string = "expires_at";

@Injectable()
export class AuthService {
  //Helper that handle the Auth process with Auth0 provider
  auth0 = new auth0.WebAuth({
    clientID: AUTH_CONFIG.clientID,
    domain: AUTH_CONFIG.domain,
    responseType: 'token id_token',
    audience: AUTH_CONFIG.apiUrl,
    redirectUri: AUTH_CONFIG.callbackURL,
    scope: `openid`
  });
  //Object with the user information from Auth0
  userProfile: any;

  /**
   * 
   */
  constructor(public router: Router) {
  }

  /**
   * 
   */
  public login(): void {
    this.auth0.authorize();
  }

  /**
   * 
   */
  public handleAuthentication(): void {
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        window.location.hash = '';
        this.setSession(authResult);
        //this.setProfile(authResult);
        this.router.navigate(['/home']);
      } else if (err) {
        this.router.navigate(['/home']);
        console.log(err);
      }
    });
  }

  /**
   * 
   */
  public logout(): void {
    // Remove tokens and expiry time from localStorage
    localStorage.removeItem(ACCESS_TOKEN_NAME);
    localStorage.removeItem(ID_TOKEN_NAME);
    localStorage.removeItem(EXPIRE_TOKEN_NAME);
    // Go back to the home route
    this.router.navigate(['/']);
  }

  /**
   * 
   */
  public isAuthenticated(): boolean {
    // Check whether the current time is past the access token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem(EXPIRE_TOKEN_NAME));
    return new Date().getTime() < expiresAt;
  }

  /**
   * 
   */
  private setSession(authResult): void {
    // Set the time that the access token will expire at
    const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    localStorage.setItem(ACCESS_TOKEN_NAME, authResult.accessToken);
    localStorage.setItem(ID_TOKEN_NAME, authResult.idToken);
    localStorage.setItem(EXPIRE_TOKEN_NAME, expiresAt);
  }
  
  /**
   * 
   */
  private setProfile(authResult) : void {
    // Use access token to retrieve user's profile and set session
    this.auth0.client.userInfo(authResult.accessToken, (err, profile) => {
      if (profile) {
        this.userProfile = profile;
        console.log("::: UserProfile -> " + this.userProfile);
      } else if (err) {
        console.error(`Error authenticating: ${err.error}`);
      }
    });
  }
}
