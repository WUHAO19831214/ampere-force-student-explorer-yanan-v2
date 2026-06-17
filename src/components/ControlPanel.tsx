interface ControlPanelProps {
  showAngles: boolean;
  onZyView: () => void;
  onOrbitView: () => void;
  onToggleAngles: () => void;
}

export function ControlPanel({
  showAngles,
  onZyView,
  onOrbitView,
  onToggleAngles,
}: ControlPanelProps) {
  return (
    <div className="control-bar" aria-label="探究控制">
      <button type="button" onClick={onZyView}>
        <span className="physics-symbol">Z-Y</span> 正视图
      </button>
      <button type="button" onClick={onOrbitView}>
        可旋转视角
      </button>
      <button type="button" className={showAngles ? 'is-active' : ''} onClick={onToggleAngles}>
        {showAngles ? (
          <>
            隐藏 <span className="physics-symbol">αβ</span>
          </>
        ) : (
          <>
            显示 <span className="physics-symbol">αβ</span>
          </>
        )}
      </button>
    </div>
  );
}
