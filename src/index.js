import * as Love from "./Love";


function Counter() {
  console.log("render counter");
  const [state, setState] = Love.useState(1);
  return (

    /** @jsx Love.createElement */
    <h1 style="user-select: none" onClick={() => { setState(c => c + 1) }}>
      Count: {state}
    </h1>
  )
}

/** @jsx Love.createElement */
const element = <Counter />;


Love.render(element, document.getElementById("root"));
