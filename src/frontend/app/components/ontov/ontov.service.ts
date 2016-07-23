import { Injectable, Inject } from '@angular/core';
import {GlobalEmitterServicesArray} from '../collaboPlugins/GlobalEmitterServicesArray';

declare var knalledge;

@Injectable()
export class OntovService {
  searchFacets = [];
  public mapUpdate: Function;
  private ontovPluginInfo: any;
  private knAllEdgeRealTimeService: any;
  private registeredFacets: any = {};
  private mapStructure: any;

  /**
   * Service constructor
   * @constructor
   */
  constructor(
    @Inject('$injector') private $injector,
    @Inject('GlobalEmitterServicesArray') private globalEmitterServicesArray: GlobalEmitterServicesArray,
    @Inject('CollaboPluginsService') private collaboPluginsService
    ) {
    let that = this;

    // globalEmitterServicesArray.register(this.showSubComponentInBottomPanelEvent);

    // this.knAllEdgeRealTimeService = this.$injector.get('KnAllEdgeRealTimeService');
    // let requestPluginOptions: any = {
    //     name: "RequestService",
    //     events: {
    //     }
    // };
    // if (this.knAllEdgeRealTimeService) {
    //     requestPluginOptions.events[Event.BRAINSTORMING_CHANGED] = this.receivedBrainstormingChange.bind(this);
    //     this.knAllEdgeRealTimeService.registerPlugin(requestPluginOptions);
    // }

    //this.collaboPluginsService = this.$injector.get('CollaboPluginsService');
    this.ontovPluginInfo = {
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
        }
      }
    };

    // this.ontovPluginInfo.references.map.$promise = $q(function(resolve, reject) { /*jshint unused:false*/
    this.ontovPluginInfo.references.map.callback = function() {
      that.ontovPluginInfo.references.map.$resolved = true;
      that.mapStructure = that.ontovPluginInfo.references.map.items.mapStructure;
      // resolve(that.ontovPluginInfo.references.map);
      // reject('not allowed');
    };
    // });
    //
    // this.ontovPluginInfo.apis.map.$promise = $q(function(resolve, reject) { /*jshint unused:false*/
    this.ontovPluginInfo.apis.map.callback = function() {
      that.ontovPluginInfo.apis.map.$resolved = true;
      that.mapUpdate = that.ontovPluginInfo.apis.map.items.update;
      // resolve(that.ontovPluginInfo.apis.map);
      // reject('not allowed');
    };
    // });
    //

    this.collaboPluginsService.registerPlugin(this.ontovPluginInfo);

    this.registerFacet("Name", {
      getFacetMatches: this._getFacetMatches_Name.bind(this),
      doesMatch: this._doesMatch_Name.bind(this)
    });

    this.registerFacet("Type", {
      getFacetMatches: this._getFacetMatches_Type.bind(this),
      doesMatch: this._doesMatch_Type.bind(this)
    });

    this.registerFacet("Who", {
      getFacetMatches: this._getFacetMatches_Who.bind(this),
      doesMatch: this._doesMatch_Who.bind(this)
    });

    this.registerFacet("What", {
      getFacetMatches: this._getFacetMatches_What.bind(this),
      doesMatch: this._doesMatch_What.bind(this)
    });

    this.registerFacet("Tree", {
      getFacetMatches: this._getFacetMatches_Tree.bind(this),
      doesMatch: this._doesMatch_Tree.bind(this)
    });
  }

  getFacets() {
    return this.searchFacets;
  }

  getFacetMatches(facet: string, searchTerm: string) {
    if (facet in this.registeredFacets) {
      return this.registeredFacets[facet].getFacetMatches(searchTerm);
    } else {
      return ['<ERROR: UNKNOWN_FACET>'];
    }
  }

  doesFacetMatches(facet: string, searchTerm: string, vkNode) {
    if (facet in this.registeredFacets) {
      return this.registeredFacets[facet].doesMatch(searchTerm, vkNode);
    } else {
      return false;
    }
  }

  getNodesById() {
    if (this.mapStructure) {
      return this.mapStructure.nodesById;
    }
  }

  // filters based on provided facet search criteria
  filterByFacets(searchCollectionArray) {
    var nodesById = this.getNodesById();

    // there are facet filters active
    if (searchCollectionArray.length > 0) {
      for (let id in nodesById) {
        var vkNode = nodesById[id];
        var visible = false;
        for (var sC of searchCollectionArray) {
          if (this.doesFacetMatches(sC.category, sC.value, vkNode)) {
            visible = true;
            // }else{ // TODO FOR AND SCENARIO
            //   visible = false;
          }
        }
        if (visible) {
          delete vkNode.visible;

          // making visible all ancestor nodes of a visible node
          var ancestorsHash = this.mapStructure
            .getAllAncestorsPaths(vkNode);
          for (var aI in ancestorsHash) {
            var ancestorVkNode = ancestorsHash[aI];
            delete ancestorVkNode.visible;
          }
        } else {
          vkNode.visible = false;
        }
      }
    } else {
      for (let id in nodesById) {
        var vkNode = nodesById[id];
        delete vkNode.visible;
      }
    }
    this.mapUpdate();
  }

  // Registers new factet (each facet like name, who, what, ... have to get registered)
  // that can be sed to search through and reduce knalledge space
  registerFacet(facet: string, options: any) {
    console.log("[ontov.OntovService] new facet is registered: ", facet);
    this.registeredFacets[facet] = options;
    this.searchFacets.push(facet);
  }

  _getFacetMatches_Name(searchTerm: string) {
    if (this.mapStructure) {
      var nodeNameObj = {};
      for (let id in this.mapStructure.nodesById) {
        var vkNode = this.mapStructure.nodesById[id];
        nodeNameObj[vkNode.kNode.name] = true;
      }
      return Object.keys(nodeNameObj);
    } else {
      return ['SERVICE_UNVAILABLE. PLEASE TRY LATER.'];
    }
  }
  _doesMatch_Name(searchTerm: string, vkNode) {
    return vkNode.kNode.name === searchTerm;
  }

  _getFacetMatches_Type(searchTerm: string) {
    var typeToName = {
      'type_knowledge': 'kn:KnAllEdge',
      'type_ibis_question': 'ibis:QUESTION',
      'type_ibis_idea': 'ibis:IDEA',
      'type_ibis_argument': 'ibis:ARGUMENT',
      'type_ibis_comment': 'ibis:COMMENT'
    };

    if (this.mapStructure) {
      var nodeNameObj = {};
      for (let id in this.mapStructure.nodesById) {
        var vkNode = this.mapStructure.nodesById[id];
        nodeNameObj[vkNode.kNode.type] = true;
      }
      var existingTypes = [];
      for(var type in nodeNameObj){
        existingTypes.push({
          label: typeToName[type],
          value: type
        });
      }
      return existingTypes;
    } else {
      return ['SERVICE_UNVAILABLE. PLEASE TRY LATER.'];
    }

  }
  _doesMatch_Type(searchTerm: string, vkNode) {
    return vkNode.kNode.type === searchTerm;
  }

  _getFacetMatches_Who(searchTerm: string) {
    return ['Sasha', 'Sinisha', 'Dino', 'Alexander', 'John'];
  }
  _doesMatch_Who(searchTerm: string, vkNode) {
    return vkNode.kNode.name === searchTerm;
  }

  _getFacetMatches_What(searchTerm: string) {
    return ['ISSS', 'system', 'todo', 'sustainable'];
  }
  _doesMatch_What(searchTerm: string, vkNode) {
    return vkNode.kNode.name === searchTerm;
  }

  _getFacetMatches_Tree(searchTerm: string) {
    return ['name_1', 'name_2', 'name_3', 'name_4'];
  }
  _doesMatch_Tree(searchTerm: string, vkNode) {
    return vkNode.kNode.name === searchTerm;
  }
};
