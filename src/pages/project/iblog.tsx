import * as React from 'react';
import { useEffect, Suspense } from 'react';
import Icon from '@mdi/react';
import { mdiGithub, mdiSearchWeb, mdiBook } from '@mdi/js';
import * as smoothscroll from 'smoothscroll-polyfill';
import iblog1 from "../../assets/file/image/iblog1.png";
import iblog2 from "../../assets/file/image/iblog2.png";
import iblog3 from "../../assets/file/image/iblog3.png";
import theme1 from "../../assets/file/image/theme1.gif";
import mode1 from "../../assets/file/image/mode1.gif";
import multiLangual1 from "../../assets/file/image/multiLangual1.gif";
import responsive1 from "../../assets/file/image/responsive1.gif";
import register1 from "../../assets/file/image/register1.png";
import accountManagement1 from "../../assets/file/image/accountManagement1.png";
import blogManagement1 from "../../assets/file/image/blogManagement1.png";
import blogPosting1 from "../../assets/file/image/blogPosting1.png";
import commentAndLike1 from "../../assets/file/image/commentAndLike1.png";

const iBlogPage: React.FunctionComponent = () => {
  const data = {
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
        main: 'If you want to post blog here, why not own an account by register page?',
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
      { icon: mdiSearchWeb, content: 'Visit Website', address: 'http://lipohong.site' },
      { icon: mdiGithub, content: 'Project in Github', address: 'https://github.com/lipohong/iBlog' },
      { icon: mdiBook, content: 'Document For the Project', address: 'https://github.com/lipohong/iBlog/blob/master/README.md' },
    ]
  }

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
      <main className="iBlogPage">
        <header className="header">
          <main>
            <header>iBlog</header>
            <main>
              <p>iBlog is a blogging website for stories sharing.</p>
              <a href="http://lipohong.site" className="visitWebsiteButton">Visit website</a>
            </main>
          </main>
          <section className="imageContainer">
            <img src={iblog3} alt="iblog3" />
            <img src={iblog1} alt="iblog1" />
            <img src={iblog2} alt="iblog2" />
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
                  data.features.map((article, index) => (
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
                      { index + 1 < data.features.length ? <hr /> : <></> }
                    </React.Fragment>
                  ))
                }
              </main>
              <header>
                <div className="title">Technical Stack</div>
              </header>
              <main className="stackContainer">
                {
                  data.stacks.map((stack, index) => (
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
                  data.links.map((link, index) => (
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

export default iBlogPage;