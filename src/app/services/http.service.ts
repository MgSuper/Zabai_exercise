import { Injectable } from '@angular/core';
import { Http, HttpOptions } from '@capacitor-community/http';
import { from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor() { }

  doGet(url) {
    const options: HttpOptions = {
      url,
    };
    // without from it is Promise, with from it is Observable
    return from(Http.get(options, ));
  }
}
