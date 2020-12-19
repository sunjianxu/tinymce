import { Fun } from '@ephox/katamari';
import { Focus, SugarElement } from '@ephox/sugar';

import * as Clicks from '../mouse/Clicks';
import { Chain } from './Chain';
import { Step } from './Step';
import * as UiFinder from './UiFinder';

const clickWith = Clicks.click;
const mouseOverWith = Clicks.mouseOver;
const mouseDownWith = Clicks.mouseDown;
const mouseUpWith = Clicks.mouseUp;
const mouseMoveWith = Clicks.mouseMove;
const mouseOutWith = Clicks.mouseOut;

const click = clickWith({});
const mouseOver = Clicks.mouseOver({});
const mouseDown = Clicks.mouseDown({});
const mouseUp = Clicks.mouseUp({});
const mouseMove = Clicks.mouseMove({});
const mouseOut = Clicks.mouseOut({});

// Custom event creation
const cClickWith = Fun.compose(Chain.op, Clicks.click);
const cContextMenuWith = Fun.compose(Chain.op, Clicks.contextMenu);
const cMouseOverWith = Fun.compose(Chain.op, Clicks.mouseOver);
const cMouseDownWith = Fun.compose(Chain.op, Clicks.mouseDown);
const cMouseUpWith = Fun.compose(Chain.op, Clicks.mouseUp);
const cMouseMoveWith = Fun.compose(Chain.op, Clicks.mouseMove);
const cMouseOutWith = Fun.compose(Chain.op, Clicks.mouseOut);

// With delta position (shifted relative to top-left of component)
/**
 * @deprecated use cMouseUpWith({ dx, dy }) instead */
const cMouseUpTo = (dx: number, dy: number): Chain<SugarElement<Node>, SugarElement<Node>> => cMouseUpWith({ dx, dy });
/**
 * @deprecated use cMouseMoveWith({ dx, dy }) instead */
const cMouseMoveTo = (dx: number, dy: number): Chain<SugarElement<Node>, SugarElement<Node>> => cMouseMoveWith({ dx, dy });

// No extra settings
/**
 * @deprecated use cClickWith({ }) instead*/
const cClick = cClickWith({ });
/**
 * @deprecated use cContextMenuWith({ }) instead */
const cContextMenu = cContextMenuWith({ });
/**
 * @deprecated use cMouseOverWith({ }) instead */
const cMouseOver = cMouseOverWith({ });
/**
 * @deprecated use cMouseDownWith({ }) instead */
const cMouseDown = cMouseDownWith({ });
/**
 * @deprecated use cMouseUpWith({ }) instead */
const cMouseUp = cMouseUpWith({ });
/**
 * @deprecated use cMouseMoveWith({ }) instead */
const cMouseMove = cMouseMoveWith({ });
/**
 * @deprecated use cMouseOutWith({ }) instead */
const cMouseOut = cMouseOutWith({ });

const triggerOn = <T extends Element>(container: SugarElement<Node>, selector: string, action: (ele: SugarElement<T>) => void): SugarElement<T> => {
  const ele = UiFinder.findIn(container, selector).getOrDie();
  action(ele);
  return ele;
};

// Work with selectors
const sTriggerOn = <T, U extends Element>(container: SugarElement<Node>, selector: string, action: (ele: SugarElement<U>) => void) =>
  Step.sync<T>(() => triggerOn(container, selector, action));

const clickOn = <T extends HTMLElement>(container: SugarElement<Node>, selector: string): SugarElement<T> =>
  triggerOn<T>(container, selector, Clicks.trigger);

const hoverOn = <T extends Element>(container: SugarElement<Node>, selector: string): SugarElement<T> =>
  triggerOn<T>(container, selector, Clicks.mouseOver({ }));

const contextMenuOn = <T extends Element>(container: SugarElement<Node>, selector: string): SugarElement<T> =>
  triggerOn<T>(container, selector, Clicks.contextMenu({ }));

const sClickOn = <T>(container: SugarElement<Node>, selector: string): Step<T, T> =>
  sTriggerOn<T, Element>(container, selector, Clicks.trigger);

const sHoverOn = <T>(container: SugarElement<Node>, selector: string): Step<T, T> =>
  sTriggerOn<T, Element>(container, selector, Clicks.mouseOver({ }));

const sContextMenuOn = <T>(container: SugarElement<Node>, selector: string): Step<T, T> =>
  sTriggerOn<T, Element>(container, selector, Clicks.contextMenu({ }));

const cClickOn = <T>(selector: string): Chain<SugarElement<T>, SugarElement<T>> => Chain.fromIsolatedChains([
  UiFinder.cFindIn(selector),
  cClick
]);

// True click utilities: mouse down / mouse up / click events all in one
const trueClick = (elem: SugarElement<HTMLElement>): void => {
  // The closest event queue to a true Click
  Focus.focus(elem);
  Clicks.mouseDown({ })(elem);
  Clicks.mouseUp({ })(elem);
  Clicks.trigger(elem);
};
const cTrueClick = Chain.op(trueClick);
const sTrueClickOn = <T>(container: SugarElement<Node>, selector: string): Step<T, T> =>
  sTriggerOn<T, Element>(container, selector, trueClick);

// Low level exports
const leftClickButton = Clicks.leftClickButton ;
const middleClickButton = Clicks.middleClickButton ;
const rightClickButton = Clicks.rightClickButton ;
const leftClickButtons = Clicks.leftClickButtons ;
const rightClickButtons = Clicks.rightClickButtons ;
const middleClickButtons = Clicks.middleClickButtons ;
/**
 * @deprecated Use event instead */
const point = Clicks.point;
const event = Clicks.event;

export {
  cClickWith,
  cContextMenuWith,
  cMouseOverWith,
  cMouseDownWith,
  cMouseUpWith,
  cMouseMoveWith,
  cMouseOutWith,

  cClick,
  cContextMenu,
  cMouseOver,
  cMouseDown,
  cMouseUp,
  cMouseMove,
  cMouseOut,

  cMouseUpTo,
  cMouseMoveTo,

  sClickOn,
  sHoverOn,
  sContextMenuOn,
  cClickOn,

  trueClick,
  cTrueClick,
  sTrueClickOn,

  leftClickButton,
  middleClickButton,
  rightClickButton,
  leftClickButtons,
  rightClickButtons,
  middleClickButtons,

  clickWith,
  mouseOverWith,
  mouseDownWith,
  mouseUpWith,
  mouseMoveWith,
  mouseOutWith,

  click,
  mouseOver,
  mouseDown,
  mouseUp,
  mouseMove,
  mouseOut,

  clickOn,
  contextMenuOn,
  hoverOn,

  point,
  event
};
