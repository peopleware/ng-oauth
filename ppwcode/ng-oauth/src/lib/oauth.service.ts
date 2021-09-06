import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { OAuthService as OidcOAuthService } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks';
import { BehaviorSubject, from, Observable } from 'rxjs';

/**
 * This service is the PPWCode way for dealing with OAuth 2.0 in a web application.
 * It provides an easy to use abstraction layer on top of the angular-oauth2-oidc package and logic for the redirection mechanism.
 */
@Injectable()
export class OAuthService {
    /** Stream emitting whether the user is authenticated. */
    public readonly isAuthenticated$!: Observable<boolean>;

    /** Stream emitting when user identity claims have changed. */
    public readonly identityClaims$!: Observable<unknown | null>;

    private isAuthenticatedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private identityClaimsSubject: BehaviorSubject<unknown | null> = new BehaviorSubject<unknown>(null);

    private _redirectAppPath?: string | null;

    constructor(
        private readonly oidcOAuthService: OidcOAuthService,
        private readonly router: Router,
        private readonly location: Location
    ) {
        this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
        this.identityClaims$ = this.identityClaimsSubject.asObservable();
    }

    /** Gets the actively stored path to redirect to after a successful login. */
    public get redirectAppPath(): string | null {
        if (this._redirectAppPath === undefined) {
            this._redirectAppPath = sessionStorage.getItem('ppwcode-redirect-app-path');
            sessionStorage.removeItem('ppwcode-redirect-app-path');
        }

        return this._redirectAppPath;
    }

    /** Sets the path to redirect to after a successful login. */
    public set redirectAppPath(value: string | null) {
        this._redirectAppPath = value;
        if (value !== null) {
            sessionStorage.setItem('ppwcode-redirect-app-path', value);
        }
    }

    /** Gets whether the current user is authenticated. */
    public get isAuthenticated(): boolean {
        return this.oidcOAuthService.hasValidIdToken() && this.oidcOAuthService.hasValidAccessToken();
    }

    /** Gets whether a path has been set to redirect to after a successful login. */
    public get hasActiveRedirectPath(): boolean {
        return this.redirectAppPath !== null && this.redirectAppPath !== undefined;
    }

    /** Gets the access token for the authenticated user or null if the user is not authenticated. */
    public get accessToken(): string | null {
        return this.oidcOAuthService.hasValidAccessToken() ? this.oidcOAuthService.getAccessToken() : null;
    }

    /** Gets the identity claims for the authenticated user or null if the user is not authenticated. */
    public getIdentityClaims<T extends Record<string, unknown>>(): T | null {
        return this.isAuthenticated ? (this.oidcOAuthService.getIdentityClaims() as T) : null;
    }

    /**
     * Configures the OAuth 2.0 flow with the given parameters.
     * Defaults to localStorage for storage and JwksValidationHandler to validate the access tokens.
     * Automatic silent refresh is also set up so you don't need to think about it either.
     * @param oAuthParameters The parameters to configure the OAuth 2.0 flow.
     */
    public configureOAuth(oAuthParameters: PpwcodeOAuthParameters): void {
        this.oidcOAuthService.configure(oAuthParameters);

        this.oidcOAuthService.setStorage(localStorage);

        this.oidcOAuthService.setupAutomaticSilentRefresh();
        this.oidcOAuthService.tokenValidationHandler = new JwksValidationHandler();
    }

    /** Starts the authentication flow by loading the discovery document and trying to login the user. */
    public startAuthenticationFlow(): Observable<boolean> {
        return from(
            this.oidcOAuthService.loadDiscoveryDocumentAndTryLogin({ preventClearHashAfterLogin: true }).then((_) => {
                this.isAuthenticatedSubject.next(this.isAuthenticated);
                this.identityClaimsSubject.next(this.getIdentityClaims());
                return _;
            })
        );
    }

    /**
     * Gets the UrlTree the user should be sent to after logging in.
     * Returns null and forces the login flow to start if the user is not authenticated.
     * Returns undefined if there is no redirect path stored in the service (this means that the user was already logged in).
     * Returns the url tree of the redirect path stored in the service (this means the user just went through the authentication process.)
     */
    public getAuthenticatedUrlTree(): UrlTree | null | undefined {
        if (!this.isAuthenticated) {
            // Store the current path of the application so that we can go back to it when the user is authenticated.
            this.redirectAppPath = this.location.path();

            // Force the authentication flow to start.
            this.oidcOAuthService.initLoginFlow();

            // Return null so that code calling this function can make the difference between 'not authenticated' and 'no redirect needed'.
            return null;
        } else if (this.hasActiveRedirectPath) {
            // We just came back after a successful authentication flow. Get the path the user initially wanted to go to (will clear it
            // from the session storage) and set it to null again so that we enter here only once.
            const pathToNavigateTo = this.redirectAppPath;
            this.redirectAppPath = null;

            return this.router.createUrlTree([pathToNavigateTo]);
        } else {
            // The user most likely was already authenticated and still had a valid token or they just refreshed the browser.
            return;
        }
    }
}

export interface PpwcodeOAuthParameters {
    issuer: string;
    redirectUri: string;
    clientId: string;
    resource: string;
    responseType: string;
    scope: string;
}
