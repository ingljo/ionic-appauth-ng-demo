import { Platform } from '@ionic/angular';
import { Injectable, NgZone } from '@angular/core';
import { IonicAuth, IonicAuthorizationRequestHandler, DefaultBrowser } from 'ionic-appauth';
import { CordovaRequestorService } from './cordova/cordova-requestor.service';
import { BrowserService } from './cordova/browser.service';
import { SecureStorageService } from './cordova/secure-storage.service';
import { StorageService } from './angular/storage.service';
import { RequestorService } from './angular/requestor.service';
import { IonicImplicitRequestHandler } from 'ionic-appauth/lib/implicit-request-handler';
import * as JWT from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends IonicAuth {

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
    const client = '6a55a4d1-1c9f-457b-85a5-86d4315d9e96';
    const serverUrl = 'https://nveb2c.b2clogin.com/tfp/nveb2c.onmicrosoft.com/B2C_1_signupsignintest/v2.0';
    const scopes = 'openid profile offline_access';
    const responseType = 'id_token';
    // const scopes = 'openid profile offline_access';
    if (this.platform.is("cordova")) {
      this.authConfig = {
        identity_client: client,
        identity_server: serverUrl,
        response_type: responseType,
        redirect_url: 'appauth://callback',
        scopes,
        usePkce: true,
        end_session_redirect_url: 'appauth://endSession',
      }
    } else {
      this.authConfig = {
        identity_client: client,
        identity_server: serverUrl,
        response_type: responseType,
        redirect_url: 'http://localhost:8100/implicit/authcallback',
        scopes,
        usePkce: false,
        end_session_redirect_url: 'http://localhost:8100/implicit/endsession',
      }
    }
    this.getConfiguration().then((c) => {
      this.configuration.userInfoEndpoint = 'https://nveb2c.b2clogin.com/tfp/nveb2c.onmicrosoft.com/openid/userinfo';
    });

  }

  private handleCallback(callbackUrl: string): void {
    if ((callbackUrl).indexOf(this.authConfig.redirect_url) === 0) {
      this.AuthorizationCallBack(callbackUrl);
    }

    if ((callbackUrl).indexOf(this.authConfig.end_session_redirect_url) === 0) {
      this.EndSessionCallBack();
    }
  }
}
