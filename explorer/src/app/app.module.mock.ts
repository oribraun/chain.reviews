import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import {FormsModule} from "@angular/forms";
import { MockBackendInterceptor } from './services/mock.backend.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BlocksComponent } from './components/blocks/blocks.component';
import { RangePipe } from './pipes/range/range.pipe';
import { PrettyTimePipe } from './pipes/prettyTime/pretty-time.pipe';
import { HeaderComponent } from './components/header/header.component';
import { TxComponent } from './components/tx/tx.component';
import { BlockComponent } from './components/block/block.component';
import { RichlistComponent } from './components/richlist/richlist.component';
import { AddressComponent } from './components/address/address.component';
import { MasternodesComponent } from './components/masternodes/masternodes.component';
import { FilterPipe } from './pipes/filter/filter.pipe';
import { MovementComponent } from './components/movement/movement.component';
import { ApiComponent } from './components/api/api.component';
import { PrettyDaysHoursMinutesPipe } from './pipes/prettyDaysHoursMinutes/pretty-days-hours-minutes.pipe';
import { OrderByPipe } from './pipes/orderBy/order-by.pipe';
import { MarketComponent } from './components/market/market.component';

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
    MovementComponent,
    ApiComponent,
    PrettyDaysHoursMinutesPipe,
    OrderByPipe,
    MarketComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: MockBackendInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModuleMock { }
