import { TestBed } from '@angular/core/testing';

import { NgOauthService } from './ng-oauth.service';

describe('NgOauthService', () => {
  let service: NgOauthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgOauthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
