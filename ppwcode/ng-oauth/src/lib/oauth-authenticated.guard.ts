import { Injectable } from '@angular/core';
import { UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { OAuthService } from './oauth.service';

/**
 * This guard should be used to protect the route from being accessed by unauthorized users.
 * It starts the authentication flow, which will cause a redirect if the user is not yet authenticated
 * and get the url tree from the PPWCode auth service.
 * If the auth service returns null, this indicates that the authentication redirect has been triggered
 * and we shouldn't allow the user to the route.
 * If the auth service returns a url tree, we need to navigate the user to the given url tree in our application.
 * If the auth service returns undefined, the user is authenticated and should be able to see the route he wanted.
 */
@Injectable()
export class OAuthAuthenticatedGuard  {
    constructor(private readonly ppwCodeOAuthService: OAuthService) {}

    public canActivate(): Observable<UrlTree | boolean> {
        return this.ppwCodeOAuthService.startAuthenticationFlow().pipe(
            map(() => this.ppwCodeOAuthService.getAuthenticatedUrlTree()),
            map((urlTree: UrlTree | null | undefined) => {
                if (urlTree === null) {
                    return false;
                }

                if (urlTree instanceof UrlTree) {
                    return urlTree;
                }

                return true;
            })
        );
    }
}
