import React from "react";
import * as Love from "./Love";

const b = [];
for (let i = 0; i < 1000; i++) {
  b.push(Math.random());
}
/** @jsx Love.createElement */
const a = (
  <div>
    {b.map(val => (
      <p>{val}</p>
    ))}
  </div>
);

const FunctionComponent = props => {
  return <div>function Component</div>;

};
const c = <div>

  <FunctionComponent />

</div>;


Love.render(c, document.getElementById("root"));
