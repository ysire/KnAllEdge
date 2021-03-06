

## Examples

+ Ontov (app/components/ontov)

## Plugins API

Plugin API is provided within the ```collaboPluginsServices module``` that currently has only one service: ```CollaboPluginsService``` that does the whole hard job.

### Registering plugins

It registers plugin with structure

```js
{
    name: "PluginHero",
    components: {

    },
    references: {
        referenceName1: {
            items: {
                itemName1: null,
                itemName2: null,
                ...
            }
        }
    }
}
```

## Plugins page

At the plugins page we can see the list of currently loaded plugins

Path: ```/#/plugins```

Plugins reporter is a component that is existing in: ```components/collaboPlugins```.

in the angular router we have:

```js
.when('/plugins', {
    templateUrl: 'components/collaboPlugins/partials/plugins-index.tpl.html'
})
```

## Creating a new IBIS PUZZLE

We will create it in a separeate folder, `src/frontend/dev_puzzles/ibis`.

It is always good practice to create `README.md` file with each puzzle.

### Config

Config file `config.js` contains all info about the puzzle, how it is integrated inside the system, which resources it needs, etc.

### Registering

Inside the `src/frontend/js/config/config.plugins.js` add

```js
  ibis: {
    active: true,
    // relative to the project root
    path: 'dev_puzzles/ibis'
```

inside the `puzzles` property.

### Service

Now we need to provide a service that will support business logic.


# Visualization plugins as services/providers

Map Visualization plugins

Passive plugins (filters) that get knalledge data and transform it adds new

## procedure with example of request
We want to create a Halo plugin (which is placed in knalledge.mapVisualization) for Request. In this way we will be able to add a specific request icon in halo arround a selected node.

### Create request service

```js
import {Injectable
} from 'angular2/core';

/**
* the namespace for the Request service
* @namespace request.RequestService
*/

@Injectable()
export class RequestService {

    /**
     * Service constructor
     * @constructor
     */
    constructor() {
    }

    init() {
    }
}
```

In app2.ts add code for registering the service:

```js
// ...
import {RequestService} from '../components/request/request.interaction.service';
// ...

// injecting NG1 TS service into NG1 space
var requestServices = angular.module('requestServices');
requestServices
    .service('RequestService', RequestService)
    ;

// ...
// upgrading ng1 services into ng2 space
upgradeAdapter.upgradeNg1Provider('RequestService');
```


### Adding plugin in config.plugins.js

```js
"request": {
    active: true,
    services: {
        requestService: {
            name: 'RequestService',
            path: 'request.RequestService'
        }
    },
    plugins: {
        mapVisualizeHaloPlugins: ['requestService'],
        keboardPlugins: ['requestService']
    }
},
```

Here we declared module request that is active and has `requestService` service. It implements two plugins `mapVisualizeHaloPlugins` and `keboardPlugins` both with the `requestService` service.

__NOTE__: If service name is omitted the service id (`requestService` in this case will be used). If service path is omitted it will be constructed from module name concatenated with service name (or service id), in our case it would be `request.requestService`.

### Injecting services

KnalledgeMap directive will load all services that are needed for the relevant plugins:

```js
// references to loaded services
var componentServiceRefs = {};
// plugins that we care for inside the directive
var pluginsOfInterest = {
    mapVisualizePlugins: true,
    mapVisualizeHaloPlugins: true,
    mapInteractionPlugins: true,
    keboardPlugins: true
};

loadPluginsServices(Config.Plugins, componentServiceRefs, pluginsOfInterest, $injector, injector);
```

Finally, it will load and inject plugins into `mapPlugins` :

```js
/**
 * Plugins that are provided to the knalledge.Map
 * @type {Object}
 */
var mapPlugins = {
};

// injecting plugins
for(var pluginName in pluginsOfInterest){
    injectPlugins(pluginName);
}
```

And provide it to all relevant subcomponents, like knalledge.Map:

