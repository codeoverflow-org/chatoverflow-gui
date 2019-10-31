import {Component, HostBinding} from "@angular/core";
import {UpgradableComponent} from "theme/components/upgradable";
import {ConfigInfo, ConfigService} from "@codeoverflow-org/chatoverflow";
import {Router} from "@angular/router";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent extends UpgradableComponent {
  @HostBinding('class.mdl-grid') private readonly mdlGrid = true;

  private serverMessage = "Connecting...";
  private serverMessageClass = "color-text--orange";

  constructor(private configService: ConfigService, private router: Router) {
    super();

    this.refreshServerStatus();
  }

  openREPL() {
    this.router.navigate([`app/wip/`]);
  }

  refreshServerStatus() {
    this.configService.getConfig().subscribe((response: ConfigInfo) => {
      this.serverMessage = "Connected!";
      this.serverMessageClass = "color-text--green";
    }, error => {
      this.serverMessage = "Unable to connect.";
      this.serverMessageClass = "color-text--red";
    });
  }
}
