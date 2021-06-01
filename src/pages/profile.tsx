import * as React from 'react';
import { Suspense }from 'react';
import Icon from '@mdi/react';
import { mdiGithub, mdiLinkedin } from '@mdi/js';
import profile from "../assets/file/image/profile.png";

const ProfilePage: React.FunctionComponent = () => {
  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="profile">
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
              <p>Stan Li is a front-end developer, with back-end development skills and experience as well.</p>
            </section>
          </main>
          <img src={profile} title="profile" alt="profile"></img>
        </section>
        <section className="secondSection">
          <header></header>
          <p></p>
          <footer>
            <section></section>
            <section></section>
            <section></section>
          </footer>
        </section>
      </main>
    </Suspense>
  )
}

export default ProfilePage;