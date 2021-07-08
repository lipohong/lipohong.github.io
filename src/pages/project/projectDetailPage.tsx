import * as React from 'react';
import { useEffect, Suspense } from 'react';
import { RouteComponentProps, withRouter, useHistory } from "react-router-dom";
import Icon from '@mdi/react';
import { mdiGithub, mdiSearchWeb, mdiBook } from '@mdi/js';
import * as smoothscroll from 'smoothscroll-polyfill';
import ProjectDetailPageProps from '../../models/interface/projectDetailPageProps';
import ProjectDetailPagePresetDataType from '../../models/interface/projectDetailPagePresetDataType';
import ProjectDetailPagePropsType from '../../models/enum/projectDetailPagePropsType';
import iblog1 from "../../assets/file/image/iblog1.png";
import iblog2 from "../../assets/file/image/iblog2.png";
import iblog3 from "../../assets/file/image/iblog3.png";
import iwebsiteHome from "../../assets/file/image/iwebsite-home.png";
import iwebsiteProfile1 from "../../assets/file/image/iwebsite-profile1.png";
import iwebsiteProject2 from "../../assets/file/image/iwebsite-project2.png";
import theme1 from "../../assets/file/image/theme1.gif";
import mode1 from "../../assets/file/image/mode1.gif";
import multiLangual1 from "../../assets/file/image/multiLangual1.gif";
import responsive1 from "../../assets/file/image/responsive1.gif";
import responsive2 from "../../assets/file/image/responsive2.gif";
import register1 from "../../assets/file/image/register1.png";
import accountManagement1 from "../../assets/file/image/accountManagement1.png";
import blogManagement1 from "../../assets/file/image/blogManagement1.png";
import blogPosting1 from "../../assets/file/image/blogPosting1.png";
import commentAndLike1 from "../../assets/file/image/commentAndLike1.png";
import parallax from "../../assets/file/image/parallax.gif";
import autoTracingNavBar from "../../assets/file/image/autoTracingNavBar.gif";
import positioningNavBar from "../../assets/file/image/positioningNavBar.gif";
import navToTopButton from "../../assets/file/image/navToTopButton.gif";
import animation from "../../assets/file/image/animation.gif";


