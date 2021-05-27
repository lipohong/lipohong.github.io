import * as React from 'react';
import { useEffect, Suspense }from 'react';
import iblog1 from "../../assets/file/image/iblog1.png";
import iblog2 from "../../assets/file/image/iblog2.png";
import iblog3 from "../../assets/file/image/iblog3.png";
import iblog4 from "../../assets/file/image/iblog4.png";

const ProjectPage: React.FunctionComponent = () => {
  useEffect(() => {
    if (window) {
      window.scrollTo(0, 0);
    }
  }, []);

  const handleGetStartClick = () => {
    // scroll animation
    const bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const secondSection = document.getElementById('secondSection');
    const secondSectionRect = secondSection.getBoundingClientRect();
    const rectTop = secondSectionRect.top;
    if (rectTop > 0) {
      window.requestAnimationFrame(handleGetStartClick);
      window.scrollTo(0, bodyScrollTop + Math.ceil(rectTop / 10));
    }
  }

  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="project">
        <section className="firstSection">
          <main>
            <header>Projects Showcase</header>
            <div className="getStartButton" onClick={handleGetStartClick}>Get Started</div>
          </main>
          <section className="imageContainer">
            <img src={iblog4} alt="iblog4" />
            <img src={iblog3} alt="iblog3" />
            <img src={iblog2} alt="iblog2" />
            <img src={iblog1} alt="iblog1" />
          </section>
        </section>
        <section id="secondSection" className="secondSection">

        </section>
      </main>
    </Suspense>
  )
}

export default ProjectPage;