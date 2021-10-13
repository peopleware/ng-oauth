import { Type } from '@angular/core';
import { Observable } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class UrlPrefixLoader<TLoader = any> {
    constructor(public service: Type<TLoader>, public loadAs: (service: TLoader) => string | Observable<string>) {}
}
