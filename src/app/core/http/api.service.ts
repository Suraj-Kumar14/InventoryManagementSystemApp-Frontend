import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiParamValue, buildHttpParams } from './http.utils';

export type BackendServiceKey =
  | 'auth'
  | 'product'
  | 'warehouse'
  | 'supplier'
  | 'purchase'
  | 'movement'
  | 'alert'
  | 'report'
  | 'payment';

export interface ApiRequestOptions {
  params?: HttpParams | object;
  headers?: HttpHeaders | Record<string, string | string[]>;
  service?: BackendServiceKey;
  useGateway?: boolean;
  responseType?: 'json' | 'text' | 'blob';
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly gatewayUrl = environment.apiGatewayUrl || environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  post<T>(endpoint: string, data: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  put<T>(endpoint: string, data: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  patch<T>(endpoint: string, data: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  private request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown,
    options: ApiRequestOptions = {}
  ): Observable<T> {
    const requestOptions = {
      body,
      headers: options.headers,
      params: this.normalizeParams(options.params),
      responseType: options.responseType ?? 'json',
    };

    return this.http.request(method, this.buildUrl(endpoint), {
      ...requestOptions,
      observe: 'body',
    }) as Observable<T>;
  }

  private buildUrl(endpoint: string): string {
    if (/^https?:\/\//i.test(endpoint)) {
      return endpoint;
    }

    return `${this.gatewayUrl}${endpoint}`;
  }

  private normalizeParams(params?: HttpParams | object): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    return params instanceof HttpParams ? params : buildHttpParams(params as Record<string, ApiParamValue>);
  }
}

