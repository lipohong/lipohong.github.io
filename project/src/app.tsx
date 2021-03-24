import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HashRouter as Router } from "react-router-dom";

import "./assets/style/main.scss";

import RouterConfiguration from './routes/routerConfiguration';

const App: React.FunctionComponent = () => {

  return (
    <Router>
        <RouterConfiguration />
    </Router>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));
