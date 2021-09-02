import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { OAuthService } from './oauth.service';

export const AUTHORIZATION_HEADER_URL_BASE = new InjectionToken<Array<string>>(
    'base url to send authorization header to'
);

@Injectable()
export class OAuthTokenInterceptor implements HttpInterceptor {
    constructor(
        private readonly ppwcodeOAuthService: OAuthService,
        @Inject(AUTHORIZATION_HEADER_URL_BASE) private readonly urlPrefixesToHandle: Array<string>
    ) {}

    public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = this.ppwcodeOAuthService.accessToken;

        if (this.urlPrefixesToHandle.some((prefix) => request.url.startsWith(prefix)) && token !== null) {
            const requestWithAuthorizationHeader = request.clone({
                setHeaders: { Authorization: `Bearer ${this.ppwcodeOAuthService.accessToken}` },
            });

            return next.handle(requestWithAuthorizationHeader);
        }

        return next.handle(request);
    }
}
