import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';

// array in local storage for registered users
let blocks = [
  {
    "timestamp": 1579549769,
    "blockindex": 163489,
    "_id": "5e2b0f06701460225bbb6831",
    "blockhash": "c6f736e52dbc47df9bdcc036b7b3257088f6d2c4ef53a87cc578a98a8a25cf84"
  },
  {
    "timestamp": 1579549637,
    "blockindex": 163488,
    "_id": "5e2b0f06701460225bbb682f",
    "blockhash": "ed5504c05f916f744f458353ad7a414d28fd28d38623d67c7f39449da92f5b14"
  },
  {
    "timestamp": 1579549576,
    "blockindex": 163487,
    "_id": "5e2b0f06701460225bbb682d",
    "blockhash": "a73abee080fb195e8819e0f2bd76c0a4342f57c95a10e7c25f8ab4b3755a1621"
  },
  {
    "timestamp": 1579549414,
    "blockindex": 163486,
    "_id": "5e2b0f06d637a22254f8b3c3",
    "blockhash": "074c31ba1d7a61958db2b2f67d21860555c4cdd0e119da7fcf2712c6228596fa"
  },
  {
    "timestamp": 1579549340,
    "blockindex": 163485,
    "_id": "5e2b0f06701460225bbb682b",
    "blockhash": "9856363f58ecadaaf8afa8aba65292bb27697d91a0f826dff898d306fec5b06b"
  },
  {
    "timestamp": 1579549170,
    "blockindex": 163484,
    "_id": "5e2b0f06701460225bbb6827",
    "blockhash": "5dc8a84e84698475b9093e892f58161ef78c57d95679a41324dcbdcf665756e5"
  },
  {
    "timestamp": 1579549023,
    "blockindex": 163483,
    "_id": "5e2b0f06915b36226226170e",
    "blockhash": "22a2b4aa1216ba6637727d947c4fc270f3dc25ab54cb9604e12a8d0aa5f466a7"
  },
  {
    "timestamp": 1579548879,
    "blockindex": 163482,
    "_id": "5e2b0f0693b7e7224e6988f6",
    "blockhash": "494cf0aaa4c9efa0ec488bafa6678b82a1bc2836a92728262cb9470ee9a5aa10"
  },
  {
    "timestamp": 1579548674,
    "blockindex": 163481,
    "_id": "5e2b0f06d637a22254f8b3bb",
    "blockhash": "de5017db3e87da56f8d825eb00b2090142889f87c369378696365413ac835efd"
  },
  {
    "timestamp": 1579548644,
    "blockindex": 163480,
    "_id": "5e2b0f06d637a22254f8b3b9",
    "blockhash": "2422cb3e46ee3d45d36c69a6ac1eaace3ecf0b8a62c9b08c8828183741cef91b"
  }
];

@Injectable()
export class MockBackendInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const {url, method, headers, body} = request;

    // wrap in delayed observable to simulate server api call
    return of(null)
      .pipe(mergeMap(handleRoute))
      .pipe(materialize()) // call materialize and dematerialize to ensure delay even if an error is thrown (https://github.com/Reactive-Extensions/RxJS/issues/648)
      .pipe(delay(500))
      .pipe(dematerialize());

    function handleRoute() {
      switch (true) {
        case url.indexOf('/getAllBlocks') > -1 && method === 'GET':
          var host = window.location.protocol + '//' + window.location.host + '/';
          var array = url.replace(host, '').split('/');
          var wallet = array[2];
          var func = array[3];
          var limit = parseInt(array[4]);
          var offset = parseInt(array[5]);
          return getAllBlocks(wallet, limit, offset);
        default:
          // pass through any requests not handled above
          return next.handle(request);
      }
    }

    function getAllBlocks(wallet, limit, offset) {
      return ok(blocks.slice(offset*limit, limit + offset*limit));
    }

    function ok(body?) {
      return of(new HttpResponse({ status: 200, body }))
    }
  }
}
