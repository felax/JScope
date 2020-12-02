* The mouse has left the canvas. Clear out whatever artifacts remain
 * @param {Object} event the mouseout event from the browser.
 * @private
 */Dygraph.prototype.mouseOut_ = function(event){if(this.getFunctionOption("unhighlightCallback")){this.getFunctionOption("unhighlightCallback").call(this,event);}if(this.getBooleanOption("hideOverlayOnMouseOut") && !this.lockedSet_){this.clearSelection();}};