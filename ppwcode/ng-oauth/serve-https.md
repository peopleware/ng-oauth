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
