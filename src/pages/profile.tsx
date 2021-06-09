import * as React from 'react';
import { Suspense, useEffect }from 'react';
import Icon from '@mdi/react';
import { mdiGithub, mdiLinkedin, mdiStar, mdiStarOutline } from '@mdi/js';
import * as smoothscroll from 'smoothscroll-polyfill';
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
    // fix scroll to smoothly not working for safari
    smoothscroll.polyfill();

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
                    <section className="period">
                      <span>2019<small>June</small></span>
                      <span> - </span>
                      <span>Present</span>
                    </section>
                    <section className="firstRow">Front-End Developer</section>
                    <section className="secondRow">Success Base Engineering Limited</section>
                    <section className="thirdRow">Kwun Tong, Kowloon, Hong Kong</section>
                  </aside>
                  <main>
                    <header>JOB DESCRIPTION</header>
                    <main>
                      <ul>
                        <li>Features development for the admin panel of the e-commerce website.</li>
                        <li>In charge of module by module development both from front end and back end for the project.</li>
                        <li>Performance enhancement for the code.</li>
                        <li>Bug fix for the code.</li>
                      </ul>
                    </main>
                  </main>
                </article>
                <article>
                  <aside>
                    <section className="period">
                      <span>2015<small>September</small></span>
                      <span> - </span>
                      <span>2018<small>May</small></span>
                    </section>
                    <section className="firstRow">Process Engineer</section>
                    <section className="secondRow">BOE Varitronix Limited</section>
                    <section className="thirdRow">Kwun Tong, Kowloon, Hong Kong</section>
                  </aside>
                  <main>
                    <header>JOB DESCRIPTION</header>
                    <main>
                      <ul>
                        <li>Promoting LCD production yield rate by defect analysing and trouble shooting.</li>
                        <li>Developing programme for LCD glass scribing.</li>
                      </ul>
                    </main>
                  </main>
                </article>
              </main>
            </section>
            <section className="thirdSection">
              <header id="education" className="title">Education</header>
              <main>
                <article>
                  <aside>
                    <section className="period">
                      <span>2011<small>September</small></span>
                      <span> - </span>
                      <span>2015<small>June</small></span>
                    </section>
                    <section className="firstRow">Balchelor's Degree of Automation</section>
                    <section className="secondRow">Taiyuan University of Technology</section>
                    <section className="thirdRow">Shanxi Province, China</section>
                  </aside>
                  <main>
                    <header>SCHOOL PROFILE DESCRIPTION</header>
                    <main>
                      <ul>
                        <li>The university is one of the <strong>211 projects universities</strong> in China.</li>
                        <li>Automation is a major that focus on the automation theory and technology apply to many relative domains like mechanical, electrical and electronical industries.</li>
                        <li>Adwarded 1st Prize in Shanxi Province area for National Electronic Design Contest of Universities in 2013.</li>
                      </ul>
                    </main>
                  </main>
                </article>
                <article>
                  <aside>
                    <section className="period">
                      <span>2008<small>September</small></span>
                      <span> - </span>
                      <span>2011<small>July</small></span>
                    </section>
                    <section className="firstRow">High School Diploma</section>
                    <section className="secondRow">He Shan First High School</section>
                    <section className="thirdRow">Heshan city, Guangdong Province, China</section>
                  </aside>
                  <main>
                    <header>SCHOOL PROFILE DESCRIPTION</header>
                    <main>
                      <ul>
                        <li>The school is the best local high school.</li>
                        <li>With the most universities entry rate.</li>
                        <li>With the most primary universities entry rate in the Jiangmen area.</li>
                        <li>With alumnus from TsingHua university and Peking university.</li>
                      </ul>
                    </main>
                  </main>
                </article>
              </main>
            </section>
            <section className="forthSection">
              <header id="skills" className="title">Skills</header>
              <main>
                <section>
                  <header className="skillsTitle">Front End Development Skills</header>
                  <main>
                    <table>
                      <thead>
                        <tr>
                          <th>Skills</th>
                          <th>Personal Ratings</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>HTML</td>
                          <td>
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStarOutline} size={1} />
                          </td>
                        </tr>
                        <tr>
                          <td>css</td>
                          <td>
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStarOutline} size={1} />
                          </td>
                        </tr>
                        <tr>
                          <td>JavaScript</td>
                          <td>
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStarOutline} size={1} />
                            <Icon path={mdiStarOutline} size={1} />
                          </td>
                        </tr>
                        <tr>
                          <td>Vue.js</td>
                          <td>
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStarOutline} size={1} />
                            <Icon path={mdiStarOutline} size={1} />
                          </td>
                        </tr>
                        <tr>
                          <td>Nuxt.js</td>
                          <td>
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStarOutline} size={1} />
                            <Icon path={mdiStarOutline} size={1} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </main>
                </section>
                <section>
                  <header className="skillsTitle">Back End Development Skills</header>
                  <main>
                    <table>
                      <thead>
                        <tr>
                          <th>Skills</th>
                          <th>Personal Ratings</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Node.js</td>
                          <td>
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStarOutline} size={1} />
                          </td>
                        </tr>
                        <tr>
                          <td>Express.js</td>
                          <td>
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStarOutline} size={1} />
                          </td>
                        </tr>
                        <tr>
                          <td>Back End Strcture</td>
                          <td>
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStar} size={1} />
                            <Icon path={mdiStarOutline} size={1} />
                            <Icon path={mdiStarOutline} size={1} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </main>
                </section>
                <section>
                  <header className="skillsTitle">Programming Relavant Skills</header>
                </section>
                <section>
                  <header className="skillsTitle">Language Skills</header>
                </section>
              </main>
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