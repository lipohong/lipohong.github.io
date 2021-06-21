import * as React from 'react';
import { Switch, Route, useLocation } from "react-router-dom";
import HomePage from '../pages';
import ProjectPage from '../pages/project/index';
import ProfilePage from '../pages/profile';
import IBlogPage from '../pages/project/iblog';
import ErrorPage from '../pages/error';


const RouterConfiguration: React.FunctionComponent = () => {
  let location = useLocation();
  
  return (
    <Switch location={location}>
      <Route exact path="/" children={<HomePage />}></Route>
      <Route exact path="/projects" children={<ProjectPage />}></Route>
      <Route exact path="/projects/iblog" children={<IBlogPage />}></Route>
      <Route exact path="/profile" children={<ProfilePage />}></Route>
      <Route children={<ErrorPage />}></Route>
    </Switch>
  )
}

export default RouterConfiguration;