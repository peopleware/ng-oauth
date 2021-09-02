import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { OAuthModule } from 'angular-oauth2-oidc';

import { OAuthService } from './oauth.service';
import { OAuthAuthenticatedGuard } from './oauth-authenticated.guard';
import { OAuthTokenInterceptor } from './oauth-token.interceptor';

@NgModule({
    declarations: [],
    imports: [CommonModule, OAuthModule.forRoot()],
})
export class PpwcodeOAuthModule {
    public static forRoot(baseRoutesWithAuthorizationHeader: Array<string>): ModuleWithProviders<PpwcodeOAuthModule> {
        return {
            ngModule: PpwcodeOAuthModule,
            providers: [
                OAuthService,
                OAuthAuthenticatedGuard,
                {
                    provide: HTTP_INTERCEPTORS,
                    useFactory: (service: OAuthService) =>
                        new OAuthTokenInterceptor(service, baseRoutesWithAuthorizationHeader),
                    deps: [OAuthService],
                    multi: true,
                },
            ],
        };
    }
}
