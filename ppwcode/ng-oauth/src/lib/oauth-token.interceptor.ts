import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable, InjectionToken, Injector } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { OAuthService } from './oauth.service';
import { UrlPrefixLoader } from './url-prefix-loader';

export const AUTHORIZATION_HEADER_URL_BASE: InjectionToken<Array<string>> = new InjectionToken<Array<string>>(
    'base url to send authorization header to'
);

export const SKIP_AUTHORIZATION_HEADER_URL_BASE: InjectionToken<Array<string>> = new InjectionToken<Array<string>>(
    'skip the base url to send authorization header to'
);

@Injectable()
export class OAuthTokenInterceptor implements HttpInterceptor {
    constructor(
        private readonly ppwcodeOAuthService: OAuthService,
        @Inject(AUTHORIZATION_HEADER_URL_BASE) private readonly urlPrefixesToHandle: Array<string | UrlPrefixLoader>,
        @Inject(SKIP_AUTHORIZATION_HEADER_URL_BASE) private readonly skipPrefixes: Array<string>,
        private readonly injector: Injector
    ) {}

    public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        if (this.skipPrefixes.some((prefix: string) => request.url.startsWith(prefix))) {
            return next.handle(request);
        }

        return this.loadUrlPrefixes(this.urlPrefixesToHandle).pipe(
            switchMap((urlPrefixesToHandle: Array<string>) => {
                const token: string | null = this.ppwcodeOAuthService.accessToken;
                if (urlPrefixesToHandle.some((prefix: string) => request.url.startsWith(prefix)) && token !== null) {
                    const requestWithAuthorizationHeader: HttpRequest<unknown> = request.clone({
                        setHeaders: { Authorization: `Bearer ${this.ppwcodeOAuthService.accessToken}` }
                    });

                    return next.handle(requestWithAuthorizationHeader);
                }

                return next.handle(request);
            })
        );
    }

    public loadUrlPrefixes(urlPrefixesToHandle: Array<string | UrlPrefixLoader>): Observable<Array<string>> {
        const resolvedPrefixes: Array<string> = [];
        const observables: Array<Observable<string>> = [];

        urlPrefixesToHandle.forEach((urlPrefixToHandle: string | UrlPrefixLoader) => {
            if (typeof urlPrefixToHandle === 'string') {
                resolvedPrefixes.push(urlPrefixToHandle);
            } else {
                // We have a UrlPrefixLoader.
                this.loadUrlPrefixFromLoader(urlPrefixToHandle, resolvedPrefixes, observables);
            }
        });

        if (observables.length) {
            return forkJoin(observables).pipe(
                map((observableResults: Array<string>) => resolvedPrefixes.concat(...observableResults))
            );
        } else {
            return of(resolvedPrefixes);
        }
    }

    private loadUrlPrefixFromLoader(
        loader: UrlPrefixLoader,
        resolvedPrefixesArray: Array<string>,
        observablesArray: Array<Observable<string>>
    ): void {
        const service: unknown = this.injector.get(loader.service);
        const loadedUrlPrefix: string | Observable<string> = loader.loadAs(service);

        if (typeof loadedUrlPrefix === 'string') {
            resolvedPrefixesArray.push(loadedUrlPrefix);
        } else {
            observablesArray.push(loadedUrlPrefix);
        }
    }
}
