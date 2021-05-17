import * as React from 'react';

type MenuButtonProps = {
  menuOpened: boolean,
}

const MenuButton: React.FunctionComponent<MenuButtonProps> = ({ menuOpened } : MenuButtonProps) => {
  
  return (
    <div className="menuButton">
      <div>
        <div className="topBar"></div>
        <div className="bottomBar"></div>
      </div>
    </div>
  )
}

export default MenuButton;