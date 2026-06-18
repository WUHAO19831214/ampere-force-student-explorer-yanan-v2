import type { ChangeEvent } from 'react';
import { clampAngleInput, type CurrentDirection, type DirectionInput } from '../utils/angleVector';

interface DataInputPanelProps {
  value: DirectionInput;
  onChange: (value: DirectionInput) => void;
  onDraw: () => void;
}

export function DataInputPanel({ value, onChange, onDraw }: DataInputPanelProps) {
  const updateAngle = (field: 'alphaDeg' | 'betaDeg') => (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, [field]: clampAngleInput(Number(event.target.value)) });
  };

  return (
    <aside className="input-panel" aria-label="数据输入区域">
      <div className="panel-section">
        <label htmlFor="current">电流方向</label>
        <select
          id="current"
          className="physics-control"
          value={value.current}
          onChange={(event) => onChange({ ...value, current: event.target.value as CurrentDirection })}
        >
          <option value="+x">I: +x</option>
          <option value="-x">I: -x</option>
        </select>
      </div>

      <div className="panel-section">
        <label htmlFor="alpha">
          <span className="physics-symbol">B</span> 磁场方向角 <span className="physics-symbol">α</span>
        </label>
        <div className="angle-input">
          <span className="physics-symbol">α =</span>
          <input id="alpha" type="number" min="0" max="360" step="1" value={value.alphaDeg} onChange={updateAngle('alphaDeg')} />
          <span>°</span>
        </div>
        <p>
          从 <span className="physics-symbol">+y</span> 正方向逆时针第一次转到 <span className="physics-symbol">B</span>{' '}
          正方向的夹角。
        </p>
      </div>

      <div className="panel-section">
        <label htmlFor="beta">
          <span className="force-symbol">
            <span className="physics-symbol">F</span>
            <sub>安培力</sub>
          </span>{' '}
          方向角 <span className="physics-symbol">β</span>
        </label>
        <div className="angle-input">
          <span className="physics-symbol">β =</span>
          <input id="beta" type="number" min="0" max="360" step="1" value={value.betaDeg} onChange={updateAngle('betaDeg')} />
          <span>°</span>
        </div>
        <p>
          从 <span className="physics-symbol">+y</span> 正方向逆时针第一次转到{' '}
          <span className="force-symbol inline-force">
            <span className="physics-symbol">F</span>
            <sub>安培力</sub>
          </span>{' '}
          正方向的夹角。
        </p>
      </div>

      <button type="button" className="draw-button" onClick={onDraw}>
        点击绘图
      </button>
    </aside>
  );
}
