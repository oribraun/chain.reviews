import {Component, HostListener, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";

declare var DATA: any;
@Component({
  selector: 'app-masternodes',
  templateUrl: './masternodes.component.html',
  styleUrls: ['./masternodes.component.less']
})
export class MasternodesComponent implements OnInit {

  public data;
  public input = '';
  public masternodes: [];
  public emptyTable: any[] = [];
  public currentTable: any[] = [];
  public gettingMasternodes = false;
  public pagination: any = {
    current: 1,
    start: 1,
    end: 10,
    pages: 0,
    maxPages: 10,
    offset: 0,
    limit: 10
  }
  private http: HttpClient;
  constructor(http: HttpClient) {
    this.http = http;
  }

  ngOnInit() {
    let data: any = {}; /// from server node ejs data
    if (typeof DATA !== "undefined") {
      data = DATA;
    }
    console.log(data);
    this.data = data;
    this.setCurrentTable();
    this.getBlocks();

  }

  setPages() {
    if(window.innerWidth <= 415) {
      this.pagination.maxPages = 5;
    } else {
      this.pagination.maxPages = 10;
    }
    this.pagination.pages = Math.ceil(this.masternodes.length / this.pagination.limit);
    this.pagination.start = this.pagination.start + (this.pagination.offset * this.pagination.maxPages);
    this.pagination.end = this.pagination.maxPages + (this.pagination.offset * this.pagination.maxPages);
    if(this.pagination.start + (this.pagination.offset * this.pagination.maxPages) > this.pagination.pages - this.pagination.maxPages) {
      this.pagination.start = this.pagination.pages - this.pagination.maxPages + 1;
    }
    if(this.pagination.end + (this.pagination.offset * this.pagination.maxPages) > this.pagination.pages) {
      this.pagination.end = this.pagination.pages;
    }
  }
  setCurrentTable() {
    for(var i = 0; i < this.pagination.maxPages; i++) {
      this.emptyTable.push( { "addr": "&nbsp;", "collateral": "", "status": "", "lastseen": "" });
    }
    this.currentTable = this.emptyTable.slice();
  }
  nextPage() {
    if(this.gettingMasternodes) return;
    if(this.pagination.current < this.pagination.pages) {
      this.pagination.current++;
      // this.getBlocks();
      this.getNextBlocks();
    }
    if(this.pagination.end < this.pagination.pages && this.pagination.current > Math.floor(this.pagination.maxPages / 2)) {
      this.pagination.start++;
      this.pagination.end++;
    }
    this.pagination.offset = (this.pagination.current - 1) * this.pagination.limit;
  }

  prevPage() {
    if(this.gettingMasternodes) return;
    if(this.pagination.current > 1) {
      this.pagination.current--;
      // this.getBlocks();
      this.getNextBlocks();
    }
    if(this.pagination.start > 1 && this.pagination.current < this.pagination.pages - Math.ceil(this.pagination.maxPages / 2)) {
      this.pagination.start--;
      this.pagination.end--;
    }
    this.pagination.offset = (this.pagination.current - 1) * this.pagination.limit;
  }

  setPage(page) {
    if(this.gettingMasternodes) return;
    if(page == this.pagination.current || !page || isNaN(page)) {
      return;
    }
    this.pagination.current = parseInt(page);
    this.pagination.offset = (this.pagination.current - 1) * this.pagination.limit;

    this.pagination.start = this.pagination.current - Math.floor(this.pagination.maxPages / 2);
    this.pagination.end = this.pagination.current + Math.floor(this.pagination.maxPages / 2);

    if(this.pagination.start < 1) {
      this.pagination.start = 1;
      // this.pagination.current = this.pagination.start;
      this.pagination.end = this.pagination.maxPages;
    }
    if(this.pagination.end > this.pagination.pages) {
      this.pagination.end = this.pagination.pages;
      // this.pagination.current = this.pagination.end;
      this.pagination.start = this.pagination.end - this.pagination.maxPages + 1;
    }
    if(this.pagination.current < 1) {
      this.pagination.current = this.pagination.start;
    }
    if(this.pagination.current > this.pagination.end) {
      this.pagination.current = this.pagination.end;
    }
    // this.getBlocks();
    this.getNextBlocks();
  }

  getBlocks() {
    this.gettingMasternodes = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/listMasternodes/' + this.pagination.limit;
    console.log('url', url)
    this.http.get(url).subscribe(
      (masternodes: []) => {
        this.masternodes = masternodes;
        this.currentTable = this.emptyTable.slice();
        for(var i = 0; i< this.currentTable.length; i++) {
          this.currentTable[i] = this.masternodes[i];
        }
        this.gettingMasternodes = false;
        this.setPages();
      },
      (error) => {
        console.log(error)
        this.gettingMasternodes = false;
      }
    )
  }
  getNextBlocks() {
    this.currentTable = this.emptyTable.slice();
    for(var i = 0; i< this.currentTable.length; i++) {
      this.currentTable[i] = this.masternodes[(this.pagination.current - 1) * this.pagination.limit + i];
    }
  }
  @HostListener('window:resize')
  onWindowResize() {
    //debounce resize, wait for resize to finish before doing stuff
    if(window.innerWidth <= 415) {
      this.pagination.maxPages = 5;
    } else {
      this.pagination.maxPages = 10;
    }
    this.setPages();
  }

}