```js
knalledgeMap = new knalledge.Map(
    // ...
    mapPlugins,
    // ...
);
```

### Using Halo plugin

### Implementing halo interaction

Inside the `knalledge.MapVisualization` the halo is twice interacted with. First time, we initialize the halo in `MapVisualization.prototype._initHalo`. Here we provide a set of available actions and how halo should behave.

Second time in `MapVisualization.prototype.nodeFocus` we create halo with specific icons; which icons are available, where they are placed, and what action should be called when the icon is clicked.


## example

### Notofy
+ app/components/notify
+ NotifyNodeService (app/components/notify/js/services.js)

# TopiChat plugins

Real time communication plugins

# Example with IBIS

+ Currently in the components/knalledgeMap
+ directive:
    + app/components/knalledgeMap/directives.js:ibisTypesList
+ service:
    + app/components/knalledgeMap/services.js:IbisTypesService
+ templates
    + app/components/knalledgeMap/partials/ibisTypes-list.tpl.html
+ integrated in
    + app/components/knalledgeMap/partials/knalledgeMap-tools.tpl.html
+ style:
    + app/components/knalledgeMap/sass/default.scss
    + app/components/knalledgeMap/sass/graph.scss
+ references
    + app/js/knalledge/kEdge.js
        + KEdge.TYPE_KNOWLEDGE = "type_knowledge";
    + app/js/knalledge/kNode.js
        + KNode.TYPE_IBIS_QUESTION = "type_ibis_question";
+ visualization
    + MapVisualizationFlat.prototype.updateHtmlTransitions

```js
nodeHtmlUpdate.select(".node_type")
    .style("display", function(d){
        return (d.kNode && d.kNode.type) ? "block" : "none";
    })
    .html(function(d){
        var label = "";
        if(d.kNode && d.kNode.type){
            var type = d.kNode.type;
            switch(type){
                case "type_ibis_question":
                    type = "ibis:QUESTION";
                    break;
                case "type_ibis_idea":
                    type = "ibis:IDEA";
                    break;
                case "type_ibis_argument":
                    type = "ibis:ARGUMENT";
                    break;
                case "type_ibis_comment":
                    type = "ibis:COMMENT";
                    break;
                case "type_knowledge":
                    type = "kn:KnAllEdge";
                    break;

                case "model_component":
                    type = "csdms:COMPONENT";
                    break;
                case "object":
                    type = "csdms:OBJECT";
                    break;
                case "variable":
                    type = "csdms:VARIABLE";
                    break;
                case "assumption":
                    type = "csdms:ASSUMPTION";
                    break;
                case "grid_desc":
                    type = "csdms:GRID DESC";
                    break;
                case "grid":
                    type = "csdms:GRID";
                    break;
                case "process":
                    type = "csdms:PROCESS";
                    break;
            }
            label = "%" + type;
        }
        return label;
    });
```

# Example with Voting (part of IBIS)

+ Currently in the components/knalledgeMap
+ directive:
    + app/components/knalledgeMap/directives.js:ibisTypesList
+ service:
    + app/components/knalledgeMap/services.js:IbisTypesService
+ templates
    + no
+ style:
    + app/components/knalledgeMap/sass/default.scss
    + app/components/knalledgeMap/sass/graph.scss

Added to each node inside the: `app/js/knalledge/mapVisualizationTree.js:updateHtml`

```js
nodeHtmlEnter
    .append("div")
        .attr("class", "vote_up");

nodeHtmlEnter
    .append("div")
        .attr("class", "vote_down");
```
Decorated with (same file):

