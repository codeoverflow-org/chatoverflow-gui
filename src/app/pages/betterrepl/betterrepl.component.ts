import {Component, HostBinding} from "@angular/core";
import {UpgradableComponent} from "theme/components/upgradable";

@Component({
  selector: 'better-repl',
  templateUrl: './betterrepl.component.html'
})
export class BetterREPLComponent extends UpgradableComponent {
  @HostBinding('class.mdl-grid') private readonly mdlGrid = true;
}
