import { UrlTree } from '@angular/router';
import { createServiceFactory, SpectatorService, SpyObject } from '@ngneat/spectator';
import { of } from 'rxjs';

import { OAuthService } from './oauth.service';
import { OAuthAuthenticatedGuard } from './oauth-authenticated.guard';

describe('OAuthAuthenticatedGuard', () => {
    let spectator: SpectatorService<OAuthAuthenticatedGuard>;
    let ppwcodeOAuthService: SpyObject<OAuthService>;
    const createService = createServiceFactory({
        service: OAuthAuthenticatedGuard,
        mocks: [OAuthService],
    });

    beforeEach(() => {
        spectator = createService();
        ppwcodeOAuthService = spectator.inject(OAuthService);
        ppwcodeOAuthService.startAuthenticationFlow.and.returnValue(of(null));
    });

    it('should return false when the user is not authenticated', async () => {
        ppwcodeOAuthService.getAuthenticatedUrlTree.and.returnValue(null);

        const canActivate = await spectator.service.canActivate().toPromise();
        expect(canActivate).toBeFalse();
    });

    it('should return the url tree to go to when the user should be redirected', async () => {
        const urlTree = new UrlTree();
        ppwcodeOAuthService.getAuthenticatedUrlTree.and.returnValue(urlTree);

        const canActivate = await spectator.service.canActivate().toPromise();
        expect(canActivate).toBe(urlTree);
    });

    it('should return true when the user is authenticated and should not be redirected', async () => {
        ppwcodeOAuthService.getAuthenticatedUrlTree.and.returnValue(undefined);

        const canActivate = await spectator.service.canActivate().toPromise();
        expect(canActivate).toBeTrue();
    });
});