```js
nodeHtmlUpdate.select(".vote_up")
    .style("opacity", function(d){
        return (d.kNode.dataContent && d.kNode.dataContent.ibis && d.kNode.dataContent.ibis.voteUp) ?
            1.0 : 0.1;
    })
    .html(function(d){
        // if(!('dataContent' in d.kNode) || !d.kNode.dataContent) d.kNode.dataContent = {};
        // if(!('ibis' in d.kNode.dataContent) || !d.kNode.dataContent.ibis) d.kNode.dataContent.ibis = {};
        // if(!('voteUp' in d.kNode.dataContent.ibis)) d.kNode.dataContent.ibis.voteUp = 1;
        return (d.kNode.dataContent && d.kNode.dataContent.ibis && d.kNode.dataContent.ibis.voteUp) ?
            d.kNode.dataContent.ibis.voteUp : "&nbsp";
    });

nodeHtmlUpdate.select(".vote_down")
    .style("opacity", function(d){
        return (d.kNode.dataContent && d.kNode.dataContent.ibis && d.kNode.dataContent.ibis.voteDown) ?
            1.0 : 0.1;
    })
    .html(function(d){
        return (d.kNode.dataContent && d.kNode.dataContent.ibis && d.kNode.dataContent.ibis.voteDown) ?
            d.kNode.dataContent.ibis.voteDown : "&nbsp";
    });
```

Keyboard interaction (app/js/interaction/keyboard.js:updateHtmlTransitions):

```js
// IBIS
// Vote up
KeyboardJS.on("ctrl + command + up", function(){
    if(this.editingNodeHtml) return;
    if(this.getStatus() !== Keyboard.STATUS_MAP) return;
    var node = this.clientApi.getSelectedNode();
    if(!('dataContent' in node.kNode) || !node.kNode.dataContent) node.kNode.dataContent = {};
    if(!('ibis' in node.kNode.dataContent) || !node.kNode.dataContent.ibis) node.kNode.dataContent.ibis = {};
    if(!('voteUp' in node.kNode.dataContent.ibis)) node.kNode.dataContent.ibis.voteUp = 1;
    else node.kNode.dataContent.ibis.voteUp += 1;
    this.clientApi.updateNode(node, knalledge.MapStructure.UPDATE_NODE_IBIS_VOTING);
    this.clientApi.update(this.clientApi.getSelectedNode());
}.bind(this), function(){}.bind(this));

// Vote up
KeyboardJS.on("ctrl + command + down", function(){
    if(this.editingNodeHtml) return;
    if(this.getStatus() !== Keyboard.STATUS_MAP) return;
    var node = this.clientApi.getSelectedNode();
    if(!('dataContent' in node.kNode) || !node.kNode.dataContent) node.kNode.dataContent = {};
    if(!('ibis' in node.kNode.dataContent) || !node.kNode.dataContent.ibis) node.kNode.dataContent.ibis = {};
    if(!('voteDown' in node.kNode.dataContent.ibis)) node.kNode.dataContent.ibis.voteDown = 1;
    else node.kNode.dataContent.ibis.voteDown += 1;
    this.clientApi.updateNode(node, knalledge.MapStructure.UPDATE_NODE_IBIS_VOTING);
    this.clientApi.update(this.clientApi.getSelectedNode());
}.bind(this), function(){}.bind(this));
```

# Example with RIMA

+ in the components/rima
+ directive:
    +
+ service:
    +
+ templates
    +
+ integrated in
    + app/components/knalledgeMap/partials/knalledgeMap-tools.tpl.html
    + app/components/knalledgeMap/partials/index.tpl.html
    + src/frontend/app/components/knalledgeMap/partials/knalledgeMap-list.tpl.html
    + ...
+ style:
    + components
    + app/components/knalledgeMap/sass/default.scss
