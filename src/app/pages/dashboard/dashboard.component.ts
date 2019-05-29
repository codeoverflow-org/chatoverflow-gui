import {Component, HostBinding} from "@angular/core";
import {UpgradableComponent} from "theme/components/upgradable";
import {ConfigService, ConfigInfo} from "chatoverflow-api";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent extends UpgradableComponent {
  @HostBinding('class.mdl-grid') private readonly mdlGrid = true;

  private generatedMessage = "Connecting to the server...";

  constructor(private configService: ConfigService) {
    super();

    configService.getConfig().subscribe((response: ConfigInfo) => {
      this.generatedMessage = `You're running Chat Overflow v${response.apiMajorVersion}.${response.apiMinorVersion}`
    });
  }
}
