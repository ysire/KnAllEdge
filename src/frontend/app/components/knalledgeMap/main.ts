import {Component, Inject} from '@angular/core';
import {upgradeAdapter} from '../../js/upgrade_adapter';
import {MD_SIDENAV_DIRECTIVES} from '@angular2-material/sidenav';
// import {LoginStatusComponent} from '../login/login-status-component';
// import {Media, MdContent, MdButton} from 'ng2-material';
import {MATERIAL_DIRECTIVES, Media} from "ng2-material";
import {MdToolbar} from '@angular2-material/toolbar';
//import {OVERLAY_PROVIDERS} from '@angular2-material/core/overlay/overlay';
// http://stackoverflow.com/questions/35533783/angular2-unable-to-navigate-to-url-using-location-gourl

import { Router, ROUTER_DIRECTIVES} from '@angular/router';

import {KnalledgeMapTools} from './tools';
import {KnalledgeMapPolicyService} from './knalledgeMapPolicyService';
import {KnalledgeMapViewService} from './knalledgeMapViewService';
// import {RequestService} from '../request/request.service';
import {GlobalEmitterServicesArray} from '../collaboPlugins/GlobalEmitterServicesArray';
import {BrainstormingFormComponent} from '../brainstorming/brainstorming-form.component';
//import {BrainstormingService} from '../brainstorming/brainstorming.service';
import {MediaShowComponent} from '../mediaShow/mediaShow.component';
import {BottomPanel} from '../bottomPanel/bottomPanel';

declare var window;

// import {DbAuditService} from './dbAudit.service';
// import {Change} from '../change/change';
// import {ChangeService} from "../change/change.service";

// TODO: probable remove later, this is just to trigger starting the service
// import {BroadcastManagerService} from '../collaboBroadcasting/broadcastManagerService';

/**
 * Directive that handles the main KnAllEdge or rather CollaboFramework user interface
 *
 * Selector: `knalledge-map-main`
 * @class KnalledgeMapMain
 * @memberof knalledge.knalledgeMap
 * @constructor
*/

// @RouteConfig([
//     {
//         path: "/",
//         name: "root",
//         redirectTo: ["/Home"]
//     },
//
//     {
//         path: "/maps",
//         name: "Maps",
//         // component: HomeComponent,
//         redirectTo: ["/maps"]
//      useAsDefault: true
//  },
//     {path: '/disaster', name: 'Asteroid', redirectTo: ['CrisisCenter', 'CrisisDetail', {id:3}]}
// ])
//

import {PluginsPreloader} from '../collaboPlugins/pluginsPreloader';

var componentDirectives = [
    MATERIAL_DIRECTIVES,
    MD_SIDENAV_DIRECTIVES,
    ROUTER_DIRECTIVES,
    MdToolbar,
    // MdContent, MdButton,
    //   LoginStatusComponent,
    upgradeAdapter.upgradeNg1Component('knalledgeMap'),
    //  upgradeAdapter.upgradeNg1Component('knalledgeMapTools'),
    upgradeAdapter.upgradeNg1Component('knalledgeMapList'),
//  upgradeAdapter.upgradeNg1Component('ibisTypesList'),
    KnalledgeMapTools,
    BrainstormingFormComponent,
    MediaShowComponent,
    BottomPanel
];

PluginsPreloader.loadDirectivesDependenciesForCoponent('knalledgeMap.Main', componentDirectives);

if (Config.Plugins.puzzles.ontov.active) {
    componentDirectives.push(upgradeAdapter.upgradeNg1Component('ontovSearch'));
}

@Component({
    selector: 'knalledge-map-main',
    moduleId: module.id,
    templateUrl: 'partials/main.tpl.html',
    providers: [
        // MATERIAL_PROVIDERS,
      //  OVERLAY_PROVIDERS,
        // DbAuditService,
        // ChangeService
        // provideRouter
        // RequestService
        // ROUTER_PROVIDERS
        // BrainstormingService
    ],
    directives: componentDirectives,
    // necessary for having relative paths for templateUrl
    // http://schwarty.com/2015/12/22/angular2-relative-paths-for-templateurl-and-styleurls/
    // t_emplateUrl: 'components/knalledgeMap/partials/main.tpl.html',
    styles: [`

    `]
})

export class KnalledgeMapMain {
    userUrl: String = "www.CollaboScience.com"; //TODO: CF?!
    policyConfig: any;
    viewConfig: any;
    public pluginsConfig: any;
    topPanelVisible: boolean = true;
    status: String;
    navigator = window.navigator;
    private rimaService;
    private knalledgeMapVOsService;


