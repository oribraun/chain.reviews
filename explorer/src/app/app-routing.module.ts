import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {BlocksComponent} from "./components/blocks/blocks.component";
import {TxComponent} from "./components/tx/tx.component";
import {BlockComponent} from "./components/block/block.component";
import {AddressComponent} from "./components/address/address.component";
import {RichlistComponent} from "./components/richlist/richlist.component";
import {MasternodesComponent} from "./components/masternodes/masternodes.component";
import {MovementComponent} from "./components/movement/movement.component";


const routes: Routes = [
  { path: '', component: BlocksComponent },
  { path: 'block/:hash', component: BlockComponent },
  { path: 'tx/:hash', component: TxComponent },
  { path: 'address/:address', component: AddressComponent },
  { path: 'richlist', component: RichlistComponent },
  { path: 'masternodes', component: MasternodesComponent },
  { path: 'movement', component: MovementComponent },
  // { path: 'login', component: LoginComponent },
];

@NgModule({
  // imports: [RouterModule.forRoot(routes, { enableTracing: true, useHash: true })],
  imports: [RouterModule.forRoot(routes, { useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