+ references
    + app/js/knalledge/kEdge.js
        + 	this.iAmId = 0;	//id of object creator (whoAmi/RIMA user)
    + app/js/knalledge/kNode.js
        + 	this.iAmId = 0;	//id of object creator (whoAmi/RIMA user)
    + app/components/knalledgeMap/js/directives.js
    + app/components/knalledgeMap/js/services.js
    + src/frontend/app/components/login/js/directives.js
    + src/frontend/app/components/notify/js/services.js
    + src/frontend/app/js/app.js
    + src/frontend/app/js/knalledge/mapVisualizationTree.js
    + src/frontend/app/js/knalledge/mapVisualizationGraph.js
    + src/frontend/app/js/lib/wizard/ngWizard.js
    + src/frontend/app/js/knalledge/map.js
    + src/frontend/app/js/knalledge/mapManager.js
    + src/frontend/app/js/knalledge/mapStructure.js
    + src/frontend/app/js/knalledge/mapVisualization.js
    + src/frontend/app/js/knalledge/mapVisualizationFlat.js
+ visualization
    + MapVisualizationFlat.prototype.updateHtmlTransitions

```js
nodeHtmlEnter
    .append("div")
        .attr("class", "rima_user");
```

```js
nodeHtmlUpdate.select(".rima_user")
    .style("display", function(d){
        return that.rimaService.getUserById(d.kNode.iAmId) ? "block" : "none"; //TODO: unefective!! double finding users
    })
    .html(function(d){
        var user = that.rimaService.getUserById(d.kNode.iAmId);
        var label = "";
        if(user){
            label = "@" + user.displayName;
        }
        return label;
    });

```

# Support for puzzlebility of view components

+ added collaboPlugins/pluginsPreloader.ts that loads all necessary components BEFORE the main app is bootstrapped
+ main app is bootstrapped AFTER all components are loaded with pluginsPreloader
+ each view component that has plugged-in view components do not load them explicitlely but gets them from pluginsPreloader and adds them to the list of children directives (@Component(directives))
+ however currently we didn't manage to tell SystemJS to load view component files and inject them in build, so we are explicltelly enlisting all of them in src/frontend/app/js/pluginDependencies.ts that is loaded by app2.ts and it is unique for each project

## IMPORTANT

**IMPORTANT**: If you adding new plugins, you need to add them to the `tools/config.ts` in order to build them in the app_bundle.js file, otherwise, development environment will work but production will NOT! (Ask @mprinc more about that.) To achieve that we need to do:

**TODO**: At the moment we need to add plugin dependencies in the `src/frontend/app/js/pluginDependencies.ts` file. For example:

```js
import {TopPanel} from '../components/topPanel/topPanel';
```

## Adding a new puzzle-hosting view component that can hold pluggable sub components

Let puzzle-hosting view component be the `src/frontend/app/components/bottomPanel/bottomPanel.ts` component.

We need to create a place holder for it in `src/frontend/app/js/config/config.plugins.js`

```js
var plugins = {
	"ViewComponents": {
		"bottomPanel.BottomPanel": {
			components: {
			}
		},
        // ...
    },
    // ...
};
```

Inside the components filed we will later add all componets that can exist inside of the puzzle-hosting view component.

## Adding a new pluggable sub components inside the puzzle-hosting view component

Let's have a `src/frontend/app/components/bottomPanel/bottomPanel.ts` component as a pluggable sub components inside the `src/frontend/app/components/bottomPanel/bottomPanel.ts` puzzle-hosting view component.

### Let the puzzle-hosting view component know about new pluggable sub components

We need to add to description of pluggable sub components in `ViewComponents[bottomPanel.BottomPanel].components` container:

```sh
// ...
"bottomPanel.BottomPanel": {
    components: {
        'brainstorming.BrainstormingPanelComponent': {
            active: true,
            path: "/components/brainstorming/brainstorming-panel.component"
        }
    }
},
// ...
```

### Let the system know (and preload) the puzzle-hosting view component

Inside the `src/frontend/app/components/collaboPlugins/pluginsPreloader.ts` add the puzzle-hosting view component:

```js
import {BrainstormingPanelComponent} from '../components/brainstorming/brainstorming-panel.component';

// ...

components['/components/brainstorming/brainstorming-panel.component'] = BrainstormingPanelComponent;
```

This will help CF system to (pre)load the component and make it available for the puzzle-hosting view component.

