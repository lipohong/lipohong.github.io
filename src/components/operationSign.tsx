import * as React from 'react';
import OperationSignType from '../models/enum/operationSignType';
import OperationSignProps from '../models/interface/operationSignProps';


const OperationSign: React.FunctionComponent<OperationSignProps> = (props: OperationSignProps) => {
  
  const ShapeGenerator: React.FunctionComponent = () => {
    const { type, size, rotation, color, zIndex, top, bottom, left, right } = props;
  
    switch (type) {
      case OperationSignType.addition:
        return (
          <div className="additionContainer" style={{ top: `${top}rem`, bottom: `${bottom}rem`, left: `${left}rem`, right: `${right}rem` }}>
            <div className={`addition ${color}`} style={{ transform: `rotate(${rotation}deg)`, height: `${size}rem`, width: `${size}rem`, zIndex: zIndex }}></div>
          </div>
        )
      case OperationSignType.subtraction:
        return (
          <div
            className={`subtraction ${color}`}
            style={{
              transform: `rotate(${rotation}deg)`,
              height: `${size}rem`,
              width: `${size / 3}rem`,
              zIndex: zIndex,
              top: `${top}rem`,
              bottom: `${bottom}rem`,
              left: `${left}rem`,
              right: `${right}rem`
            }}
          >
          </div>
        )
      case OperationSignType.division:
        return (
          <div
            className="division"
            style={{ transform: `rotate(${rotation}deg)`, zIndex: zIndex, top: `${top}rem`, bottom: `${bottom}rem`, left: `${left}rem`, right: `${right}rem` }}
          >
            <div className={`upperDot ${color}`} style={{ height: `${size / 3}rem`, width: `${size / 3}rem`}}></div>
            <div className={`middleBar ${color}`} style={{ height: `${size / 3}rem`, width: `${size}rem`}}></div>
            <div className={`lowerDot ${color}`} style={{ height: `${size / 3}rem`, width: `${size / 3}rem`}}></div>
          </div>
        )
      default:
        return (<div>Wrong Type</div>)
    }
  }


  return (
    <section className="operationSign">
      <ShapeGenerator />
    </section>
  )
}

export default OperationSign;