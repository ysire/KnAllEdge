//if we are providing a global variables we need to get them out of use-strict-function pattern
var interaction;

(function () { // This prevents problems when concatenating scripts that aren't strict.
'use strict';

/**
* @description
* ## Info
* This namespace contains context logic of the interaction part of the CollaboFramework
* @namespace interaction
*/
if(typeof interaction == 'undefined') interaction = {};

}()); // end of 'use strict';
