import { Injectable, Inject } from '@angular/core';
import {GlobalEmitterServicesArray} from '../collaboPlugins/GlobalEmitterServicesArray';
import {KnalledgeMapPolicyService} from '../knalledgeMap/knalledgeMapPolicyService';
//import {CollaboPluginsService} from 'collabo';
import {Brainstorming, BrainstormingPhase, BrainstormingPhaseNames, BrainstrormingDecorations} from './brainstorming';
import {Change, ChangeType, Domain, Event} from '../change/change';
import {CollaboGrammarService} from '../collaboPlugins/CollaboGrammarService';
import {InfoForDialog} from '../../js/interaction/infoForDialog';

declare var d3:any;
declare var knalledge;

@Injectable()
export class BrainstormingService {
  //public static MaxId: number = 0;
  //public id:number;
  plugins:any = {
      mapVisualizePlugins: {
          service: this,
          init: function init() {
              var that = this;
          },

          nodeHtmlEnter: function(nodeHtmlEnter){
              var service = this; // keeping reference on the service

              // .filter(function(d) { return d.kNode.dataContent && d.kNode.dataContent.image; })
              nodeHtmlEnter.append("div")
                  .attr("class", "brainstorming_decoration")
                  // .on("click", function(d){
                  //     d3.event.stopPropagation();
                  //     service.changeApproval(d);
                  //     // d3.select(this).remove();
                  //     // d3.select(this).style("display", "none");
                  // })
                  .html(function(d){
                    var label = "<i class='fa fa-user-secret' aria-hidden='true'></i>";
                    //var label = "<i class='fa fa-eye-slash' aria-hidden='true'></i>";
                    //var label = "<i class='fa fa-eye' aria-hidden='true'></i>";
                    return label;
                  });
          }.bind(this), // necessary for keeping reference on service

          nodeHtmlUpdate: function(nodeHtmlUpdate){
            var that = this;
              nodeHtmlUpdate.select(".brainstorming_decoration")
                  .style("display", function(d){
                      var display = "none";
                      // if((d.kNode.gardening && d.kNode.gardening.approval && d.kNode.gardening.approval.state)){
                      // 	display = "block";
                      // }
                      if(that.service.showDecoration(d)){
                        display = "block";
                      }
                      return display;
                  })
                  // .style("width", '2em')
                  // .style("height", '2em')
                  .html(function(d){
                    var label = "<i class='fa fa-user-secret' aria-hidden='true'></i>";
                    //var label = "<i class='fa fa-eye-slash' aria-hidden='true'></i>";
                    return label;
                  })
                  .style("opacity", 1e-6);

              var nodeHtmlUpdateTransition = nodeHtmlUpdate.select(".brainstorming_decoration").transition().delay(300).duration(500)
                  .style("opacity", 0.8);
          },

          nodeHtmlExit: function(nodeHtmlExit){
              nodeHtmlExit.select(".brainstorming_decoration")
                  .on("click", null);
          }
      }
  };

    brainstorming: Brainstorming = new Brainstorming();

    //brainstorming-panel-settings:
    public showOnlyBrainstorming: boolean = true;
    public previousPhase: number = BrainstormingPhase.INACTIVE;

    private brainstormingPluginInfo: any;
    private knAllEdgeRealTimeService: any;
    private showSubComponentInBottomPanelEvent: string = "showSubComponentInBottomPanelEvent";
    private hideBottomPanelEvent: string = "hideBottomPanelEvent";

    private initiated:boolean = false;
    private previousIdeasPresenter: boolean = null;
    private rimaService:any = null;
    private SHOW_INFO: string = "SHOW_INFO";
    private PRESENTER_CHANGED: string = "PRESENTER_CHANGED";
    private REQUEST_TO_CHANGE_SESSION_PARAMETER: string = "REQUEST_TO_CHANGE_SESSION_PARAMETER";

