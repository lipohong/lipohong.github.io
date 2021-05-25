import * as React from 'react';
import { Suspense }from 'react';

const ProjectPage: React.FunctionComponent = () => {
  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="project">
      </main>
    </Suspense>
  )
}

export default ProjectPage;