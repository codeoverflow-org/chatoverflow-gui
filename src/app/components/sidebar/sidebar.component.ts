import {Component} from "@angular/core";
import {SidebarComponent as BaseSidebarComponent} from "theme/components/sidebar";

@Component({
  selector: 'app-sidebar',
  styleUrls: ['../../../theme/components/sidebar/sidebar.component.scss'],
  templateUrl: '../../../theme/components/sidebar/sidebar.component.html',
})
export class SidebarComponent extends BaseSidebarComponent {
  public title = 'Chat Overflow';
  public menu = [
    { name: 'Dashboard', link: '/app/dashboard', icon: 'dashboard' },
    {name: 'Better REPL', link: '/app/wip', icon: 'edit'},
    {name: 'Code Overflow', href: 'http://codeoverflow.org', icon: 'public'}
    /*{
      name: 'Auth', children: [
      { name: 'Sign in', link: '/auth/login' },
      { name: 'Sign up', link: '/auth/sign-up' },
      { name: 'Forgot password', link: '/auth/forgot-password' }],
      icon: 'lock',
    },
     { name: '404', link: '/404', icon: 'build' },*/
  ];
}
