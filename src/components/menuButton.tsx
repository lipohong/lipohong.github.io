import * as React from 'react';
import { useState, useEffect }from 'react';

type MenuButtonProps = {
  menuOpened: boolean,
}

const MenuButton: React.FunctionComponent<MenuButtonProps> = ({ menuOpened } : MenuButtonProps) => {
  const [topBarClass, setTopBarClass] = useState<string>('topBar');
  const [bottomBarClass, setBottomBarClass] = useState<string>('bottomBar');

  useEffect(() => {
    setTopBarClass(`topBar${ menuOpened ? ' topBarOpen' : ' topBarClose' }`);
    setBottomBarClass(`bottomBar${ menuOpened ? ' bottomBarOpen' : ' bottomBarClose' }`); 
  }, [menuOpened]);
  useEffect(() => {
    setTopBarClass(`topBar`);
    setBottomBarClass(`bottomBar`); 
  }, []);

  return (
    <div className="menuButton">
      <div>
        <div className={topBarClass}></div>
        <div className={bottomBarClass}></div>
      </div>
    </div>
  )
}

export default MenuButton;