    /**
     * Service constructor
     * @constructor
     */
    constructor(
        @Inject('$injector') private $injector,
        //  @Inject('RimaService') private rimaService,
        // @Inject('KnalledgeMapVOsService') private knalledgeMapVOsService,
        @Inject('GlobalEmitterServicesArray') private globalEmitterServicesArray: GlobalEmitterServicesArray,
        @Inject('KnalledgeMapPolicyService') private knalledgeMapPolicyService: KnalledgeMapPolicyService,
        @Inject('CollaboPluginsService') private collaboPluginsService,
        private collaboGrammarService : CollaboGrammarService
        ) {
        let that = this;
        //this._id = ++BrainstormingService.MaxId;
        globalEmitterServicesArray.register(this.showSubComponentInBottomPanelEvent);
        this.globalEmitterServicesArray.register(this.SHOW_INFO);
        this.globalEmitterServicesArray.register(this.REQUEST_TO_CHANGE_SESSION_PARAMETER);

        this.globalEmitterServicesArray.register(this.PRESENTER_CHANGED);
        this.globalEmitterServicesArray.get(this.PRESENTER_CHANGED).subscribe('SessionService', this.presenterChanged.bind(this));

        this.knAllEdgeRealTimeService = this.$injector.get('KnAllEdgeRealTimeService');
        let requestPluginOptions: any = {
            name: "RequestService",
            events: {
            }
        };
        if (this.knAllEdgeRealTimeService) {
            requestPluginOptions.events[Event.BRAINSTORMING_CHANGED] = this.receivedBrainstormingChange.bind(this);
            this.knAllEdgeRealTimeService.registerPlugin(requestPluginOptions);
        }

        //this.collaboPluginsService = this.$injector.get('CollaboPluginsService');
        this.brainstormingPluginInfo = {
            name: "brainstorming",
            components: {

            },
            references: {
                mapVOsService: {
                    items: {
                        nodesById: {},
                        edgesById: {},
                    },
                    $resolved: false,
                    callback: null,
                    $promise: null
                },
                map: {
                    items: {
                        mapStructure: {
                            nodesById: {},
                            edgesById: {}
                        }
                    },
                    $resolved: false,
                    callback: null,
                    $promise: null
                }
            },
            apis: {
                map: {
                    items: {
                        update: null,
                        nodeSelected: null
                    },
                    $resolved: false,
                    callback: null,
                    $promise: null
                },
                mapInteraction: {
                    items: {
                        addNode: null,
                        updateNodeDecoration: null
                    },
                    $resolved: false,
                    callback: null,
                    $promise: null
                },
                ontov: {
                    items: {
                        setSearch: null,
                        getSearch: null,
                        setOperation: null,
                        addSearchItem: null,
                        removeSearchItem: null
                    },
                    $resolved: false,
                    callback: null,
                    $promise: null
              }
            }
        };

        // this.brainstormingPluginInfo.references.map.$promise = $q(function(resolve, reject) { /*jshint unused:false*/
        this.brainstormingPluginInfo.references.map.callback = function() {
            that.brainstormingPluginInfo.references.map.$resolved = true;
            // resolve(that.brainstormingPluginInfo.references.map);
            // reject('not allowed');
        };
        // });
        //
        // this.brainstormingPluginInfo.apis.map.$promise = $q(function(resolve, reject) { /*jshint unused:false*/
        this.brainstormingPluginInfo.apis.map.callback = function() {
            that.brainstormingPluginInfo.apis.map.$resolved = true;
            // resolve(that.brainstormingPluginInfo.apis.map);
            // reject('not allowed');
        };
        // });
        //

        this.brainstormingPluginInfo.apis.ontov.callback = function() {
            that.brainstormingPluginInfo.apis.ontov.$resolved = true;

            /*
            // this is an example:
            that.brainstormingPluginInfo.apis.ontov.items.setSearch([
              // If you put more than one it will be OR (union)
              // AND is not supported (if we need it we need to talk :) )
              // {
              //   category: 'Type',
              //   value: 'type_ibis_question'
              // }

              // for some reason this doesn't filter
              // {
              //   category: 'iAmId',
              //   value: '556760847125996dc1a4a241'
              // }

              // {
              //   category: 'Tree',
              //   value: 'Ideological model' // node name
              // }
              //



            ]);
            */
        };

        this.collaboPluginsService.registerPlugin(this.brainstormingPluginInfo);
    }

