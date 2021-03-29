import * as React from 'react';
import { Switch, Route, useLocation } from "react-router-dom";

import HomePage from '../pages';
import ParallaxTemplate1 from '../pages/playground/parallaxTemplate1';
import ParallaxTemplate2 from '../pages/playground/parallaxTemplate2';
import ParallaxTemplate3 from '../pages/playground/parallaxTemplate3';


const RouterConfiguration: React.FunctionComponent = () => {
  let location = useLocation();
  
  return (
    <Switch location={location}>
        <Route exact path="/" children={<HomePage />}></Route>
        <Route path="/playground/parallaxTemplate1" children={<ParallaxTemplate1 />}></Route>
        <Route path="/playground/parallaxTemplate2" children={<ParallaxTemplate2 />}></Route>
        <Route path="/playground/parallaxTemplate3" children={<ParallaxTemplate3 />}></Route>
    </Switch>
  )
}

export default RouterConfiguration;