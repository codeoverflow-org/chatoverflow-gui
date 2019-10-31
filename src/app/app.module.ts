import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {AppRoutingModule} from "./app-routing.module";
import {AppComponent} from "./app.component";
import {DashboardModule} from "./pages/dashboard";
import {ApiModule, BASE_PATH} from "@codeoverflow-org/chatoverflow";
import {HttpClientModule} from "@angular/common/http";
import {BetterREPLComponent} from "./pages/betterrepl/betterrepl.component";
import {ThemeModule} from "../theme/theme.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

@NgModule({
  declarations: [AppComponent, BetterREPLComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DashboardModule,
    HttpClientModule,
    ApiModule,
    ThemeModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    {
      provide: BASE_PATH,
      useValue: `http://${window.location.hostname}:2400`
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