const ProjectDetailPage: React.FunctionComponent<RouteComponentProps<ProjectDetailPageProps>> = ({ match }) => {
  const data: ProjectDetailPagePresetDataType = {
    iblog: {
      header: {
        name: 'iBlog',
        description: 'iBlog is a blogging website for stories sharing.',
        address: 'http://blog.lipohong.site',
        images: {
          iblog2, iblog1, iblog3,
        }
      },
      features: [
        {
          header: 'Themes Switching',
          main: 'Choosing whatever color you like depending on your mood!',
          image: { theme1 },
        },
        {
          header: 'Light / Dark mode',
          main: 'Eyes friendly, support switching light and dark mode.',
          image: { mode1 },
        },
        {
          header: 'Multilingual',
          main: 'Switching between English and traditional Chinese (and any language you want after configuration).',
          image: { multiLangual1 },
        },
        {
          header: 'Responsive',
          main: 'With responsive feature, views differ for devices among browser, mobile, tablet, making user friendly.',
          image: { responsive1 },
        },
        {
          header: 'Register',
          main: 'If you want to post blog here, why not own an account by register page?',
          image: { register1 },
        },
        {
          header: 'Account mangement',
          main: 'Editing your profile, changing password, balabala...',
          image: { accountManagement1 },
        },
        {
          header: 'Blog posting',
          main: 'This is the basic fun of the web. Sharing your ideas and stories.',
          image: { blogPosting1 },
        },
        {
          header: 'Blog mangement',
          main: 'Of course, you can edit, delete, or even hide all your the blogs.',
          image: { blogManagement1 },
        },
        {
          header: 'Comment, like',
          main: 'User can of cause leave comments and like the blogs.',
          image: { commentAndLike1 },
        }
      ],
      stacks: [
        { header: 'Front End Framework', items: ['Nuxt.js', 'Vue.js'] },
        { header: 'UI Library', items: ['Vuetify.js'] },
        { header: 'Responsive Design', items: ['media query', 'viewport', 'responsive image'] },
        { header: 'Multi Language', items: ['nuxt-i18n'] },
        { header: 'CSS Extension', items: ['scss'] },
        { header: 'Rich Text Editor', items: ['vue-quill-editor'] },
        { header: 'Back End Framework', items: ['Node.js', 'Express.js'] },
        { header: 'Database Design', items: ['MongoDB', 'mongoose.js'] },
        { header: 'Containerization', items: ['docker'] },
      ],
      links: [
        { icon: mdiSearchWeb, content: 'Visit Website', address: 'http://blog.lipohong.site' },
        { icon: mdiGithub, content: 'Project in Github', address: 'https://github.com/lipohong/iBlog' },
        { icon: mdiBook, content: 'Document For the Project', address: 'https://github.com/lipohong/iBlog/blob/master/README.md' },
      ]
    },
    iwebsite: {
      header: {
        name: 'iWebsite',
        description: 'iWebsite is a website to showcase my profile and projects',
        address: 'https://www.lipohong.site',
        images: {
          iwebsiteProfile1, iwebsiteHome, iwebsiteProject2,
        }
      },
      features: [
        {
          header: 'Responsive',
          main: 'With responsive feature, views differ for devices among browser, mobile, tablet, making user friendly.',
          image: { responsive2 },
        },
        {
          header: 'Parallax',
          main: 'You can have an awesome experience of parallax design.',
          image: { parallax },
        },
        {
          header: 'Auto Position Trace',
          main: '(Profile Page) The navigation bar could show the real time position of the section you are browsing.',
          image: { autoTracingNavBar },
        },
        {
          header: 'Click and Jump',
          main: '(Profile Page) The navigation bar could also help you to navigate to the section you want to browse.',
          image: { positioningNavBar },
        },
        {
          header: 'Showing Animation',
          main: '(Profile Page) It shows displaying animation for the sections when scrolling down.',
          image: { animation },
        },
        {
          header: 'Easy to Top Button',
          main: '(Profile and Project Detail Page) With navigate to top button, it saves your time to navigate back to top.',
          image: { navToTopButton },
        },
      ],
      stacks: [
        { header: 'Front End Framework', items: ['React.js (version 17.0.1)'] },
        { header: 'Module Bundler', items: ['webpack.js'] },
        { header: 'Responsive Design', items: ['media query', 'viewport', 'responsive image'] },
        { header: 'CSS Extension', items: ['scss'] },
        { header: 'Website Hosting', items: ['Github Pages'] },
      ],
      links: [
        { icon: mdiSearchWeb, content: 'Visit Website', address: 'https://www.lipohong.site' },
        { icon: mdiGithub, content: 'Project in Github', address: 'https://github.com/lipohong/lipohong.github.io' },
        { icon: mdiBook, content: 'Document For the Project', address: 'https://github.com/lipohong/lipohong.github.io/blob/main/README.md' },
      ]
    }
  }

  const _slug = match.params._slug;

  const history = useHistory();

  const convertRemToPixels = (rem: number) => {    
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }

  const handleEffect = () => {
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);  //get viewpoint height

    // animate
    const threshold50 = 50;
    const animationElementList = document.querySelectorAll('.showAndHideAnimation');
    animationElementList.forEach(animationElement => {
      const rect = animationElement.getBoundingClientRect();
      if (rect.top < vh - threshold50 && !animationElement.classList.contains('show')) {
        animationElement.classList.add('show');
      }
    });

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
    if (Object.keys(ProjectDetailPagePropsType).indexOf(_slug) === -1) {
      history.push('/404');
      return;
    }    
  }, [match.params]);

  useEffect(() => {
    // fix scroll to smoothly not working for safari
    smoothscroll.polyfill();

    if (window) {
      window.scrollTo(0, 0);
      if (!!window && 'IntersectionObserver' in window) {
        handleEffect();
        window.addEventListener('load', handleEffect);
        window.addEventListener('scroll', handleEffect);
      }
    }

    return () => {
      window.removeEventListener('load', handleEffect);
      window.removeEventListener('scroll', handleEffect);
    }
  }, []);

  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="projectDetailPage">
        <header className="header">
          <main>
            <header>{ data[_slug] && data[_slug].header.name }</header>
            <main>
              <p>{ data[_slug] && data[_slug].header.description }</p>
              <a href={ data[_slug] && data[_slug].header.address } className="visitWebsiteButton">Visit website</a>
            </main>
          </main>
          <section className="imageContainer">
            {
              data[_slug] && Object.keys(data[_slug].header.images).map((imageName, index) => (
                <img src={ data[_slug].header.images[imageName] } alt={ imageName } key={index} />
              ))
            }
          </section>
        </header>
        <main className="content">
          <div className="container">
            <section>
              <header>
                <div className="title">Features</div>
              </header>
              <main>
                {
                  data[_slug] && data[_slug].features.map((article, index: number) => (
                    <React.Fragment key={index}>
                      <article>
                        {
                          index % 2 === 0 ? <>
                            <div className="imageContainer showAndHideAnimation shrinkToNormalAnimation">
                              <img src={Object.values(article.image)[0]} alt={`${Object.keys(article.image)[0]}`} />
                            </div>
                            <div className="description showAndHideAnimation rightToLeftAnimation">
                              <header>{article.header}</header>
                              <main>{article.main}</main>
                            </div>
                          </> : <>
                            <div className="description showAndHideAnimation leftToRightAnimation">
                              <header>{article.header}</header>
                              <main>{article.main}</main>
                            </div>
                            <div className="imageContainer showAndHideAnimation shrinkToNormalAnimation">
                              <img src={Object.values(article.image)[0]} alt={`${Object.keys(article.image)[0]}`} />
                            </div>
                          </>
                        }
                      </article>
                      { data[_slug] && index + 1 < data[_slug].features.length ? <hr className="showAndHideAnimation" /> : <></> }
                    </React.Fragment>
                  ))
                }
              </main>
            </section>
            <section>
              <header>
                <div className="title">Technical Stack</div>
              </header>
              <main className="stackContainer">
                {
                  data[_slug] && data[_slug].stacks.map((stack, index) => (
                    <div className="stackInfoContainer showAndHideAnimation hugeToNormalAnimation" key={index}>
                      <div className="bulletinContainer">
                        <div className="bulletin"></div>
                      </div>
                      <header>{ stack.header }</header>
                      <main>
                        <ul>
                          {
                            stack.items.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          }
                        </ul>
                      </main>
                    </div>
                  ))
                }
              </main>
            </section>
            <section>
              <header>
                <div className="title">Links</div>
              </header>
              <main className="linksContainer">
                {
                  data[_slug] && data[_slug].links.map((link, index) => (
                    <a href={link.address} key={index}>
                      <div className="linkCard showAndHideAnimation leftToRightAnimation">
                        <Icon path={link.icon} size={2} />
                        <span>{ link.content }</span>
                        <span>&gt;</span>
                      </div>
                    </a>
                  ))
                }
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

export default withRouter(ProjectDetailPage);