import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgOauthComponent } from './ng-oauth.component';

describe('NgOauthComponent', () => {
  let component: NgOauthComponent;
  let fixture: ComponentFixture<NgOauthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgOauthComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgOauthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