    constructor(
        // public router: Router,
        @Inject('KnalledgeMapViewService') knalledgeMapViewService: KnalledgeMapViewService,
        @Inject('KnalledgeMapPolicyService') private knalledgeMapPolicyService: KnalledgeMapPolicyService,
        @Inject('Plugins') private Plugins,
        @Inject('RimaService') private RimaService,
        @Inject('KnalledgeMapVOsService') _KnalledgeMapVOsService_,
        @Inject('GlobalEmitterServicesArray') private globalEmitterServicesArray: GlobalEmitterServicesArray//,
        // public dbAuditService: DbAuditService
        ) {
        console.log('[KnalledgeMapMain] loaded');
        this.viewConfig = knalledgeMapViewService.get().config;
        this.policyConfig = knalledgeMapPolicyService.get().config;
        this.pluginsConfig = Config.Plugins;
        try {
            this.rimaService = RimaService;
            // * @param  {rima.rimaServices.RimaService}  RimaService
            //   this.rimaService = this.Plugins.puzzles.rima.config.rimaService.available ?
            //   this.$injector.get('RimaService') : null;
        } catch (err) {
            console.warn(err);
        }

        this.knalledgeMapVOsService = _KnalledgeMapVOsService_;
        // this.broadcastManagerService = broadcastManagerService;
        // globalEmitterServicesArray.register('KnalledgeMapMain');
        // globalEmitterServicesArray.get().subscribe('KnalledgeMapMain', (data) => alert("[KnalledgeMapMain]:"+data));
        // globalEmitterServicesArray.broadcast('KnalledgeMapMain', "Hello from KnalledgeMaKnalledgeMapMainpTools!");
    };

    // testMain() {
      // this.dbAuditService.hello();
      // this.dbAuditService.getOne('577d5cb55be86321489aacaa')
      //     .subscribe(
      //     audit => alert("audit: " +
      //         JSON.stringify(audit)),
      //     error => alert("error: " +
      //         JSON.stringify(error))
      //     );
      //
      // //POST:
      // var change = new Change();
      // change.value = {name:'from NG2 TS service'};
      // this.dbAuditService.create(change)
      //     .subscribe(
      //     result => alert("result: " +
      //         JSON.stringify(result)),
      //     error => alert("error: " +
      //         JSON.stringify(error))
      //     );
    // }

    customClose(interesting: boolean) {
        if (interesting) {
            this.status = 'That article was interesting.';
        } else {
            this.status = 'Look for something else.';
        }
    }

    navigateBack() {
        //http://localhost:5556/#/map/id/577e948861ab114d16732cb9?node_id=577e948861ab114d16732cda
        //->
        //http://localhost:5556/#/mcmap/id/577e948861ab114d16732cb9
        var mapRoute: string = 'mcmap'; //Config.Plugins.puzzles.mapsList.config.openMap.routes[0].route;
        var mapId: string = this.knalledgeMapVOsService.map._id;
        window.location.href = "#/" + mapRoute + "/id/" + mapId;
    }

    turnOffEditingNode(event) {
        this.viewConfig.states.editingNode = null;
    }

    getMapName(): any {
        return this.knalledgeMapVOsService.map ? this.knalledgeMapVOsService.map.name : 'loading ...';
    }
    followBroadcast(value: boolean): any {
        this.policyConfig.broadcasting.receiveNavigation = value;
    }
    broadcast(value: boolean): any {
        this.policyConfig.broadcasting.enabled = value;
    }
    toggleTopPanel(): any {
        this.viewConfig.panels.topPanel.visible = !this.viewConfig.panels.topPanel.visible;
    }
    getLoggedInUserName(): any {
        var whoAmI = this.rimaService ?
            this.rimaService.getWhoAmI() :
            this.Plugins.puzzles.rima.config.rimaService.ANONYMOUS_USER_ID;
        var name = this.rimaService ?
            this.rimaService.getNameFromUser(whoAmI) :
            this.Plugins.puzzles.rima.config.rimaService.ANONYMOUS_USER_NAME;
        return name;
    }
    getActiveUserName(): any {
        var whoAmI = this.rimaService.getActiveUser();
        var name = this.rimaService.getNameFromUser(whoAmI);
        return name;
    }
    // hasMedia(breakSize: string): boolean {
    //     return Media.hasMedia(breakSize);
    // }
    showContactOptions: Function = function(event) {
        return;
    };

    public go(path: string) {
        // TODO: not implemented
        // alert("Not implemented");
        // this.router.navigate(['/hero', hero.id]);
        //I assumed your `/home` route name is `Home`
        // this._router.navigate([path]); //this will navigate to Home state.
        //below way is to navigate by URL
        //this.router.navigateByUrl('/home')
        // https://angular.io/docs/ts/latest/api/common/index/Location-class.html
        // this.location.go('#/' + path);
        window.location.href = '#/' + path;
    };
}
