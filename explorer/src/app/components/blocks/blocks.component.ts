import {Component, HostListener, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";

declare var DATA: any;
declare var $: any;
@Component({
  selector: 'app-blocks',
  templateUrl: './blocks.component.html',
  styleUrls: ['./blocks.component.less']
})
export class BlocksComponent implements OnInit {

  public data;
  public blocks: [];
  public emptyTable: any[] = [];
  public currentTable: any[] = [];
  public gettingBlocks = false;
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
    console.log('session data');
    console.log(data);
    this.data = data;
    this.setCurrentTable();
    this.setPages();

  }

  setPages() {
    this.pagination.pages = Math.ceil(this.data.total / this.pagination.maxPages);
    this.pagination.start = this.pagination.start + (this.pagination.offset * this.pagination.maxPages);
    this.pagination.end = this.pagination.maxPages + (this.pagination.offset * this.pagination.maxPages);
    if(this.pagination.start + (this.pagination.offset * this.pagination.maxPages) > this.pagination.pages - this.pagination.maxPages) {
      this.pagination.start = this.pagination.pages - this.pagination.maxPages;
    }
    if(this.pagination.end + (this.pagination.offset * this.pagination.maxPages) > this.pagination.pages) {
      this.pagination.end = this.pagination.pages;
    }
    this.getBlocks();
  }
  setCurrentTable() {
    for(var i = 0; i < this.pagination.maxPages; i++) {
      this.emptyTable.push( { "blockindex": "&nbsp;", "_id": "", "blockhash": "", "timestamp": "" });
    }
    this.currentTable = this.emptyTable.slice();
  }
  nextPage() {
    if(this.gettingBlocks) return;
    if(this.pagination.current < this.pagination.pages) {
      this.pagination.current++;
      this.getBlocks();
    }
    if(this.pagination.end < this.pagination.pages && this.pagination.current > Math.floor(this.pagination.maxPages / 2)) {
      this.pagination.start++;
      this.pagination.end++;
    }
    this.pagination.offset = (this.pagination.current - 1) * this.pagination.maxPages;
  }

  prevPage() {
    if(this.gettingBlocks) return;
    if(this.pagination.current > 1) {
      this.pagination.current--;
      this.getBlocks();
    }
    if(this.pagination.start > 1 && this.pagination.current < this.pagination.pages - Math.ceil(this.pagination.maxPages / 2)) {
      this.pagination.start--;
      this.pagination.end--;
    }
    this.pagination.offset = (this.pagination.current - 1) * this.pagination.maxPages;
  }

  setPage(page) {
    if(this.gettingBlocks) return;
    if(page == this.pagination.current) {
      return;
    }
    this.pagination.current = page;
    this.pagination.offset = (this.pagination.current - 1) * this.pagination.maxPages;

    this.pagination.start = this.pagination.current - Math.floor(this.pagination.maxPages / 2);
    this.pagination.end = this.pagination.current + Math.floor(this.pagination.maxPages / 2);

    if(this.pagination.start < 1) {
      this.pagination.start = 1;
      this.pagination.end = this.pagination.maxPages;
    }
    if(this.pagination.end > this.pagination.pages) {
      this.pagination.end = this.pagination.pages;
      this.pagination.start = this.pagination.end - this.pagination.maxPages;
    }
    this.getBlocks();
  }

  getBlocks() {
    this.gettingBlocks = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getAllBlocks/' + this.pagination.limit + '/' + this.pagination.offset;
    console.log('url', url)
    this.http.get(url).subscribe(
      (blocks: []) => {
        this.blocks = blocks;
        this.currentTable = this.emptyTable.slice();
        for(var i = 0; i< this.blocks.length; i++) {
          this.currentTable[i] = this.blocks[i];
        }
        this.gettingBlocks = false;
      },
      (error) => {
        console.log(error)
        this.gettingBlocks = false;
      }
    )
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
