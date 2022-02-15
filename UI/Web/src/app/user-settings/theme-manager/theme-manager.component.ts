import { Component, OnDestroy, OnInit } from '@angular/core';
import { distinctUntilChanged, Subject, take, takeUntil } from 'rxjs';
import { SettingsService } from 'src/app/admin/settings.service';
import { ServerSettings } from 'src/app/admin/_models/server-settings';
import { ThemeService } from 'src/app/theme.service';
import { Preferences } from 'src/app/_models/preferences/preferences';
import { SiteTheme, ThemeProvider } from 'src/app/_models/preferences/site-theme';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';

@Component({
  selector: 'app-theme-manager',
  templateUrl: './theme-manager.component.html',
  styleUrls: ['./theme-manager.component.scss']
})
export class ThemeManagerComponent implements OnInit, OnDestroy {

  themes: Array<SiteTheme> = [];
  currentTheme!: SiteTheme;
  isAdmin: boolean = false;
  user: User | undefined;

  private readonly onDestroy = new Subject<void>();

  get ThemeProvider() {
    return ThemeProvider;
  }

  constructor(public themeService: ThemeService, private accountService: AccountService, private settingsService: SettingsService) {
    themeService.currentTheme$.pipe(takeUntil(this.onDestroy), distinctUntilChanged()).subscribe(theme => {
      if (theme) {
        this.currentTheme = theme;
      }
    });

    accountService.currentUser$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.user = user;
        this.isAdmin = accountService.hasAdminRole(user);
      }
    });
  }

  ngOnInit(): void {
    this.themeService.getThemes().subscribe(themes => {
      this.themes = themes;
    });
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  applyTheme(theme: SiteTheme) {
    
    if (this.user) {
      const pref = Object.assign({}, this.user.preferences);
      pref.theme = theme;
      this.accountService.updatePreferences(pref).subscribe(updatedPref => {
        if (this.user) {
          this.user.preferences = updatedPref;
        }
        this.themeService.setTheme(theme.name);
      });
    }
    
  }

}