The component is accessible through `import {PluginsPreloader} from 'src/frontend/app/components/collaboPlugins/pluginsPreloader.ts';

### Implementing the puzzle-hosting view component

Following our example, create the file `src/frontend/app/components/bottomPanel/bottomPanel.ts`

It should look something like:

```sh

```

`: PluginsPreloader.components.GardeningControls


### CSS

Add sass folder with scss file(s), in our case we add `bottomPanel.scss`.

Add config for compiling with compass to `src/frontend/app/js/config/config.plugins.js`:

```js
COMPASS: {
// ...
  PATHS: {
  // ...
    'components/bottomPanel': { destDir: APP_SRC, cssDir: 'css' },
  }
}
```

Add config for injecting necessary JS and CSS files to the CF system into`src/frontend/app/js/config/config.plugins.js`:

```js
puzzlesBuild: {
  // ...
  bottomPanel: {
    path: [APP_SRC_STR, 'components/bottomPanel'],
    injectJs: [],
    injectCss: 'css/bottomPanel.css'
  },
  // ...
}
```

So far we do not have any JS file to inject, since all business logic is writen in TypeScript and it will be automatically included/loaded within the  run-time/building process.

### Adding a new pluggable sub components

We are creating pluggable sub components in a regular way, there is no need to do it in any special way.

In our example, pluggable sub components will be: `src/frontend/app/components/brainstorming/partials/brainstorming-panel.component.tpl.html`.

***NOTE:*** Surely, if we want to interact with other parts of the CF system, since we are puzzle, we have to be **careful**! For example if we are injecting some **service**, we have to load it contidionally if the service is not guaranteed to exist. Similarly, if we need to access some **parts of the system**, like KnAllEdge map, etc, we need to register our reqirements through `CollaboPluginService` and access them in that way, after access is provided and granted.

## Adding a new pluggable sub components inside the puzzle-hosting view component

Our puzzle-hosting view component is `src/frontend/app/components/bottomPanel/bottomPanel.ts`

Here we present the minimal component that dynamically loads pluggable sub components that might or might not exist:


```js
import {Component, ViewEncapsulation} from '@angular/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material';

/**
 * Directive that ...
 * Selector: `bottom-panel`
 * @class bottomPanel
 * @memberof CF
 * @constructor
*/

var componentDirectives = [
  MATERIAL_DIRECTIVES
];

declare var Config: any; // src/frontend/app/js/config/config.plugins.js
import {PluginsPreloader} from '../collaboPlugins/pluginsPreloader';

// get the config for ourselves
var puzzleHostingConfig = Config.Plugins.ViewComponents['bottomPanel.BottomPanel'];
var pluggableSubComponentsConfig = puzzleHostingConfig.components;
var pluggableSubComponentName = 'brainstorming.BrainstormingPanelComponent';

if (pluggableSubComponentsConfig[pluggableSubComponentName].active) {
    console.warn("[KnalledgeMapTools] Loading pluggableSubComponent: ", pluggableSubComponentName);
    // get reference to the pluggable sub component class
    var pluggableSubComponent = PluginsPreloader.components[pluggableSubComponentName];
    if(pluggableSubComponent){
      // add to other directives that puzzle-hosting view component will contain
      componentDirectives.push(pluggableSubComponent);
    }else{
      console.error("[BottomPanel] Error loading pluggableSubComponent: ", pluggableSubComponentName);
    }
} else {
    console.warn("[KnalledgeMapTools] Not loading pluggableSubComponent: ", pluggableSubComponentName);
}

@Component({
    selector: 'bottom-panel',
    encapsulation: ViewEncapsulation.None,
    providers: [
    ],
    // directives are not explicitly provided but dynamically built and provided
    directives: componentDirectives,
    moduleId: module.id, // necessary for having relative paths for templateUrl
    templateUrl: 'partials/bottom_panel.tpl.html'
})
export class BottomPanel {
    constructor(
    ) {
    };
}
```

