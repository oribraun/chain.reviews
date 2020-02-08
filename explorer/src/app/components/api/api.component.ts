import { Component, OnInit } from '@angular/core';

declare let DATA: any;
@Component({
  selector: 'app-api',
  templateUrl: './api.component.html',
  styleUrls: ['./api.component.less']
})
export class ApiComponent implements OnInit {

  public api:any[] = [];
  constructor() { }

  ngOnInit() {
    let data: any = {}; /// from server node ejs data
    if (typeof DATA !== "undefined") {
      data = DATA;
    }
    this.api = [
      {url: window.location.origin + "/public-api/db/" + data.wallet + "/getdifficulty", desc:"Returns the current difficulty."},
      {url:window.location.origin + "/public-api/db/" + data.wallet + "/getconnectioncount", desc:"Returns the number of connections the block explorer has to other nodes."},
      {url:window.location.origin + "/public-api/db/" + data.wallet + "/getblockcount", desc:"Returns the current block index."},
      {url:window.location.origin + "/public-api/db/" + data.wallet + "/getblockhash/1", desc:"Returns the hash of the block at ; index 0 is the genesis block."},
      {url:window.location.origin + "/public-api/db/" + data.wallet + "/getblock/00000ae6d22cf38ad8bb55538f508bcf84c0ace873e87ef4cc200e366e848412", desc:"Returns information about the block with the given hash."},
      {url:window.location.origin + "/public-api/db/" + data.wallet + "/getrawtransaction/229da48a3dc5cb3daf02734b22138210d7c98ea2ce340ff4251a54ab7c79eafa", desc:"Returns raw transaction representation for given transaction id"},
      {url:window.location.origin + "/public-api/db/" + data.wallet + "/getnetworkhashps", desc:"Returns the current network hashrate. (hash/s)"},
      {url:window.location.origin + "/public-api/db/" + data.wallet + "/getmoneysupply", desc:"Returns current money supply"},
      {url:window.location.origin + "/public-api/db/" + data.wallet + "/getdistribution", desc:"Returns wealth distribution stats"},
      {url:window.location.origin + "/public-api/db/" + data.wallet + "/getAddress/DLBKUG2dwJyXCF9FaTG55W2fjEjypZqVRZ", desc:"Returns information for given address"}
    ]
  }

}
