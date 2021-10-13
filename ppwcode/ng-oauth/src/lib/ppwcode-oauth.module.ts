import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Injector, ModuleWithProviders, NgModule } from '@angular/core';
import { OAuthModule } from 'angular-oauth2-oidc';

import { OAuthService } from './oauth.service';
import { OAuthAuthenticatedGuard } from './oauth-authenticated.guard';
import { OAuthTokenInterceptor } from './oauth-token.interceptor';
import { UrlPrefixLoader } from './url-prefix-loader';

@NgModule({
    declarations: [],
    imports: [CommonModule, OAuthModule.forRoot()]
})
export class PpwcodeOAuthModule {
    public static forRoot(
        baseRoutesWithAuthorizationHeader: Array<string | UrlPrefixLoader>,
        skipBaseRoutes: Array<string>
    ): ModuleWithProviders<PpwcodeOAuthModule> {
        return {
            ngModule: PpwcodeOAuthModule,
            providers: [
                OAuthService,
                OAuthAuthenticatedGuard,
                {
                    provide: HTTP_INTERCEPTORS,
                    useFactory: (service: OAuthService, injector: Injector) =>
                        new OAuthTokenInterceptor(service, baseRoutesWithAuthorizationHeader, skipBaseRoutes, injector),
                    deps: [OAuthService, Injector],
                    multi: true
                }
            ]
        };
    }
}
