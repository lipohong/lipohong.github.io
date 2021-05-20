import * as React from 'react';
import { Switch, Route, useLocation } from "react-router-dom";

import HomePage from '../pages';
import ParallaxHomePage from '../pages/demo/index';
import ParallaxDemo1 from '../pages/demo/parallaxDemo1';
import ParallaxDemo2 from '../pages/demo/parallaxDemo2';
import ParallaxDemo3 from '../pages/demo/parallaxDemo3';


const RouterConfiguration: React.FunctionComponent = () => {
  let location = useLocation();
  
  return (
    <main className="main">
      <Switch location={location}>
        <Route exact path="/" children={<HomePage />}></Route>
        <Route exact path="/demo" children={<ParallaxHomePage />}></Route>
        <Route path="/demo/parallaxDemo1" children={<ParallaxDemo1 />}></Route>
        <Route path="/demo/parallaxDemo2" children={<ParallaxDemo2 />}></Route>
        <Route path="/demo/parallaxDemo3" children={<ParallaxDemo3 />}></Route>
      </Switch>
    </main>
  )
}

export default RouterConfiguration;