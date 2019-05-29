import { Component, OnInit } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { IUserInfo } from '../models/user-info.model';
import { IAuthAction, AuthActions } from 'ionic-appauth';
import { NavController, Platform } from '@ionic/angular';
import { Observable } from 'rxjs';
import { SafariViewController } from '@ionic-native/safari-view-controller/ngx';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  userInfo: Observable<IUserInfo | any>;
  action: IAuthAction;

  constructor(
    private auth: AuthService,
    private navCtrl: NavController,
    private platform: Platform,
    private safariViewController: SafariViewController,
  ) { }

  ngOnInit() {
    this.userInfo = this.auth.user$;
    this.auth.authObservable.subscribe((action) => {
      this.action = action;
      if (action.action === AuthActions.SignOutSuccess) {
        this.navCtrl.navigateRoot('landing');
      }
    });
  }

  signOut() {
    this.auth.signOut();
  }

  gotoWeb() {
    this.openUrl('https://tst-h-web03.nve.no/B2CWebAppTest/');
  }

  editProfile() {
    // tslint:disable-next-line:max-line-length
    const url = 'https://nveb2c.b2clogin.com/nveb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=B2C_1_profile_edit&client_id=c79f3373-21d3-43fc-980a-1d44ee9bdb9d&nonce=defaultNonce&redirect_uri=appauth%3A%2F%2Fcallback&scope=openid&response_type=id_token&prompt=login';
    this.openUrl(url);
  }

  async openUrl(url: string) {
    if (!this.platform.is('cordova')) {
      this.openExternalLinkFallback(url);
      return;
    }
    const available = await this.safariViewController.isAvailable();
    if (!available) {
      this.openExternalLinkFallback(url);
      return;
    }
    this.safariViewController.show({
      url,
      tintColor: '#ffffff',
      barColor: '#044962',
      toolbarColor: '#044962',
      controlTintColor: '#ffffff',
    }).subscribe((result) => {
      console.log('Closed safari view controller');
    }, (error) => {
      this.openExternalLinkFallback(url);
    });
  }

  openExternalLinkFallback(url: string) {
    window.open(url, '_system', 'location=yes,hardwareback=yes');
  }
}
