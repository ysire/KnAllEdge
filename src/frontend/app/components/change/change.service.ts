import { Injectable, Inject } from '@angular/core';
import { Http, HTTP_PROVIDERS, Response } from '@angular/http';
import { Observable }     from 'rxjs/Observable';
import { Headers, RequestOptions } from '@angular/http';

import {Change, ChangeVisibility, ChangeType, State, Domain} from './change';
import {GlobalEmitterServicesArray} from '../collaboPlugins/GlobalEmitterServicesArray';


// operators
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

// statics
import 'rxjs/add/observable/throw';

/*
* HTTP
* https://angular.io/docs/ts/latest/guide/server-communication.html
* https://angular.io/docs/ts/latest/api/http/index/Http-class.html
*
* Services
* https://angular.io/docs/ts/latest/tutorial/toh-pt4.html
*
* Promises vs Observables:
* https://angular.io/docs/ts/latest/guide/server-communication.html#!#promises
* 	"While promises may be more familiar, observables have many advantages. Don't rush to promises until you give observables a chance."
* http://blog.thoughtram.io/angular/2016/01/06/taking-advantage-of-observables-in-angular2.html
*/

/*
for showing structural changes, reacting on node-created, node-updated, node-deleted
(in future also for edge-deleted and edge-updated (in a case that a node is relinked, or edge/name is changed))
 */
@Injectable()
export class ChangeService {
    private _onChangeHandlers: Function[] = [];
    private changes: Change[] = [];
    private apiUrl: string = "http://127.0.0.1:8888/dbAudits/";
    private rimaService:any = null;
    private mapVOsService:any = null;
    private mapId: string = null;

    /**
     * Service constructor
     * @constructor
     * @memberof topiChat.TopiChatService
     * @param  socketFactory         [description]
     * @param  $rootScope            [description]
     * @param  {Object} ENV                   [description]
     * @param  {Service} TopiChatConfigService - TopiChat Config service
     */
    constructor(
      //  @Inject('RimaService') private rimaService,
        @Inject('$injector') private $injector,
        // @Inject('KnalledgeMapVOsService') private knalledgeMapVOsService,
        @Inject('GlobalEmitterServicesArray') private globalEmitterServicesArray: GlobalEmitterServicesArray,
        private http: Http
        ) {
        //console.log('RequestService:constructor');

        // let changePluginOptions: any = {
        //   name: "ChangeService",
        //   events: {
        //   }
        // };
        // changePluginOptions.events[this.knAllEdgeRealTimeService.EVENT_NAME_REQUEST] = this.receivedChange.bind(this);
        // this.knAllEdgeRealTimeService.registerPlugin(changePluginOptions);

        // this.getMockupChanges();
        //console.log("[ChangeService]: this.http: ", this.http);
        this.changes = [];
    }

    set onChangeHandler(h: Function){
      for(var i: number = 0; i < this._onChangeHandlers.length; i++){
        if(this._onChangeHandlers[i] === h) return;
      }
      this._onChangeHandlers.push(h);
    }

    init():void{
      this.rimaService = this.$injector.get('RimaService');
      this.mapVOsService = this.$injector.get('KnalledgeMapVOsService');
      this.mapId = this.mapVOsService.getMapId();
    }

    getChangesFromServer(callback?: Function){
      if(!this.mapId){
        console.error('[getChangesFromServer]:mapId == null');
        return;
      }
      this.getChangesInMap(this.mapId)
          .subscribe(
      audit => this.changesForMapReceived(audit, callback),
      error => alert("error: " +
          JSON.stringify(error))
      );
    }

    processReferences(change: Change) {
      //MOCKUP: {_id: change.iAmId, displayName:'user:'+change.iAmId.substr(19)};
      if(this.rimaService){change.iAmId = this.rimaService.getUserById(change.iAmId);}
      //MOCKUP: {_id: change.reference, name:'object:'+change.reference.substr(19)};
      switch(change.domain){
        case Domain.NODE:
          if(this.mapVOsService){change.reference = this.mapVOsService.getNodeById(change.reference);}
        break;
        case Domain.EDGE:
          //TODO: var edge = this.mapVOsService.getEdgeById(change.reference);
          //change.reference = this.mapVOsService.getNodeById(edge.sourceId);
          change.reference = null;
        break;
      }
      return change;
    }

    processChangeFromServer(changeFromServer: any): Change {
      var change = Change.changeFactory(changeFromServer);
      change.state = State.SYNCED;
      change = this.processReferences(change);
      return change;
    }

    changesForMapReceived(changes:any[], callback?: Function){
      //alert("audit: " +JSON.stringify(changes));
      for(var i = 0; i< changes.length; i++){
        changes[i] = this.processChangeFromServer(changes[i]);
      }
      this.changes = changes;
      this.callOnChangeHandlers(changes.length);
      if(typeof callback === 'function'){callback(this.changes);}
    }

    getMockupChanges() {
        var r1: Change = new Change();
        r1.iAmId = "556760847125996dc1a4a24f";
        r1.reference = "57816d593212be5142d1de20";
        r1.type = ChangeType.STRUCTURAL;
        var r2: Change = new Change();
        r2.iAmId = "556760847125996dc1a4a241";
        r2.reference = "57816da83212be5142d1de34";
        r2.type = ChangeType.STRUCTURAL;
        var r3: Change = new Change();
        r3.iAmId = "556760847125996dc1a4a241";
        r3.reference = "57816de13212be5142d1de6d";
        r3.type = ChangeType.STRUCTURAL;
        this.changes = [];
        this.changes.push(this.processReferences(r1));
        this.changes.push(this.processReferences(r2));
        this.changes.push(this.processReferences(r3));
    }

    getChangesRef() {
        //this.getMockupChanges();
        return this.changes;
    }

    create(change:Change, callback?: Function): void{
        this.post(change)
            .subscribe(
        changeFromServer => this.changeCreated(changeFromServer, callback),
        error => console.error("error: " +
            JSON.stringify(error))
        );
      ;
    }

    private callOnChangeHandlers(no:number):void {
      for(var i: number = 0; i < this._onChangeHandlers.length; i++){
        this._onChangeHandlers[i](no);
      }
    }

    private changeCreated(changeFromServer, callback?: Function):void{
      var change:Change = this.processChangeFromServer(changeFromServer);
      this.changes.push(change);
      this.callOnChangeHandlers(1);
      if(typeof callback === 'function'){callback(change);}
    }

    private extractData(res: Response) {
        let body = res.json();
        return body.data || {};
    }

    private handleError(error: any) {
        // In a real world app, we might use a remote logging infrastructure
        // We'd also dig deeper into the error to get a better message
        let errMsg = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : 'Server error';
        console.error(errMsg); // log to console instead
        return Observable.throw(errMsg);
    }

    private getOne(id: string): Observable<any> {
        return this.http.get(this.apiUrl + "one/" + id)
            .map(this.extractData)
            .catch(this.handleError);
    }

    private post(change: Change): Observable<Change> {
        //let body = JSON.stringify(change);
        let body = angular.toJson(change);
        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers });

        return this.http.post(this.apiUrl, body, options)
            .map(this.extractData)
            .catch(this.handleError);
    }

    private getChangesInMap(mapId: string): Observable<any> {
        return this.http.get(this.apiUrl + "in_map/" + mapId)
            .map(this.extractData)
            .catch(this.handleError);
    }
}
