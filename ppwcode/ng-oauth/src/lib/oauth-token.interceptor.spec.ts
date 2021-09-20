import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, TestRequest } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpCallTester } from '@ppwcode/ng-testing';
import { OAuthModule } from 'angular-oauth2-oidc';
import { Observable } from 'rxjs';

import { OAuthService } from './oauth.service';
import { OAuthTokenInterceptor } from './oauth-token.interceptor';

describe('OAuthTokenInterceptor', () => {
    let ppwcodeOAuthService: OAuthService;
    let backendApiService: BackendApiService;
    let noBackendApiService: NoBackendApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, OAuthModule.forRoot(), RouterTestingModule],
            providers: [
                OAuthService,
                BackendApiService,
                NoBackendApiService,
                {
                    provide: HTTP_INTERCEPTORS,
                    useFactory: (service: OAuthService) => new OAuthTokenInterceptor(service, ['/api']),
                    deps: [OAuthService],
                    multi: true
                }
            ]
        });

        ppwcodeOAuthService = TestBed.inject(OAuthService);
        backendApiService = TestBed.inject(BackendApiService);
        noBackendApiService = TestBed.inject(NoBackendApiService);
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
