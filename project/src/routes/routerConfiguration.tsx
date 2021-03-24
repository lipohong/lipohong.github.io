import * as React from 'react';
import { Switch, Route, useLocation } from "react-router-dom";

import HomePage from '../pages';
import Parallax from '../pages/playground/parallax';


const RouterConfiguration: React.FunctionComponent = () => {
  let location = useLocation();
  
  return (
    <Switch location={location}>
        <Route exact path="/" children={<HomePage />}></Route>
        <Route path="/playground/parallax" children={<Parallax />}></Route>
    </Switch>
  )
}

export default RouterConfiguration;