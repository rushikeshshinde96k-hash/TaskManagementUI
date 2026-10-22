import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage, toParams } from './http';

describe('http utils', () => {
  it('toParams skips empty values', () => {
    const p = toParams({ status: 'Done', priority: null, search: '', teamId: 3, assignedToMe: false, x: undefined });
    expect(p.keys().sort()).toEqual(['assignedToMe', 'status', 'teamId']);
    expect(p.get('teamId')).toBe('3');
  });

  it('apiErrorMessage joins validation errors', () => {
    const err = new HttpErrorResponse({ status: 400, error: { errors: { Email: ['Email is invalid.'], Password: ['Too short.'] } } });
    expect(apiErrorMessage(err)).toBe('Email is invalid. Too short.');
  });

  it('apiErrorMessage prefers ProblemDetails.detail', () => {
    const err = new HttpErrorResponse({ status: 409, error: { title: 'Conflict', detail: 'Email already exists.' } });
    expect(apiErrorMessage(err)).toBe('Email already exists.');
  });

  it('apiErrorMessage explains network failures', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 0 }))).toContain('Cannot reach the server');
  });
});