    init(){
      if(!this.initiated){
        this.initiated = true;
        this.rimaService = this.$injector.get('RimaService');
      }
    }

    restart(){
      let question = this.brainstorming.question;
      this.brainstorming.reset();
      this.brainstorming.question = question;
    }

    getIamId(){
      var iAmId = this.rimaService.getActiveUserId();
      return iAmId;
    }

    prepareOntov(){
      if(this.brainstormingPluginInfo.apis.ontov.items.setOperation){
        this.brainstormingPluginInfo.apis.ontov.items.setOperation(1);
      }
      this.filterOntov([]);
    }

    restoreOntov(){
      if(this.brainstormingPluginInfo.apis.ontov.items.setOperation){
        this.brainstormingPluginInfo.apis.ontov.items.setOperation(0);
      }
    }

    /**
     * Set ontov filters
     * @param  {[type]}  searchesObj filters to be applied
     * @param  {Boolean} [filter]      if it is undefined it replace filters with provided
     * If it is false it removes provided filters from ontov
     * If it is true it adds filters to ontov
     */
    filterOntov(searchesObj, filter?:Boolean) {
      if(typeof filter === 'undefined'){
        if(this.brainstormingPluginInfo.apis.ontov.items.setSearch){
          this.brainstormingPluginInfo.apis.ontov.items.setSearch(searchesObj);
        }
      }else{
        for(var sI in searchesObj){
          var searchObj = searchesObj[sI];
          if(filter){
            if(this.brainstormingPluginInfo.apis.ontov.items.addSearchItem){
              this.brainstormingPluginInfo.apis.ontov.items.addSearchItem(searchObj);
            }
          }else{
            if(this.brainstormingPluginInfo.apis.ontov.items.removeSearchItem){
              this.brainstormingPluginInfo.apis.ontov.items.removeSearchItem(searchObj);
            }
          }
        }
      }
    }

    get iAmPresenter(): boolean {
      return this.knalledgeMapPolicyService.get().config.broadcasting.enabled;
    }

    checkAndSetupQuestion(brainstorming:Brainstorming): boolean {
      if (!this.brainstormingPluginInfo.references.map.$resolved) return false;

      var node = this.brainstormingPluginInfo.references.map.items.mapStructure.getSelectedNode();
      if(!node || node.kNode.type !== knalledge.KNode.TYPE_IBIS_QUESTION) {
        return false;
      }else{
        brainstorming.question = node;
        return true;
      }
    }

    showDecoration(node: any): boolean {
      return this.isPrivateBSNode(node)
      && this.brainstorming && (this.brainstorming.phase === BrainstormingPhase.IDEAS_GENERATION ||
      this.brainstorming.phase === BrainstormingPhase.SHARING_IDEAS);
    }

    isPrivateBSNode(node: any): boolean {
        return node.kNode.decorations && node.kNode.decorations.brainstorming === BrainstrormingDecorations.PRIVATE;
    }

    sendBrainstorming(callback: Function) {

        // this.brainstorming.mapId = this.knalledgeMapVOsService.getMapId();
        // this.brainstorming.who = this.rimaService.getWhoAmI()._id;
        console.log(this.brainstorming);

        if (this.knAllEdgeRealTimeService) {
            let change = new Change();
            change.value = this.brainstorming.toServerCopy();
            change.reference = this.brainstorming.question.kNode._id;
            change.type = ChangeType.BEHAVIORAL;
            change.domain = Domain.GLOBAL;
            change.event = Event.BRAINSTORMING_CHANGED;
            this.knAllEdgeRealTimeService.emit(change.event, change);
            callback(true);
        } else {
            callback(false, 'SERVICE_UNAVAILABLE');
        }
    }

