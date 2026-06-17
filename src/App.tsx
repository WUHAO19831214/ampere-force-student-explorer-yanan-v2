import { useMemo, useRef, useState } from 'react';
import schoolLogo from './assets/school-logo.png';
import { ControlPanel } from './components/ControlPanel';
import { DataInputPanel } from './components/DataInputPanel';
import { StudentAmpere3D, type StudentAmpere3DHandle } from './components/StudentAmpere3D';
import type { DirectionInput } from './utils/angleVector';

const defaultInput: DirectionInput = { current: '+x', alphaDeg: 90, betaDeg: 180 };

export default function App() {
  const viewerRef = useRef<StudentAmpere3DHandle | null>(null);
  const [draftInput, setDraftInput] = useState<DirectionInput>(defaultInput);
  const [drawnInput, setDrawnInput] = useState<DirectionInput>(defaultInput);
  const [showAngles, setShowAngles] = useState(true);

  const pageTitle = useMemo(() => '安培力方向关系学生探究工具', []);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="school-brand">
          <img src={schoolLogo} className="school-logo" alt="上海市延安中学校徽" />
          <div className="school-title-block">
            <p>上海市延安中学</p>
            <h1>{pageTitle}</h1>
          </div>
        </div>
      </header>

      <section className="workspace" aria-label={pageTitle}>
        <section className="visual-area" aria-label="三维图示区域">
          <StudentAmpere3D
            ref={viewerRef}
            input={drawnInput}
            showAngles={showAngles}
          />
          <ControlPanel
            showAngles={showAngles}
            onZyView={() => viewerRef.current?.setZyView()}
            onOrbitView={() => viewerRef.current?.setOrbitView()}
            onToggleAngles={() => setShowAngles((value) => !value)}
          />
        </section>

        <DataInputPanel
          value={draftInput}
          onChange={setDraftInput}
          onDraw={() => {
            setDrawnInput(draftInput);
            viewerRef.current?.setZyView();
          }}
        />
      </section>
    </main>
  );
}
