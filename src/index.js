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
Love.render(a, document.getElementById("root"));
