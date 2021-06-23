import * as React from 'react';
import { useEffect, Suspense } from 'react';
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
    features: {
      frontend: [
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
          image: { blogManagement1 },
        }
      ]
    }
  }
  useEffect(() => {
    if (window) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="iBlogPage">
        <header className="header">
          <main>
            <header>iBlog</header>
            <main>iBlog is a blogging website for stories sharing</main>
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
                <div className="subtitle">Front End</div>
              </header>
              <main>
                {
                  data.features.frontend.map((article, index) => (
                    <article key={index}>
                      {
                        index % 2 === 0 ? <>
                          <img src={Object.values(article.image)[0]} alt={`${Object.keys(article.image)[0]}`} />
                          <div className="description">
                            <header>{article.header}</header>
                            <main>{article.main}</main>
                          </div>
                        </> : <>
                          <div className="description">
                            <header>{article.header}</header>
                            <main>{article.main}</main>
                          </div>
                          <img src={Object.values(article.image)[0]} alt={`${Object.keys(article.image)[0]}`} />
                        </>
                      }
                    </article>
                  ))
                }
              </main>
            </section>
          </div>
        </main>
      </main>
    </Suspense>
  )
}

export default iBlogPage;