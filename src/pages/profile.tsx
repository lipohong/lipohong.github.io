import * as React from 'react';
import { Suspense, useEffect }from 'react';
import { Link } from "react-router-dom";
import Icon from '@mdi/react';
import { mdiGithub, mdiLinkedin, mdiStar, mdiStarOutline } from '@mdi/js';
import * as smoothscroll from 'smoothscroll-polyfill';
import profile from "../assets/file/image/profile.png";
import project1 from "../assets/file/image/iwebsite-project1.png";

const ProfilePage: React.FunctionComponent = () => {

  const data = {
    navBar: [
      { content: 'Summary', dataName: 'summary' },
      { content: 'Projects', dataName: 'projects' },
      { content: 'Experience', dataName: 'workExperience' },
      { content: 'Education', dataName: 'education' },
      { content: 'Skills', dataName: 'skills' },
    ],
    frontendSkills: [
      { name: 'HTML', stars: 4 },
      { name: 'css', stars: 4 },
      { name: 'scss', stars: 3 },
      { name: 'JavaScript', stars: 4 },
      { name: 'Vue.js', stars: 4 },
      { name: 'Nuxt.js', stars: 4 },
      { name: 'React.js', stars: 3 },
      { name: 'Responsive Design', stars: 3 },
    ],
    backendSkills: [
      { name: 'Node.js', stars: 4 },
      { name: 'Express.js', stars: 4 },
      { name: 'MongoDB', stars: 4 },
      { name: 'TypeScript', stars: 3 },
      { name: 'Microservice architecture', stars: 3 },
      { name: 'MySQL', stars: 3 },
    ],
    developmentSkills: [
      ['Python', 'React Native', 'Git', 'Webpack', 'Docker', 'Jira'],
      ['Server Side Rendering', 'Agile', 'MVC', 'MVVM', 'RESTful api']
    ],
    languageSkills: [
      { name: 'cantonese', percent: 100 },
      { name: 'mandarin', percent: 90 },
      { name: 'english', percent: 70 }
    ]
  }

  const convertRemToPixels = (rem: number) => {    
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }

  const handleLargeNavBarClick = (e: React.MouseEvent<HTMLElement>) => {
    const navBar = document.getElementById('navBar');
    const tabs = navBar.getElementsByTagName('section');
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
    const navBar = document.getElementById('navBar');
    const tabs = navBar.getElementsByTagName('section');
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
    // show content
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);  //get viewpoint height
    const threshold50 = 50;
    const animationElementList = document.querySelectorAll('.showAndHideAnimation');
    animationElementList.forEach(animationElement => {
      const rect = animationElement.getBoundingClientRect();
      if (rect.top < vh - threshold50 && !animationElement.classList.contains('show')) {
        animationElement.classList.add('show');
      }
    });
  }

  const handleResize = () => {
    // recalculate the circumference for the circles
    const circleList = document.querySelectorAll<SVGCircleElement>('.mainCircle');
    circleList.forEach((circle, index) => {
      const radius = circle.getBoundingClientRect().width / 2;
      const circumference = radius * 2 * Math.PI;
      circle.style.strokeDasharray = `${circumference} ${circumference}`;
      circle.style.strokeDashoffset = `${circumference * ( 1 - data.languageSkills[index]['percent'] / 100 )}`;
    });
  }

  const handleToTopButtonClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const starsGenerate = (stars: number) => {
    let components: JSX.Element[] = [];
    if (stars > 5) {
      stars = 5;
    }
    for (let i = 0; i < stars; i++) {
      components.push(<Icon key={i} path={mdiStar} size={1} />);
    }
    for (let i = 0; i < 5 - stars; i++) {
      components.push(<Icon key={i + stars} path={mdiStarOutline} size={1} />);
    }
    
    return components;
  }

  useEffect(() => {
    if (!!window) {
      window.scrollTo(0, 0);
      handleScroll();
      handleResize();
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
    }
    // fix scroll to smoothly not working for safari
    smoothscroll.polyfill();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);


  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="profile">
        <nav id="navBar">
          {
            data.navBar.map((data, index) => (
              <section onClick={handleLargeNavBarClick} data-name={data.dataName} key={index}>{data.content}</section>
            ))
          }
        </nav>
        <main>
          <div className='container'>
            <section id="summary" className="summarySection">
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
            <section id="projects" className="projectsSection">
              <header className="title">Projects</header>
              <main>
                <div>
                  <div className="imageContainer showAndHideAnimation shrinkToNormalAnimation">
                    <img src={project1} alt="project1" />
                  </div>
                  <div className="contentContainer showAndHideAnimation shrinkToNormalAnimation">
                    <header>View all projects</header>
                    <main>I made a web page for showcasing all my projects. Just click the button bellow and you can jump to view them.</main>
                    <footer>
                      <Link to='/projects'>
                        <div className="goToProjectButton">go to project page</div>
                      </Link>
                    </footer>
                  </div>
                </div>
              </main>
            </section>
            <section className="workExperienceSection">
              <header id="workExperience" className="title">Work Experience</header>
              <main>
                <article>
                  <aside className="showAndHideAnimation rightToLeftAnimation">
                    <section className="period">
                      <span>2019<small>June</small></span>
                      <span> - </span>
                      <span>Present</span>
                    </section>
                    <section className="firstRow">Front-End Developer</section>
                    <section className="secondRow">Success Base Engineering Limited</section>
                    <section className="thirdRow">Kwun Tong, Kowloon, Hong Kong</section>
                  </aside>
                  <main className="showAndHideAnimation leftToRightAnimation">
                    <header>JOB DESCRIPTION</header>
                    <main>
                      <ul>
                        <li>Work for a start-up online shopping mall project(Vue.js + Node.js, microservice architecture).</li>
                        <li>In charge of both front-end and back-end development for the admin and merchant panel.</li>
                        <li>Transfering designs from designers into web pages.</li>
                        <li>RESTful API developing and testing.</li>
                        <li>Bug fixing for both front-end pages and back-end API.</li>
                      </ul>
                    </main>
                  </main>
                </article>
                <article>
                  <aside className="showAndHideAnimation rightToLeftAnimation">
                    <section className="period">
                      <span>2015<small>September</small></span>
                      <span> - </span>
                      <span>2018<small>May</small></span>
                    </section>
                    <section className="firstRow">Process Engineer</section>
                    <section className="secondRow">Varitronix Limited</section>
                    <section className="thirdRow">Kwun Tong, Kowloon, Hong Kong</section>
                  </aside>
                  <main className="showAndHideAnimation leftToRightAnimation">
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
            <section className="educationSection">
              <header id="education" className="title">Education</header>
              <main>
                <article>
                  <aside className="showAndHideAnimation rightToLeftAnimation">
                    <section className="period">
                      <span>2011<small>September</small></span>
                      <span> - </span>
                      <span>2015<small>June</small></span>
                    </section>
                    <section className="firstRow">Balchelor's Degree of Automation</section>
                    <section className="secondRow">Taiyuan University of Technology</section>
                    <section className="thirdRow">Shanxi Province, China</section>
                  </aside>
                  <main className="showAndHideAnimation leftToRightAnimation">
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
                  <aside className="showAndHideAnimation rightToLeftAnimation">
                    <section className="period">
                      <span>2008<small>September</small></span>
                      <span> - </span>
                      <span>2011<small>July</small></span>
                    </section>
                    <section className="firstRow">High School Diploma</section>
                    <section className="secondRow">He Shan First High School</section>
                    <section className="thirdRow">Heshan city, Guangdong Province, China</section>
                  </aside>
                  <main className="showAndHideAnimation leftToRightAnimation">
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
            <section className="skillsSection">
              <header id="skills" className="title">Skills</header>
              <main>
                <section className="skillSection showAndHideAnimation leftToRightAnimation">
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
                        {
                          data.frontendSkills.map((skillData, index) => (
                            <tr key={index}>
                              <td>{ skillData.name }</td>
                              <td>{ starsGenerate(skillData.stars) }</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </main>
                </section>
                <section className="skillSection showAndHideAnimation rightToLeftAnimation">
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
                        {
                          data.backendSkills.map((skillData, index) => (
                            <tr key={index}>
                              <td>{ skillData.name }</td>
                              <td>{ starsGenerate(skillData.stars) }</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </main>
                </section>
                <section className="skillSection showAndHideAnimation leftToRightAnimation">
                  <header className="skillsTitle">Development Skills</header>
                  <main className="developmentSkillSection">
                    <section>
                      <ul>
                        {
                          data.developmentSkills[0].map((skillData, index) => (
                            <li key={index}>{ skillData }</li>
                          ))
                        }
                      </ul>
                    </section>
                    <section>
                      <ul>
                        {
                          data.developmentSkills[1].map((skillData, index) => (
                            <li key={index}>{ skillData }</li>
                          ))
                        }
                      </ul>
                    </section>
                  </main>
                </section>
                <section className="skillSection showAndHideAnimation rightToLeftAnimation">
                  <header className="skillsTitle">Language Skills</header>
                  <main className="languageSkillSection">
                    {
                      data.languageSkills.map((skillData, index) => (
                        <section key={index}>
                          <svg>
                            <circle fill="transparent" stroke="#aaa" />
                            <circle className="mainCircle" fill="transparent" />
                            <text x="50%" y="52%" textAnchor="middle">{ skillData.name }</text>
                          </svg>
                        </section>
                      ))
                    }
                  </main>
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