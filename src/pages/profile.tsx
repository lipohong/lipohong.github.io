import * as React from 'react';
import { Suspense, useEffect }from 'react';
import Icon from '@mdi/react';
import { mdiGithub, mdiLinkedin } from '@mdi/js';
import profile from "../assets/file/image/profile.png";

const ProfilePage: React.FunctionComponent = () => {

  const convertRemToPixels = (rem: number) => {    
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }

  const handleLargeNavBarClick = (e: React.MouseEvent<HTMLElement>) => {
    const largeNavBar = document.getElementById('largeNavBar');
    const tabs = largeNavBar.getElementsByTagName('section');
    // remove all chose style
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('chose');
    }
    // set chose style
    e.currentTarget.classList.add('chose');
    const id = e.currentTarget.dataset.name;
    // scroll to animation
    scrollAnimation(id);
  }

  const scrollAnimation = (id: string) => {
    // scroll animation
    const bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const targetSection = document.getElementById(id);
    const targetSectionRectTop  = targetSection.getBoundingClientRect().top;
    const scrollTo = bodyScrollTop + targetSectionRectTop - convertRemToPixels(3);   // add some space to make a proper position
    window.scrollTo({ top: scrollTo, behavior: 'smooth' });
  }

  const handleScroll = () => {
    // show positon of the page
    const largeNavBar = document.getElementById('largeNavBar');
    const tabs = largeNavBar.getElementsByTagName('section');
    let closestIndex = 0;
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('positioning');
      const targetSection = document.getElementById(tabs[i].dataset.name);
      const position = targetSection.getBoundingClientRect().top - convertRemToPixels(3.5);
      if (position <= 0) {
        closestIndex = i;
      }
    }
    tabs[closestIndex].classList.add('positioning');
    // hide or show to top button
    const bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const toTopButton = document.getElementsByClassName('toTopButton');
    if (bodyScrollTop > convertRemToPixels(3)) {
      toTopButton[0].classList.remove('hide');
    } else {
      toTopButton[0].classList.add('hide');
    }
  }

  const handleToTopButtonClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    if (!!window) {
      window.scrollTo(0, 0);
      handleScroll();
      window.addEventListener('scroll', handleScroll)
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="profile">
        <nav id="largeNavBar">
          <section onClick={handleLargeNavBarClick} data-name="summary">Summary</section>
          <section onClick={handleLargeNavBarClick} data-name="workExperience">Work Experience</section>
          <section onClick={handleLargeNavBarClick} data-name="education">Education</section>
          <section onClick={handleLargeNavBarClick} data-name="skills">Skills</section>
        </nav>
        <main>
          <div className='container'>
            <section id="summary" className="firstSection">
              <main>
                <header>
                  <hr />
                  <span>Stan</span>
                  <span>Li</span>
                  <hr />
                </header>
                <section className="upperSection">
                  <a href="https://github.com/lipohong">
                    <Icon path={mdiGithub} size={1.5} />
                  </a>
                  <a href="https://www.linkedin.com/in/stan-li-245a5b182">
                    <Icon path={mdiLinkedin} size={1.5} />
                  </a>
                </section>
                <section className="lowerSection">
                  <header>Summary</header>
                  <hr />
                  <p>A front-end developer, with back-end development skills and experience as well.</p>
                </section>
              </main>
              <div className="profileContainer">
                <img src={profile} title="profile" alt="profile"></img>
              </div>
            </section>
            <section className="secondSection">
              <header id="workExperience" className="title">Work Experience</header>
              <main>
                <article>
                  <aside>
                    <section></section>
                  </aside>
                  <main>

                  </main>
                </article>
                <article>

                </article>
              </main>
            </section>
            <section className="thirdSection">
              <header id="education" className="title">Education</header>
            </section>
            <section className="forthSection">
              <header id="skills" className="title">Skills</header>
            </section>
          </div>
        </main>
        <footer>
          <div className="toTopButton" onClick={handleToTopButtonClick}>
            <span>Top</span>
          </div>
        </footer>
      </main>
    </Suspense>
  )
}

export default ProfilePage;