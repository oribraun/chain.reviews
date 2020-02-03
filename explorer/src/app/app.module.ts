import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import {FormsModule} from "@angular/forms";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BlocksComponent } from './components/blocks/blocks.component';
import { RangePipe } from './pipes/range/range.pipe';
import { PrettyTimePipe } from './pipes/prettyTime/pretty-time.pipe';
import { HeaderComponent } from './components/header/header.component';
import { TxComponent } from './components/tx/tx.component';
import { BlockComponent } from './components/block/block.component';
import { AddressComponent } from './components/address/address.component';
import { RichlistComponent } from './components/richlist/richlist.component';
import { MasternodesComponent } from './components/masternodes/masternodes.component';
import { FilterPipe } from './pipes/filter/filter.pipe';

@NgModule({
  declarations: [
    AppComponent,
    BlocksComponent,
    RangePipe,
    PrettyTimePipe,
    HeaderComponent,
    TxComponent,
    BlockComponent,
    AddressComponent,
    RichlistComponent,
    MasternodesComponent,
    FilterPipe,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  exports: [
    PrettyTimePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
