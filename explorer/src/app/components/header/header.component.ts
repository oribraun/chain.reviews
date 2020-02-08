import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";

declare var DATA: any;
declare var $: any;
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less']
})
export class HeaderComponent implements OnInit {

  public data:any;
  public search: string;
  public searching: boolean = false;
  private http: HttpClient;
  private router: Router;
  constructor(http: HttpClient, router: Router) {
    this.http = http;
    this.router = router;
  }

  ngOnInit() {
    let data: any = {}; /// from server node ejs data
    if (typeof DATA !== "undefined") {
      data = DATA;
    }
    console.log('session data');
    console.log(data);
    this.data = data;
  }

  onSearch() {
    if(!this.search) {
      return;
    }
    console.log('this.search', this.search)
    this.searching = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/search/' + this.search;
    console.log('url', url);
    $('.navbar-collapse').collapse('hide');
    this.http.get(url).subscribe(
      (response: any) => {
        if(!response.err) {
          if (response.data && response.data.type && response.data.result) {
            this.router.navigateByUrl('/' + response.data.type + '/' + response.data.result);
          } else {
            alert('Search found no results for: ' + this.search)
          }
        } else {
          alert('Search found no results for: ' + this.search)
        }
        this.searching = false;
      },
      (error) => {
        console.log(error)
        this.searching = false;
      }
    )
  }

}
