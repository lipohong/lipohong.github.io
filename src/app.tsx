import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HashRouter as Router } from "react-router-dom";

import "./assets/style/main.scss";
import "./assets/file/favicon.ico";
import RouterConfiguration from './routes/routerConfiguration';
import SiteBar from './components/siteBar';


const App: React.FunctionComponent = () => {

  return (
    <Router>
      <SiteBar />
      <RouterConfiguration />
    </Router>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));
