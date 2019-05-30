import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {AppRoutingModule} from "./app-routing.module";
import {AppComponent} from "./app.component";
import {DashboardModule} from "./pages/dashboard";
import {ApiModule} from "chatoverflow-api";
import {HttpClientModule} from "@angular/common/http";
import {BetterREPLComponent} from "./pages/betterrepl/betterrepl.component";
import {ThemeModule} from "../theme/theme.module";

@NgModule({
  declarations: [AppComponent, BetterREPLComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DashboardModule,
    HttpClientModule,
    ApiModule,
    ThemeModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {
}
