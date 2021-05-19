import * as React from 'react';
import { Link } from "react-router-dom";

const ParalaxHomePage: React.FunctionComponent = () => {

  return (
    <section>
      <header><h3>Parallax Demos!</h3></header>
      <ul>
        <li>
          <Link to="/demo/parallaxDemo1">
            Parallax Demo1
          </Link>
        </li>
        <li>
          <Link to="/demo/parallaxDemo2">
            Parallax Demo2
          </Link>
        </li>
        <li>
          <Link to="/demo/parallaxDemo3">
            Parallax Demo3
          </Link>
        </li>
        <li>
          <Link to="/demo/parallaxDemo4">
            Parallax Demo4
          </Link>
        </li>
        <li>
          <Link to="/demo/parallaxDemo5">
            Parallax Demo5
          </Link>
        </li>
      </ul>
    </section>
  )
}

export default ParalaxHomePage;