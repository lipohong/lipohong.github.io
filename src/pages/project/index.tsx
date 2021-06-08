import * as React from 'react';
import { useEffect, Suspense }from 'react';
import { Link } from "react-router-dom";
import iblog1 from "../../assets/file/image/iblog1.png";
import iblog2 from "../../assets/file/image/iblog2.png";
import iblog3 from "../../assets/file/image/iblog3.png";
import iwebsiteHome from "../../assets/file/image/iwebsite-home.png";
import project1 from "../../assets/file/image/iwebsite-project1.png";

const threshold50 = 50;

const ProjectPage: React.FunctionComponent = () => {
  const handleEffect = () => {
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);  //get viewpoint height

    // animate
    const buttonList = document.querySelectorAll('.readMoreButton');
    buttonList.forEach(button => {
      const rect = button.getBoundingClientRect();
      if (rect.top > vh) {
        button.classList.remove('show');
        button.classList.add('hide');
      } else if (rect.top < vh - threshold50) {
        button.classList.remove('hide');
        button.classList.add('show');
      }
    });
    const imageList = document.querySelectorAll('.imageAnimation');
    imageList.forEach(image => {
      const rect = image.getBoundingClientRect();
      if (rect.top > vh) {
        image.classList.remove('show');
        image.classList.add('hide');
      } else if (rect.top < vh - threshold50) {
        image.classList.remove('hide');
        image.classList.add('show');
      }
    });

    // paralax
    const iwebsiteImage = document.getElementById('iwebsiteImage');
    const secondProject = document.querySelector('#secondProject');
    const secondProjectRect = secondProject.getBoundingClientRect();
    iwebsiteImage.style.top = String(`${secondProjectRect.top * 0.1}px`);
  }

  useEffect(() => {
    if (window) {
      window.scrollTo(0, 0);
    }
    if (!!window && 'IntersectionObserver' in window) {
      handleEffect();
      window.addEventListener('load', handleEffect);
      window.addEventListener('scroll', handleEffect);
    }
    return () => {
      window.removeEventListener('load', handleEffect);
      window.removeEventListener('scroll', handleEffect);
    }
  }, []);

  const handleGetStartClick = () => {
    // scroll animation
    const bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const secondSection = document.getElementById('secondSection');
    const secondSectionRect = secondSection.getBoundingClientRect();
    const rectTop = secondSectionRect.top;
    if (!window.requestAnimationFrame) {
      window.scrollTo(0, bodyScrollTop + rectTop);  // for browser that not support requestAnimationFrame
    } else if (rectTop > 0) {
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
            <img src={project1} alt="project1" />
            <img src={iwebsiteHome} alt="iwebsite-home" />
            <img src={iblog2} alt="iblog2" />
            <img src={iblog1} alt="iblog1" />
          </section>
        </section>
        <section id="secondSection" className="secondSection">
          <main>
            <section className="firstProject">
              <section className="imageContainer">
                <img src={iblog3} alt="iblog3" />
                <img src={iblog2} alt="iblog2" />
                <img src={iblog1} alt="iblog1" />
              </section>
              <main className="projectDescription">
                <header>iBlog</header>
                <p>iBlog is a blogging website for stories sharing</p>
                <ul>
                  <li>Light / Dark mode</li>
                  <li>Multiple Themes</li>
                  <li>Mobile Friendly</li>
                  <li>Register / Login</li>
                  <li>Blog Posting Freely</li>
                </ul>
                <div className="readMoreButton">Read More</div>
              </main>
              <div className="backgroundCover"></div>
            </section>
            <section id="secondProject" className="secondProject">
              <main className="projectDescription">
                <header>iWebsite</header>
                <p>iWebsite is a site for showcasing my projects</p>
                <ul>
                  <li>HTML5 CSS3</li>
                  <li>Parallax</li>
                  <li>Mobile Friendly</li>
                  <li>Projects Showcase</li>
                </ul>
                <div id="readMoreButton2" className="readMoreButton">Read More</div>
              </main>
              <section className="imageContainer">
                <img className="imageAnimation" id="iwebsiteImage" src={iwebsiteHome} alt="iwebsite-home" />
              </section>
            </section>
            <section id="thirdProject" className="thirdProject">
              <div>
                <img className="imageAnimation" id="iwebsiteImage" src={iwebsiteHome} alt="iwebsite-home" />
                <main className="projectDescription">
                  <header>
                    More are Comming Soon
                  </header>
                  <p>Please follow the website and get the latest updates</p>
                  <Link to='/'>
                    <div className="readMoreButton">Back To Home</div>
                  </Link>
                </main>
                <div className="backgroundCover"></div>
              </div>
            </section>
          </main>
        </section>
      </main>
    </Suspense>
  )
}

export default ProjectPage;