import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {BlocksComponent} from "./components/blocks/blocks.component";


const routes: Routes = [
  { path: '', component: BlocksComponent },
  // { path: 'login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
