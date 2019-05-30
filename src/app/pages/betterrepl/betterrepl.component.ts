import {Component, HostBinding} from "@angular/core";
import {UpgradableComponent} from "theme/components/upgradable";
import {ResultMessage, ConfigService} from "chatoverflow-api";

@Component({
  selector: 'better-repl',
  templateUrl: './betterrepl.component.html',
  styleUrls: ['./betterrepl.css']
})
export class BetterREPLComponent extends UpgradableComponent {
  @HostBinding('class.mdl-grid') private readonly mdlGrid = true;

  private lastRequestCommand = "...";
  private lastRequestMessage = "Please send a request to the server...";
  private lastRequestSuccessful = true;

  private authKey = "";

  constructor(private configService: ConfigService) {
    super();
  }

  logRequest(command: string, lastRequestSuccessful: boolean, resultMessage: string) {
    this.lastRequestCommand = command;
    this.lastRequestSuccessful = lastRequestSuccessful;
    this.lastRequestMessage = resultMessage;
  }

  logResultMessage(command: string, result: ResultMessage) {
    this.logRequest(command, result.success, result.message);
  }

  login(password: string) {
    this.configService.postLogin({password: password}).subscribe((response: ResultMessage) => {
      this.logResultMessage("postLogin", response);
      if (response.success) {
        this.authKey = response.message;
      }
    });
  }

  register(password: string) {
    this.configService.postRegister({password: password}).subscribe((response: ResultMessage) => {
      this.logResultMessage("postRegister", response);
      if (response.success) {
        this.authKey = response.message;
      }
    });
  }
}
