import * as React from 'react';
import { useState, MouseEvent  } from 'react';
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/file/logo.png";
import MenuButton from "./menuButton";

const SideBar: React.FunctionComponent = () => {
  let [menuOpened, setMenuOpened] = useState<boolean>(false);
  const location = useLocation();  
  let choseTab = null;
  switch (location.pathname.split('/')[1]) {
    case 'profile':
      choseTab = 'profile';
    break;
    case 'projects':
      choseTab = 'projects';
    break;
    case 'spa':
      choseTab = 'spa';
    break;
    case 'demo':
      choseTab = 'demo';
    break;
    case 'knowledge':
      choseTab = 'knowledge';
    break;
    default:
    break;
  }

  const handleMenuButtonClick = (event: MouseEvent) => {
    event.preventDefault();
    setMenuOpened(!menuOpened);
  }

  return (
    <nav className="siteBar">
      <header>
        <Link to="/">
          <img src={logo} alt="logo" />
          <span>iWebsite</span>
        </Link>
      </header>
      <Link to="/profile">
        <section className={choseTab === 'profile' ? 'choose' : ''}>
          Profile
        </section>
      </Link>
      <Link to="/projects">
        <section className={choseTab === 'projects' ? 'choose' : ''}>
          Projects
        </section>
      </Link>
      <Link to="/spa">
        <section className={choseTab === 'spa' ? 'choose' : ''}>
          SPA
        </section>
      </Link>
      <Link to="/demo">
        <section className={choseTab === 'demo' ? 'choose' : ''}>
          Demos
        </section>
      </Link>
      <Link to="/knowledge">
        <section className={choseTab === 'knowledge' ? 'choose' : ''}>
          Knowledge
        </section>
      </Link>
      <aside onClick={handleMenuButtonClick}>
        <MenuButton menuOpened={menuOpened} />
      </aside>
    </nav>
  )
}

export default SideBar;