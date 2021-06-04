import * as React from 'react';
import { Suspense }from 'react';
import Icon from '@mdi/react';
import { mdiGithub, mdiLinkedin } from '@mdi/js';
import profile from "../assets/file/image/profile.png";

const ProfilePage: React.FunctionComponent = () => {
  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="profile">
        <div className='container'>
          <section className="firstSection">
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
            <header className="title">Work Experience</header>
            <main>
              <section>
                
              </section>
              <section></section>
            </main>
          </section>
          <section className="thirdSection">
            <header className="title">Education</header>
          </section>
          <section className="forthSection">
            <header className="title">Skills</header>
          </section>
        </div>
      </main>
    </Suspense>
  )
}

export default ProfilePage;