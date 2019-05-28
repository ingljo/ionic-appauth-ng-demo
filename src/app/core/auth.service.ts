import { Platform } from '@ionic/angular';
import { Injectable, NgZone } from '@angular/core';
import { IonicAuth, IonicAuthorizationRequestHandler, DefaultBrowser, Browser, AuthActions } from 'ionic-appauth';
import { CordovaRequestorService } from './cordova/cordova-requestor.service';
import { BrowserService } from './cordova/browser.service';
import { SecureStorageService } from './cordova/secure-storage.service';
import { StorageService } from './angular/storage.service';
import { RequestorService } from './angular/requestor.service';
import { IonicImplicitRequestHandler } from 'ionic-appauth/lib/implicit-request-handler';
import * as JWT from 'jwt-decode';
import { StorageBackend } from '@openid/appauth';
import { settings } from '../settings';
import { map, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends IonicAuth {

  get user$(): Observable<any> {
    return this.authObservable.pipe(
      map((auth) => (auth && auth.tokenResponse && auth.tokenResponse.idToken) ?
        JWT(auth.tokenResponse.idToken) : null));
  }

  constructor(
    requestor: RequestorService,
    cordovaRequestor: CordovaRequestorService,
    secureStorage: SecureStorageService,
    storage: StorageService,
    browser: BrowserService,
    private platform: Platform,
    private ngZone: NgZone,
  ) {
    super(
      (platform.is('cordova')) ? browser : undefined,
      (platform.is('cordova')) ? secureStorage : storage,
      (platform.is('cordova')) ? cordovaRequestor : requestor,
      undefined, undefined,
      (platform.is('cordova')) ? new IonicAuthorizationRequestHandler(browser, secureStorage) : new IonicImplicitRequestHandler(new DefaultBrowser(), storage)
    );

    this.addConfig();
  }

  public async startUpAsync() {
    if (this.platform.is("cordova")) {
      (<any>window).handleOpenURL = (callbackUrl) => {
        this.ngZone.run(() => {
          this.handleCallback(callbackUrl);
        });
      };
    }

    super.startUpAsync();
  }

  async getUser() {
    const token = await this.getTokenFromObserver();
    const decodedIdToken = JWT(token.idToken);
    return decodedIdToken;
  }

  private addConfig() {
    if (this.platform.is("cordova")) {
      this.authConfig = {
        identity_client: settings.auth.clientId,
        identity_server: settings.auth.authServerUrl,
        redirect_url: settings.auth.nativeRedirectCallback,
        scopes: settings.auth.scopes,
        usePkce: true,
        end_session_redirect_url: settings.auth.nativeEndSessionRedirectUrl,
      }
    } else {
      const baseUrl = window.location.origin;
      this.authConfig = {
        identity_client: settings.auth.clientId,
        identity_server: settings.auth.authServerUrl,
        response_type: 'id_token',
        redirect_url: `${baseUrl}${settings.auth.implicitRedirectCallback}`,
        scopes: settings.auth.scopes,
        usePkce: false,
        end_session_redirect_url: `${baseUrl}${settings.auth.implicitEndSessionRedirectUrl}`,
      }
    }
  }

  private handleCallback(callbackUrl: string): void {
    console.log(`handleCallback: ${callbackUrl}`);
    if ((callbackUrl).indexOf(this.authConfig.redirect_url) === 0) {
      this.AuthorizationCallBack(callbackUrl);
    }

    if ((callbackUrl).indexOf(this.authConfig.end_session_redirect_url) === 0) {
      this.EndSessionCallBack();
    }
  }
}
