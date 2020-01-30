import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BlocksComponent } from './components/blocks/blocks.component';
import { RangePipe } from './pipes/range/range.pipe';
import { PrettyTimePipe } from './pipes/prettyTime/pretty-time.pipe';
import { HeaderComponent } from './components/header/header.component';

@NgModule({
  declarations: [
    AppComponent,
    BlocksComponent,
    RangePipe,
    PrettyTimePipe,
    HeaderComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  exports: [
    PrettyTimePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
