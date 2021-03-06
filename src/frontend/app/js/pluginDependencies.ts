// Here go all dependencies that plugins reuqire,
// but are not explicitly imported from any file reachable
// from the app entry file (in our case `js/app2.js`)

import {BrainstormingFormComponent} from '../components/brainstorming/brainstorming-form.component';
import {BrainstormingPanelComponent} from
'../components/brainstorming/brainstorming-panel.component';
import {OntovComponent} from '../components/ontov/ontov.component';
import {SessionFormComponent} from '../components/session/session-form.component';
import {BrainstormingPhase} from '../components/brainstorming/brainstorming';

export var components:any = {};

import {TopPanel} from '../components/topPanel/topPanel';
components['/components/topPanel/topPanel'] = TopPanel;

import {GardeningControls} from '../components/gardening/gardening-controls.component';
components['/components/gardening/gardening-controls.component'] = GardeningControls;

import {RimaUsersList} from '../components/rima/rimaUsersList';
components['/components/rima/rimaUsersList'] = RimaUsersList;

components['/components/brainstorming/brainstorming-form.component'] = BrainstormingFormComponent;
components['/components/brainstorming/brainstorming-panel.component'] = BrainstormingPanelComponent;
components['/components/ontov/ontov.component'] = OntovComponent;
components['/components/session/session-form.component'] = SessionFormComponent;
components['/components/brainstorming/brainstorming'] = BrainstormingPhase;

import {IbisTypesList} from '../../dev_puzzles/ibis/ibisTypesList';
components['cf.puzzles.ibis.typesList'] = IbisTypesList;

import {IbisActionsForm} from '../../dev_puzzles/ibis/ibisActionsForm';
components['cf.puzzles.ibis.actionsForm'] = IbisActionsForm;

import {RimaActionsForm} from '../components/rima/rimaActionsForm';
components['cf.puzzles.rima.actionsForm'] = RimaActionsForm;

import {PresentationList} from '../../dev_puzzles/presentation/presentationList';
components['cf.puzzles.presentation.list'] = PresentationList;

import {PresentationActionsForm} from '../../dev_puzzles/presentation/presentationActionsForm';
components['cf.puzzles.presentation.actionsForm'] = PresentationActionsForm;

import {KnalledgeListComponent} from '../../dev_puzzles/knalledge_list/knalledge_list.component';
components['cf.puzzles.knalledgeList.component'] = KnalledgeListComponent;


import {TrendmasterActionsForm} from '../../dev_puzzles/coevoludens/trendmasterActionsForm';
components['cf.puzzles.coevoludens.trendmaster-actions-form'] = TrendmasterActionsForm;

import {CoEvoLudensActionsForm} from '../../dev_puzzles/coevoludens/coevoludensActionsForm';
components['cf.puzzles.coevoludens.coevoludens-actions-form'] = CoEvoLudensActionsForm;

import {TrendspyramidComponent} from '../../dev_puzzles/coevoludens/trendspyramid.component';
components['cf.puzzles.coevoludens.coevoludens-trendspyramid'] = TrendspyramidComponent;

// service dependencies that other parts of the system depends on
export var servicesDependencies:any = {};

import {CfPuzzlesIbisService} from '../../dev_puzzles/ibis/cf.puzzles.ibis.service';
servicesDependencies['cf.puzzles.ibis.service'] = CfPuzzlesIbisService;
import {CfPuzzlesPresentationServices} from '../../dev_puzzles/presentation/cf.puzzles.presentation.service';
servicesDependencies['cf.puzzles.presentation.service'] = CfPuzzlesPresentationServices;

import {CfPuzzlesCoevoludensServices} from '../../dev_puzzles/coevoludens/cf.puzzles.coevoludens.service';
servicesDependencies['cf.puzzles.coevoludens.service'] = CfPuzzlesCoevoludensServices;

import {CfPuzzlesKnalledgeListService} from '../../dev_puzzles/knalledge_list/cf.puzzles.knalledge_list.service';
servicesDependencies['cf.puzzles.knalledge_list.service'] = CfPuzzlesKnalledgeListService;

export var modules:any = {};
import {TopPanelModule} from '../components/topPanel/topPanel';
modules['/components/topPanel/topPanel'] = TopPanelModule;