The most important thing here is that we are avoiding explicit importing of pluggable sub component! In other words we avoided:

```js
import {BrainstormingPanelComponent} from '../components/brainstorming/brainstorming-panel.component';
```

If we have this, and if the brainstorming puzzle is not added to our CF system instance, building process would crash.

**NOTE**: Sure, this construct we DO have in `src/frontend/app/js/pluginDependencies.ts`, but first of all, that is localized and easier and cleaner to remove, and that is only because our problem of finding descriptive to tell SystemJS to preload non explicitly required TypeScript files.

Even more generic way of loading all pluggable sub components is implemented in final version of our puzzle-hosting view component:

```js
// go through all pluggable sub components
for(var pluggableSubComponentName in pluggableSubComponentsConfig){
  if (pluggableSubComponentsConfig[pluggableSubComponentName].active) {
      console.warn("[BottomPanel] Loading pluggableSubComponent: ", pluggableSubComponentName);
      // get reference to the pluggable sub component class
      var pluggableSubComponent = PluginsPreloader.components[pluggableSubComponentName];
      if(pluggableSubComponent){
        // add to other directives that puzzle-hosting view component will contain
        componentDirectives.push(pluggableSubComponent);
      }else{
        console.error("[BottomPanel] Error loading pluggableSubComponent: ", pluggableSubComponentName);
      }
  } else {
      console.warn("[BottomPanel] Not loading pluggableSubComponent: ", pluggableSubComponentName);
  }
}
```

# Example with RIMA

+ in the components/ontov
+ directive:
    + ontovSearch
+ service:
    + ontovServices
+ templates
    + src/frontend/app/components/ontov/partials/ontov-search.tpl.html
+ integrated in
    + src/frontend/app/components/knalledgeMap/partials/index.tpl.html
+ style:
    + components/ontov
+ references
    + src/frontend/app/js/app.js
+ visualization
    +

# Findings

## Dynamic injection in modules

source: `src/frontend/app/js/app.js`

```js
var requiresList = [
	  'ngRoute'
      , 'ngSanitize' // necessary for outputing HTML in angular directive
      // ...
];

requiresList.push('rimaServices');
// requiresList.push(...);
// ...

angular.module('KnAllEdgeApp', requiresList)

```

## Dynamic injection in directives

```js
angular.module('knalledgeMapDirectives', ['Config'])
	.directive('knalledgeMap', ['$injector',
    function($injector){

        var RimaService = $injector.get('RimaService');
    }])
```

# Example of Gardening > Approval

1. Create new component `gardening`
2. create services module in `gardening/js/services.js`
3. create ApprovalNodeService TS service
4. add it to app2.ts

```js
import {ApprovalNodeService} from '../components/gardening/approval.node.service';

// ...

var gardeningServices = angular.module('gardeningServices');
gardeningServices
    .service('ApprovalNodeService', ApprovalNodeService)
    ;

    // ...

upgradeAdapter.upgradeNg1Provider('ApprovalNodeService');
```

3. add gardeningServices to app.js - this is temoprarly necessary, later will be retrieved from config.plugins
```js
requiresList.push('gardeningServices');
```
2. add it to config.plugins.js and register mapVisualizePlugins plugin as implemented through ApprovalNodeService service
  + **NOTE**: Doing this properly, requires our service to be known in the NG1 world
    + make js/services.js file
    + app.js
      + requiresList.push('gardeningServices');
```js
gardening: {
  // ...
  injectJs: 'js/services.js',
}

```
4. add

```js
{ src: join(APP_DEST, 'components/gardening/js/services.js'), inject: true, noNorm: true},
```

```js
{ src: join(APP_SRC, 'components/gardening/css/default.css'), inject: true, dest: CSS_DEST, noNorm: true },
```

```js
'components/gardening': {destDir: APP_SRC, cssDir: 'css'},
```

to config.ts

## TODO

