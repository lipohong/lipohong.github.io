import * as React from 'react';
import { Suspense }from 'react';
import { Link } from "react-router-dom";


const DemoPage: React.FunctionComponent = () => {
  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="demo">
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
        </ul>
      </main>
    </Suspense>
  )
}

export default DemoPage;