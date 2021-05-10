import * as React from 'react';
import { Switch, Route, useLocation } from "react-router-dom";

import HomePage from '../pages';
import ParallaxDemo1 from '../pages/demo/parallaxDemo1';
import ParallaxDemo2 from '../pages/demo/parallaxDemo2';
import ParallaxDemo3 from '../pages/demo/parallaxDemo3';
import ParallaxDemo4 from '../pages/demo/parallaxDemo4';
import ParallaxDemo5 from '../pages/demo/parallaxDemo5';


const RouterConfiguration: React.FunctionComponent = () => {
  let location = useLocation();
  
  return (
    <Switch location={location}>
        <Route exact path="/" children={<HomePage />}></Route>
        <Route path="/demo/parallaxDemo1" children={<ParallaxDemo1 />}></Route>
        <Route path="/demo/parallaxDemo2" children={<ParallaxDemo2 />}></Route>
        <Route path="/demo/parallaxDemo3" children={<ParallaxDemo3 />}></Route>
        <Route path="/demo/parallaxDemo4" children={<ParallaxDemo4 />}></Route>
        <Route path="/demo/parallaxDemo5" children={<ParallaxDemo5 />}></Route>
    </Switch>
  )
}

export default RouterConfiguration;