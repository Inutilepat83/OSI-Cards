import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface DemoCardReference {
  id: string;
  variant?: number;
}

@Injectable({ providedIn: 'root' })
export class DemoCardLoaderService {
  private readonly basePath = '/assets/cards/demo';

  constructor(private http: HttpClient) {}

  getCard(id: string, variant = 1): Observable<any> {
    const filename = `${id}.variant${variant}.json`;
    const url = `${this.basePath}/${filename}`;
    
    console.log(`[DemoCardLoaderService] Loading card: ${url}`);
    
    return this.http.get(url).pipe(
      tap(data => {
        console.log(`[DemoCardLoaderService] Successfully loaded card: ${filename}`, data);
      }),
      catchError(error => {
        console.error(`[DemoCardLoaderService] Failed to load card: ${filename}`, error);
        return throwError(() => new Error(`Failed to load demo card: ${filename}. ${error.message}`));
      })
    );
  }

  listIndex(): Observable<any> {
    const url = `${this.basePath}/index.json`;
    console.log(`[DemoCardLoaderService] Loading index: ${url}`);
    
    return this.http.get(url).pipe(
      tap(data => {
        console.log(`[DemoCardLoaderService] Successfully loaded index`, data);
      }),
      catchError(error => {
        console.error(`[DemoCardLoaderService] Failed to load index`, error);
        return throwError(() => new Error(`Failed to load demo card index. ${error.message}`));
      })
    );
  }
}
