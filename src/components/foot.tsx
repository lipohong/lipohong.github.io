import * as React from 'react';
import Icon from '@mdi/react';
import { mdiGithub } from '@mdi/js';

const Foot: React.FunctionComponent = () => {

  return (
    <footer className="foot">
      iWebsite<sup>©</sup> 2021 Stan Li
      <a href="https://github.com/lipohong/lipohong.github.io">
        <Icon path={mdiGithub} size={1} />
      </a>
    </footer>
  )
}

export default Foot;