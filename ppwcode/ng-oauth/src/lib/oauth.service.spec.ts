import { Location } from '@angular/common';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { createServiceFactory, SpectatorService, SpyObject } from '@ngneat/spectator';
import { OAuthModule, OAuthService as OidcOAuthService } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks';
import { take } from 'rxjs/operators';

import { OAuthService, PpwcodeOAuthParameters } from './oauth.service';

describe('OAuthService', () => {
    let spectator: SpectatorService<OAuthService>;
    let oidcOAuthService: SpyObject<OidcOAuthService>;
    let locationService: SpyObject<Location>;
    let router: SpyObject<Router>;
    const createService = createServiceFactory({
        service: OAuthService,
        imports: [OAuthModule.forRoot(), RouterTestingModule],
        mocks: [OidcOAuthService, Router, Location],
    });

    beforeEach(() => {
        spectator = createService();
        oidcOAuthService = spectator.inject(OidcOAuthService);
        locationService = spectator.inject(Location);
        router = spectator.inject(Router);
    });

    afterEach(() => sessionStorage.removeItem('ppwcode-redirect-app-path'));

    it('should store the app path in the session storage for when the user returns', () => {
        spectator.service.redirectAppPath = '/applications';
        expect(sessionStorage.getItem('ppwcode-redirect-app-path')).toEqual('/applications');
    });

    it('should not store the app path in the session storage when it is null', () => {
        spectator.service.redirectAppPath = '/applications';
        expect(sessionStorage.getItem('ppwcode-redirect-app-path')).toEqual('/applications');
        spectator.service.redirectAppPath = null;
        expect(sessionStorage.getItem('ppwcode-redirect-app-path')).toEqual('/applications');
        expect(spectator.service.redirectAppPath).toBeNull();
    });

    it('should get the app path from the session storage and remove it', () => {
        sessionStorage.setItem('ppwcode-redirect-app-path', '/applications');

        const appPath = spectator.service.redirectAppPath;
        expect(sessionStorage.getItem('ppwcode-redirect-app-path')).toBeNull();
        expect(appPath).toEqual('/applications');
        expect(spectator.service.redirectAppPath).toEqual('/applications');
    });

    describe('authenticated checks', () => {
        it('should be unauthenticated when there is no valid id token or access token', () => {
            oidcOAuthService.hasValidAccessToken.and.returnValue(false);
            oidcOAuthService.hasValidIdToken.and.returnValue(false);

            expect(spectator.service.isAuthenticated).toBeFalse();
        });

        it('should be unauthenticated when there is a valid id token but no valid access token', () => {
            oidcOAuthService.hasValidAccessToken.and.returnValue(false);
            oidcOAuthService.hasValidIdToken.and.returnValue(true);

            expect(spectator.service.isAuthenticated).toBeFalse();
        });

        it('should be unauthenticated when there is no valid id token but a valid access token', () => {
            oidcOAuthService.hasValidAccessToken.and.returnValue(true);
            oidcOAuthService.hasValidIdToken.and.returnValue(false);

            expect(spectator.service.isAuthenticated).toBeFalse();
        });

        it('should be authenticated when there is a valid id token and a valid access token', () => {
            oidcOAuthService.hasValidAccessToken.and.returnValue(true);
            oidcOAuthService.hasValidIdToken.and.returnValue(true);

            expect(spectator.service.isAuthenticated).toBeTrue();
        });
    });

    describe('redirect path checks', () => {
        it('should return that there is an active redirect path when it is not null or undefined', () => {
            expect(spectator.service.hasActiveRedirectPath).toBeFalse();

            spectator.service.redirectAppPath = null;
            expect(spectator.service.hasActiveRedirectPath).toBeFalse();

            spectator.service.redirectAppPath = '/applications';
            expect(spectator.service.hasActiveRedirectPath).toBeTrue();
        });
    });

    describe('access token', () => {
        it('should get the access token when the user is authenticated', () => {
            oidcOAuthService.hasValidAccessToken.and.returnValue(true);
            oidcOAuthService.getAccessToken.and.returnValue('supersecrettoken');

            expect(spectator.service.accessToken).toEqual('supersecrettoken');
        });

        it('should be null when the user is not authenticated', () => {
            oidcOAuthService.hasValidAccessToken.and.returnValue(false);
            oidcOAuthService.getAccessToken.and.returnValue('supersecrettoken');

            expect(spectator.service.accessToken).toBeNull();
        });
    });

    describe('identity claims', () => {
        beforeEach(() => {
            oidcOAuthService.getIdentityClaims.and.returnValue({ name: 'John Doe' });
        });
        it('should get the identity claims of an authenticated user', () => {
            oidcOAuthService.hasValidAccessToken.and.returnValue(true);
            oidcOAuthService.hasValidIdToken.and.returnValue(true);

            expect(spectator.service.getIdentityClaims()).toEqual({ name: 'John Doe' });
        });

        it('should return null when the user is not authenticated', () => {
            oidcOAuthService.hasValidAccessToken.and.returnValue(false);
            oidcOAuthService.hasValidIdToken.and.returnValue(true);

            expect(spectator.service.getIdentityClaims()).toBeNull();
        });
    });

    describe('configuration', () => {
        it('should pass the given configuration and set some defaults', () => {
            const configuration: PpwcodeOAuthParameters = {
                issuer: 'ppwcodeissuer',
                clientId: 'super-awesome-client',
                resource: 'super-secret-resource',
                redirectUri: 'https://myawesomeapplication.com',
                responseType: 'token',
                scope: 'openid',
            };
            spectator.service.configureOAuth(configuration);

            expect(oidcOAuthService.configure).toHaveBeenCalledOnceWith(configuration);
            expect(oidcOAuthService.setStorage).toHaveBeenCalledOnceWith(localStorage);
            expect(oidcOAuthService.setupAutomaticSilentRefresh).toHaveBeenCalledTimes(1);
            expect(oidcOAuthService.tokenValidationHandler).toEqual(new JwksValidationHandler());
        });
    });

    describe('authentication flow', () => {
        it('should start the authentication flow and prevent a hash clear after login', async () => {
            oidcOAuthService.hasValidAccessToken.and.returnValue(true);
            oidcOAuthService.hasValidIdToken.and.returnValue(true);
            oidcOAuthService.getIdentityClaims.and.returnValue({ name: 'John Doe' });
            oidcOAuthService.loadDiscoveryDocumentAndTryLogin.and.returnValue(Promise.resolve());

            await spectator.service.startAuthenticationFlow().toPromise();
            const isAuthenticated = await spectator.service.isAuthenticated$.pipe(take(1)).toPromise();
            const claims = await spectator.service.identityClaims$.pipe(take(1)).toPromise();

            expect(oidcOAuthService.loadDiscoveryDocumentAndTryLogin).toHaveBeenCalledOnceWith({
                preventClearHashAfterLogin: true,
            });
            expect(isAuthenticated).toEqual(true);
            expect(claims).toEqual({ name: 'John Doe' });
        });
    });

    describe('allowed url tree', () => {
        it('should return null if the user is not authenticated and force the login flow to start', () => {
            oidcOAuthService.hasValidAccessToken.and.returnValue(false);
            oidcOAuthService.hasValidIdToken.and.returnValue(false);
            locationService.path.and.returnValue('/applications');

            const urlTree = spectator.service.getAuthenticatedUrlTree();
            expect(urlTree).toBeNull();
            expect(oidcOAuthService.initLoginFlow).toHaveBeenCalledTimes(1);
            expect(spectator.service.redirectAppPath).toEqual('/applications');
        });

        it('should return undefined if the user is authenticated and there is no specific redirect path', () => {
            oidcOAuthService.hasValidAccessToken.and.returnValue(true);
            oidcOAuthService.hasValidIdToken.and.returnValue(true);

            const urlTree = spectator.service.getAuthenticatedUrlTree();
            expect(urlTree).toBeUndefined();
        });

        it('should return the url tree for a specific redirect path if the user is authenticated', () => {
            const mockedUrlTree = new UrlTree();
            spectator.service.redirectAppPath = '/applications';
            router.createUrlTree.and.returnValue(mockedUrlTree);
            oidcOAuthService.hasValidAccessToken.and.returnValue(true);
            oidcOAuthService.hasValidIdToken.and.returnValue(true);

            const urlTree = spectator.service.getAuthenticatedUrlTree();
            expect(urlTree).toBe(mockedUrlTree);
            expect(spectator.service.redirectAppPath).toBeNull();
        });
    });
});
