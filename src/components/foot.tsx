import * as React from 'react';
import Icon from '@mdi/react';
import { mdiGithub } from '@mdi/js';

const Foot: React.FunctionComponent = () => {

  return (
    <footer>
      iWebsite© 2021 Stan Li
      <Icon path={mdiGithub}
        title="View Github"
        size={1}
        horizontal
      />
    </footer>
  )
}

export default Foot;