# PPWCode Angular OAuth

This module is the ppwcode-way of dealing with OAuth in an Angular application.

The module ships with a token interceptor, a guard and a service managing the authentication process and using the
token.

## Installing

Run the following command to install the package using NPM:

```shell
npm install @ppwcode/ng-oauth
```

In case you're using Yarn:

```shell
yarn add @ppwcode/ng-oauth
```

## Run over HTTPS locally

Convert your application to run over `https` in development by changing the configuration of the `angular.json` file:

```json
{
    "projects": {
        "my-project": {
            "architect": {
                "serve": {
                    "configurations": {
                        "development": {
                            "port": 443,
                            "ssl": true
                        }
                    }
                }
            }
        }
    }
}
```

## Add to your application module

To add the module to your application, call the `.forRoot` method when importing in your root application module. By
adding the `PpwcodeOAuthModule` to your application module, this will automatically add the `TokenInterceptor`.

```ts
import { PpwcodeOAuthModule } from '@ppwcode/ng-oauth';

@NgModule({
    imports: [
        PpwcodeOAuthModule.forRoot([/** prefixes of urls to send token to */])
    ]
})
```

In the `.forRoot` call, specify an array of prefixes for urls to send the token to.

## Configure OAuth

The OAuth services used internally require some configuration parameters to be able to run the OAuth flow. Pass the
configuration in your main `AppComponent`:

```ts
import { OAuthService } from '@ppwcode/ng-oauth';

export class AppComponent {
    constructor(private readonly oAuthService: OAuthService) {
        this.configureOAuth();
    }

    private configureOAuth(): void {
        this.oAuthService.configureOAuth({
            issuer: '',
            redirectUri: '',
            clientId: '',
            resource: '',
            responseType: '',
            scope: '',
        });
    }
}
```

## Add the guard

Add the `OAuthAuthenticatedGuard` to the routes that you want to be accessible by users that are authenticated:

```ts
import { Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'awesome',
        component: MyAwesomeComponent,
        canActivate: [OAuthAuthenticatedGuard],
    },
];
```

This can even be applied on lazy loaded modules:

```ts
import { OAuthAuthenticatedGuard } from '@ppwcode/ng-oauth';

const routes: Routes = [
    {
        path: 'children',
        loadChildren: () => import('./children/children.module').then((m) => m.ChildrenModule),
        canActivate: [OAuthAuthenticatedGuard],
    },
];
```
