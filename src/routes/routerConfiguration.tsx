import * as React from 'react';
import { Switch, Route, useLocation } from "react-router-dom";

import HomePage from '../pages';
import ProfilePage from '../pages/profile';
import ProjectPage from '../pages/project';
import SpaPage from '../pages/spa';
import DemoPage from '../pages/demo';
import KnowledgePage from '../pages/knowledge';
import ParallaxDemo1 from '../pages/demo/parallaxDemo1';
import ParallaxDemo2 from '../pages/demo/parallaxDemo2';
import ParallaxDemo3 from '../pages/demo/parallaxDemo3';


const RouterConfiguration: React.FunctionComponent = () => {
  let location = useLocation();
  
  return (
    <Switch location={location}>
      <Route exact path="/" children={<HomePage />}></Route>
      <Route exact path="/profile" children={<ProfilePage />}></Route>
      <Route exact path="/projects" children={<ProjectPage />}></Route>
      <Route exact path="/spa" children={<SpaPage />}></Route>
      <Route exact path="/demo" children={<DemoPage />}></Route>
      <Route exact path="/knowledge" children={<KnowledgePage />}></Route>
      <Route path="/demo/parallaxDemo1" children={<ParallaxDemo1 />}></Route>
      <Route path="/demo/parallaxDemo2" children={<ParallaxDemo2 />}></Route>
      <Route path="/demo/parallaxDemo3" children={<ParallaxDemo3 />}></Route>
    </Switch>
  )
}

export default RouterConfiguration;