    public setUpBrainstormingChange(creator:boolean = true){
      this.collaboGrammarService.puzzles.brainstorming.state = this.brainstorming;
      if(this.brainstorming.phase === BrainstormingPhase.INACTIVE){
        this.restoreOntov();
        this.collaboGrammarService.puzzles.brainstorming.state = null;
        //TODO: should we de-inject brainstormingPanel part from the Panel?
        this.globalEmitterServicesArray.get(this.hideBottomPanelEvent)
        .broadcast('BrainstormingService', 'brainstorming.BrainstormingPanelComponent');
      }else{
        this.prepareOntov();
        this.filterToBrainstorming(this.showOnlyBrainstorming);
        this.globalEmitterServicesArray.get(this.showSubComponentInBottomPanelEvent)
        .broadcast('BrainstormingService', 'brainstorming.BrainstormingPanelComponent');
      }
      this.globalEmitterServicesArray.get(this.SHOW_INFO).broadcast('BrainstormingService',
      new InfoForDialog(this.getMessage(), 'Brainstorming'));
      if(creator){
        if(this.brainstorming.phase === BrainstormingPhase.SHARING_IDEAS){
          let change:any = {'parameter':'mustFollowPresenter','value':true};
          this.globalEmitterServicesArray.get(this.REQUEST_TO_CHANGE_SESSION_PARAMETER).broadcast('BrainstormingService', change);
        }else if(this.previousPhase === BrainstormingPhase.SHARING_IDEAS){
          let change:any = {'parameter':'mustFollowPresenter','value':false};
          this.globalEmitterServicesArray.get(this.REQUEST_TO_CHANGE_SESSION_PARAMETER).broadcast('BrainstormingService', change);
        }
      }
      this.brainstormingPluginInfo.apis.map.items.update();
    }

    presenterChanged(presenterVO: any):void{
      if(this.brainstorming.phase === BrainstormingPhase.SHARING_IDEAS){
          if(presenterVO.value){ //filter to presenter's ideas who shares them
            if(this.previousIdeasPresenter){
              //deleting previous filter for 'iAmId'
              this.filterOntov([
                {
                  category: 'iAmId',
                  value: this.previousIdeasPresenter
                }
                ],
                false
              );
            }

            this.filterOntov([
              {
                category: 'iAmId',
                value: presenterVO.user
              }
              ],
              presenterVO.value //true or false, based on if it is set or reset
            );
            this.previousIdeasPresenter = presenterVO.user;
        }else{
          this.previousIdeasPresenter = null;
        }
      }
    }

    finishBrainstorming(){
      this.brainstorming.phase = BrainstormingPhase.INACTIVE;
      this.setUpBrainstormingChange();
    }

    focusToQuestion(){
      //console.log("brainstormingService.focusToQuestion()");
      if(this.brainstorming.question && this.brainstormingPluginInfo.references.map.$resolved){
        this.brainstormingPluginInfo.apis.map.items.nodeSelected(this.brainstorming.question);
        this.brainstormingPluginInfo.apis.map.items.update();
      }
    }

    addIdea(){
      console.log("brainstormingService.addIdea()");
      this.focusToQuestion();
      this.brainstormingPluginInfo.apis.mapInteraction.items.addNode(this.brainstorming.question);
    }

    addArgument(){
      let idea = this.brainstormingPluginInfo.references.map.items.mapStructure.getSelectedNode();
      if(!idea || idea.kNode.type !== knalledge.KNode.TYPE_IBIS_IDEA) {
        this.globalEmitterServicesArray.get(this.SHOW_INFO).broadcast('BrainstormingService',
        new InfoForDialog('You must select an idea to support it by adding an argument to it'));
        return;
      }
      this.brainstormingPluginInfo.apis.mapInteraction.items.addNode(idea);
    }

