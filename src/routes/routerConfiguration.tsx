import * as React from 'react';
import { Switch, Route, useLocation } from "react-router-dom";
import HomePage from '../pages';
import ProjectPage from '../pages/project/index';
import ProfilePage from '../pages/profile';


const RouterConfiguration: React.FunctionComponent = () => {
  let location = useLocation();
  
  return (
    <Switch location={location}>
      <Route exact path="/" children={<HomePage />}></Route>
      <Route exact path="/projects" children={<ProjectPage />}></Route>
      <Route exact path="/profile" children={<ProfilePage />}></Route>
    </Switch>
  )
}

export default RouterConfiguration;