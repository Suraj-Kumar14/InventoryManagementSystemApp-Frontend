import { HttpParams } from '@angular/common/http';
import { MonoTypeOperatorFunction, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export type ApiPrimitive = string | number | boolean | Date;
export type ApiParamValue = ApiPrimitive | ApiPrimitive[] | null | undefined;

export function buildHttpParams(values: Record<string, ApiParamValue>): HttpParams {
  let params = new HttpParams();

  for (const [key, rawValue] of Object.entries(values)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const value of rawValue) {
        params = params.append(key, serializeParamValue(value));
      }
      continue;
    }

    params = params.set(key, serializeParamValue(rawValue));
  }

  return params;
}

export function handleServiceError<T>(
  serviceName: string,
  operation: string
): MonoTypeOperatorFunction<T> {
  return catchError((error) => {
    console.error(`[${serviceName}] ${operation} failed`, error);
    return throwError(() => error);
  });
}

function serializeParamValue(value: ApiPrimitive): string {
  return value instanceof Date ? value.toISOString() : String(value);
}