    presentNextIdea() {
      let that = this;
      let presentedIdea: boolean = false;
      let ideas: any[] = this.brainstormingPluginInfo.references.map.items.mapStructure.getChildrenNodes(this.brainstorming.question);
      for(var i:number = 0; i < ideas.length; i++){
        let idea = ideas[i];
        if(this.brainstormingPluginInfo.references.map.items.mapStructure.isNodeOfActiveUser(idea) && this.isPrivateBSNode(idea)){
          console.log(idea.kNode.type,idea.kNode.iAmId);
          presentedIdea = true;
          this.brainstormingPluginInfo.apis.mapInteraction.items.updateNodeDecoration(idea, Brainstorming.DECORATION,
             BrainstrormingDecorations.PRESENTED,
           function(){
              that.brainstormingPluginInfo.apis.map.items.nodeSelected(idea);

              if(that.brainstorming.allowArgumentsToIdeas){
                //change ideas' arguments from private to public:
                let args: any[] = that.brainstormingPluginInfo.references.map.items.mapStructure.getChildrenNodes(idea);
                for(let ai:number = 0; ai < args.length; ai++){
                  let arg = args[ai];
                  if(that.brainstormingPluginInfo.references.map.items.mapStructure.isNodeOfActiveUser(arg) && that.isPrivateBSNode(arg)){
                    //console.log(arg.kNode.type,arg.kNode.iAmId);
                    that.brainstormingPluginInfo.apis.mapInteraction.items.updateNodeDecoration(arg, Brainstorming.DECORATION,
                       BrainstrormingDecorations.PRESENTED);
                  }
                }
              }
           });

          //delete idea.kNode.decorations.brainstorming;

          // this.brainstormingPluginInfo.references.map.items.mapStructure.
          // updateNode(node, knalledge.MapStructure.UPDATE_NODE_VISUAL_OPEN, idea);
          break;
        }
      }
      if(!presentedIdea){
        this.globalEmitterServicesArray.get(this.SHOW_INFO).broadcast('BrainstormingService',
        new InfoForDialog("You've presented all your ideas"));
      }
    }

    filterToBrainstorming(filter:boolean): void{
      // TODO: set selected node at question or even better check if it is inside the question or not
      this.filterOntov(
        [
          {
            category: 'Tree',
            value: this.brainstorming.question.kNode.name //'Ideological model'
          }
        ],
        filter
        );
    }

