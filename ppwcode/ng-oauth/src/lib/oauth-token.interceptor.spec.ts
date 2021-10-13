import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, TestRequest } from '@angular/common/http/testing';
import { Injectable, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpCallTester } from '@ppwcode/ng-testing';
import { OAuthModule } from 'angular-oauth2-oidc';
import { Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';

import { OAuthService } from './oauth.service';
import {
    AUTHORIZATION_HEADER_URL_BASE,
    OAuthTokenInterceptor,
    SKIP_AUTHORIZATION_HEADER_URL_BASE
} from './oauth-token.interceptor';
import { UrlPrefixLoader } from './url-prefix-loader';

describe('OAuthTokenInterceptor', () => {
    let ppwcodeOAuthService: OAuthService;
    let backendApiService: BackendApiService;
    let noBackendApiService: NoBackendApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, OAuthModule.forRoot(), RouterTestingModule],
            providers: [
                OAuthService,
                OAuthTokenInterceptor,
                UrlLoaderService,
                BackendApiService,
                NoBackendApiService,
                {
                    provide: AUTHORIZATION_HEADER_URL_BASE,
                    useValue: ['/api']
                },
                {
                    provide: SKIP_AUTHORIZATION_HEADER_URL_BASE,
                    useValue: []
                },
                {
                    provide: HTTP_INTERCEPTORS,
                    useFactory: (service: OAuthService, injector: Injector) =>
                        new OAuthTokenInterceptor(service, ['/api'], [], injector),
                    deps: [OAuthService, Injector],
                    multi: true
                }
            ]
        });

        ppwcodeOAuthService = TestBed.inject(OAuthService);
        backendApiService = TestBed.inject(BackendApiService);
        noBackendApiService = TestBed.inject(NoBackendApiService);
    });

    it('should load the url prefixes', async () => {
        const interceptor: OAuthTokenInterceptor = TestBed.inject(OAuthTokenInterceptor);
        const prefixes: Array<string> = await interceptor
            .loadUrlPrefixes([
                '/api',
                new UrlPrefixLoader<UrlLoaderService>(UrlLoaderService, (loaderService: UrlLoaderService) =>
                    loaderService.loadStaticUrl()
                ),
                new UrlPrefixLoader<UrlLoaderService>(UrlLoaderService, (loaderService: UrlLoaderService) =>
                    loaderService.loadAsyncUrl()
                )
            ])
            .pipe(take(1))
            .toPromise();

        expect(prefixes).toEqual(['/api', '/static-url-prefix', '/async-url-prefix']);
    });

    describe('internal requests', () => {
        it('should set the access token if available', () => {
            spyOnProperty(ppwcodeOAuthService, 'accessToken').and.returnValue('supersecrettoken');

            HttpCallTester.expectOneCallToUrl('/api/url')
                .whenSubscribingTo(backendApiService.getAll())
                .withResponse([])
                .expectRequestTo((request: TestRequest) => {
                    expect(request.request.headers.has('Authorization')).toBeTrue();
                    expect(request.request.headers.get('Authorization')).toEqual('Bearer supersecrettoken');
                })
                .verify();
        });

        it('should not set the authorization header if there is no access token', () => {
            spyOnProperty(ppwcodeOAuthService, 'accessToken').and.returnValue(null);

            HttpCallTester.expectOneCallToUrl('/api/url')
                .whenSubscribingTo(backendApiService.getAll())
                .withResponse([])
                .expectRequestTo((request: TestRequest) => {
                    expect(request.request.headers.has('Authorization')).toBeFalse();
                })
                .verify();
        });
    });

    describe('external requests', () => {
        it('should not set the authorization header', () => {
            spyOnProperty(ppwcodeOAuthService, 'accessToken').and.returnValue('supersecrettoken');

            HttpCallTester.expectOneCallToUrl('/url')
                .whenSubscribingTo(noBackendApiService.getAll())
                .withResponse([])
                .expectRequestTo((request: TestRequest) => {
                    expect(request.request.headers.has('Authorization')).toBeFalse();
                })
                .verify();
        });
    });
});

@Injectable()
export class NoBackendApiService {
    constructor(private readonly httpClient: HttpClient) {}

    public getAll(): Observable<unknown> {
        return this.httpClient.get('/url');
    }
}

@Injectable()
export class BackendApiService {
    constructor(private readonly httpClient: HttpClient) {}

    public getAll(): Observable<unknown> {
        return this.httpClient.get('/api/url');
    }
}

@Injectable()
export class UrlLoaderService {
    public loadStaticUrl(): string {
        return '/static-url-prefix';
    }

    public loadAsyncUrl(): Observable<string> {
        return of('/async-url-prefix');
    }
}
