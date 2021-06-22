import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HashRouter as Router } from "react-router-dom";

import "./assets/style/main.scss";
import "./assets/file/image/favicon.ico";
import 'bootstrap/dist/css/bootstrap.min.css';
import RouterConfiguration from './routes/routerConfiguration';
import SiteBar from './components/siteBar';
import Foot from './components/foot';


const App: React.FunctionComponent = () => {

  return (
    <Router>
      <SiteBar />
      <RouterConfiguration />
      <Foot />
    </Router>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));