    private getMessage():string{
      let message = "";
      switch(this.brainstorming.phase){
  			case BrainstormingPhase.INACTIVE:
  				message += "Brainstorming has become inactive";
          break;
  			case BrainstormingPhase.IDEAS_GENERATION:
  				message += "<p class='title'>Welcome to brainstorming!</p>" +
          "<p>During 4 phases of brainstorming process you will pass through several phases, during which you will develop ideas " +
          "with other particiapants, over the question <span class='emphasize emp_bg'>" + this.brainstorming.question.kNode.name +
          ".</span></p>" +
          "<p>At each phase you will have specific actions and info avaible at bottom <span class='emphasize'>brainstorming panel</span>. "+
          "At this first phase <span class='emphasize emp_bg'>" + BrainstormingPhaseNames.getNameByPhase(this.brainstorming.phase) +
          "</span>, " +
          "you and other participants should individually create as much as possible ideas that come to your mind " +
          "when considering the question.</p>" +
          "<p>You can add <span class='emphasize'>ideas</span> by a button at the brainstorming panel or " +
          "following the regular CollaboFramework procedure " +
          "for adding a node/topic to the topic (question). </p>" +
          (this.brainstorming.createPrivateIdeas ? "<p>All ideas are <span class='emphasize'>private</span> at this phase.</p>" : "") +
          (this.brainstorming.allowArgumentsToIdeas ?
            "<p>For each idea you can add an <span class='emphasize'>argument</span> to support it</p>" : "") +
          "<p>Now, start creating those ideas and good luck!</p>";
          break;
  			case BrainstormingPhase.SHARING_IDEAS:
  				message += "<p>We have now entered 2nd phase <span class='emphasize emp_bg'>" +
          BrainstormingPhaseNames.getNameByPhase(this.brainstorming.phase) + "</span></p>" +
          "<p>Now, moderator will choose one by one participant to present their ideas. You will be noticed when you become a presenter " +
          "and at that moment a button <span class='emphasize emp_bg'>Present Next Idea</span> will show up in the brainstorming panel. " +
          "By pressing it, your ideas will, one by one, become visible to other participants. " +
          "Press it until you present all your ideas.</p>" +
          (this.brainstorming.allowAddingWhileSharingIdeas ? "<p>You are encouraged to <span class='emphasize'>add any new ideas</span> " +
          "that may arise from what others share.</p>" : "");
          break;
  			case BrainstormingPhase.GROUP_DISCUSSION:
          message += "<p>We have now entered 3rd phase <span class='emphasize emp_bg'>" +
          BrainstormingPhaseNames.getNameByPhase(this.brainstorming.phase) + "</span></p>" +
          "<p>Now, you have an opportunity to ask question over other participants ideas. You can do it by following " +
          "the regular CollaboFramework procedure for adding a node/topic (of type 'question') to the topic (idea). (<i>In the recent " +
          "future we will provide you with a button for that</i>)</p>" +
          "<p>But, others might ask you to explain your ideas. So check for any questions added to your ideas. (<i> to simplify that, " +
          "we have provided <span class='emphasize emp_bg'>Ontov filter</span> '4Me / ibis: Question' and a simple button in the future" +
          "</i>)";
          break;
  			case BrainstormingPhase.VOTING_AND_RANKING:
          message += "<p>We have now entered 4th, last phase <span class='emphasize emp_bg'>" +
          BrainstormingPhaseNames.getNameByPhase(this.brainstorming.phase) + "</span></p>" +
          "<p>Now, you should vote for your favorite ideas. Voting is anonymous and votes of all the participants will be " +
          "sumed to find the best <span class='emphasize emp_bg'>Brainstorming ideas</span></p>" +
          "Try to be objective and let the best idea win!";
          break;
  			case BrainstormingPhase.FINISHED:
          message += "We have now entered <span class='emphasize emp_bg'>" +
          BrainstormingPhaseNames.getNameByPhase(this.brainstorming.phase) + "</span> phase";
          break;
  		}
      return message;
    }

    private processReferencesInBrainStorming(brainstorming:Brainstorming): Brainstorming{
      if(typeof brainstorming.question === 'string'){
        brainstorming.question = this.brainstormingPluginInfo.references.map.items.mapStructure.getVKNodeByKId(brainstorming.question);
      }
      return brainstorming;
    }

    private receivedBrainstormingChange(event: string, change: Change) {
        let receivedBrainstorming: Brainstorming = Brainstorming.factory(change.value);
        console.warn("[receivedBrainstormingChange]receivedBrainstorming: ", receivedBrainstorming);
        this.brainstorming = receivedBrainstorming;
        if(this.brainstorming.question && this.brainstormingPluginInfo.references.map.$resolved){
          this.brainstorming = this.processReferencesInBrainStorming(this.brainstorming);
          this.brainstormingPluginInfo.apis.map.items.nodeSelected(this.brainstorming.question);
          this.brainstormingPluginInfo.apis.map.items.update();
          // this.brainstormingPluginInfo.references.map.items.mapStructure.setSelectedNode(this.brainstorming.question);
          // this.brainstormingPluginInfo.apis.map.items.update();
        }
        this.setUpBrainstormingChange(false);
    }

};
