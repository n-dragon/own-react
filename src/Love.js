
/**
 * creating js object corresponding to jsx
 * (is not fiber)
 * @param {*} type 
 * @param {*} props 
 * @param  {...any} children 
 */
export function createElement(type, props, ...children) {
  if (
    Array.isArray(children) &&
    Array.isArray(children[0]) &&
    children.length === 1
  ) {
    children = [...children[0]];
  }
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object" ? child : createTextElement(child)
      )
    }
  };
}
console.log("import Love module");
// why does it get called ?
// since it was done before setting the unit of work ...
// it works thanks to the timing 
window.requestIdleCallback(workLoop);

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}
/**
 * commit work to the dom according to the fiber effect
 * 
 * DFS for commiting work
 * @param {*} fiber 
 */
function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  // looking for a parent with a dom property not null
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom;

  // const domParent = fiber.parent.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
    // why fiber.dom be null here ?
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    );

  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
    // domParent.removeChild(fiber.dom);

  }
  // no more append since the fiber may not be related to a dom (function fiber)
  // domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}
const isEvent = key => key.startsWith("on")
const isProperty = key =>
  key !== "children" && !isEvent(key)
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)

/**
 * update dom properties
 * @param {*} dom 
 * @param {*} prevProps 
 * @param {*} nextProps 
 */
function updateDom(dom, prevProps, nextProps) {
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.removeEventListener(
        eventType,
        prevProps[name]
      )
    })
  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.addEventListener(
        eventType,
        nextProps[name]
      )
    })
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  };
}

let unitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = null;
// let wipFiber = null;
// let hookIndex = null;
/**
 * 
 * @param {*} timeRemaining 
 */
function workLoop(timeRemaining) {
  let shouldYield = false;
  while (unitOfWork && !shouldYield) {
    unitOfWork = performUnitOfWork(unitOfWork);
    shouldYield = timeRemaining.timeRemaining() < 1;
  }
  if (!unitOfWork && wipRoot) {
    // we commit all once we have no more unit of work
    commitRoot();
  }
  requestIdleCallback(workLoop);
}


export function useState(initial) {
  // get old hook in the old fiber
  const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
  // if old hook present, get the state
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: []
  };

  const actions = oldHook ? oldHook.queue : [];

  // applying action to the state
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  const setState = action => {
    hook.queue.push(action);
    // we trigger a newRender of the entire fiber tree (starting from root)
    wipRoot = { dom: currentRoot.dom, props: currentRoot.props, alternate: currentRoot }
    unitOfWork = wipRoot;
    deletions = []
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}
/**
 * called by the developpers
 * init the unitOfWork with the first child
 * @param {*} element 
 * @param {*} container 
 */
export function render(element, container) {
  // creating first fiber
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    // link to the old fiber
    alternate: currentRoot
  };
  unitOfWork = wipRoot;
  deletions = [];
}
/**
 * create Dom node according to element type
 * passing props to the dom node 
 * @param {*} element 
 */
export function createDom(fiber) {
  // creating good type dom node
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
      // we need to update dom so that we can attach properties
  updateDom(dom, {}, fiber.props);
  return dom;
}

export const Love = {
  createElement,
  render
};

/**
 * reconcile children element with fiber.
 * create them on first call
 * @param {*} wipFiber 
 * @param {*} elements : children fiber
 */
function reconcileChildren(wipFiber, elements) {
  // reconcile old wipFilber with children
  let index = 0
  // we get the old fiber from the current one since there is a link
  let oldFiber =
    wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null
  // we get the old fiber from the current one since it's bound by the alternate property
  // comparing oldFiber with the element we want to render
  // we compare nodes according to their position in the tree
  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index]
    let newFiber = null
    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type

    // same type we will just update the node with the props
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    // if new element and not same type, we create fiber  
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }
    // if old fiber not of same type, we will delete the node
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }
    // we take the next oldFiber
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }
    // we set the first element as child of the fiber
    if (index === 0) {
      wipFiber.child = newFiber
      // otherwise we set them as siblings
    } else if (element) {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }

}
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    // create dom related to this fiber
    fiber.dom = createDom(fiber);
  }
  // getting curren fiber children elements
  const elements = fiber.props.children;
  // create new children fibers with effect tag and good props
  // will add fiber node to delete
  reconcileChildren(fiber, elements);
}
let wipFiber = null;
let hookIndex = null;

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = []

  const children = [fiber.type(fiber.props)];

  reconcileChildren(fiber, children);
}
/**  
 * 
 * create dom
 * create children fibers and comparing them with the old ones
 * return next fiber to work on
 */
function performUnitOfWork(fiber) {
  const isFunctionComponent =
    fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  // we return the first child 
  // and then if no child siblings
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}