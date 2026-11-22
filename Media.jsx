import { useRef, useState } from 'react';
import { Upload, Trash2, RefreshCw, FileVideo, Package } from 'lucide-react';
import { api } from '../api/services.js';
import { useLoad, useAction } from '../hooks.js';
import { Card, Button, PageHead, Gate, Msg, Empty } from '../components/UI.jsx';

// Size limits depend on your backend. Large APKs are best sent straight to storage (see README).
const CATS = [
  { id: 'apk', label: 'APK files', accept: '.apk,application/vnd.android.package-archive', mb: 150, Icon: Package },
  { id: 'setup_video', label: 'Setup videos', accept: 'video/*', mb: 100, Icon: FileVideo },
  { id: 'demo_video', label: 'Demo videos', accept: 'video/*', mb: 100, Icon: FileVideo },
];
const size = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`);

function Section({ cat }) {
  const st = useLoad(() => api.listMedia(cat.id), [cat.id]);
  const a = useAction();
  const input = useRef();
  const [target, setTarget] = useState(null); // item being replaced, or null for new
  const [err, setErr] = useState('');

  const choose = (item) => { setTarget(item); setErr(''); input.current.value = ''; input.current.click(); };
  const onFile = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > cat.mb * 1048576) return setErr(`File must be under ${cat.mb} MB.`);
    const ok = await a.run(() => api.uploadMedia(cat.id, f, target?.title || f.name, target?.id), target ? 'File replaced' : 'File uploaded');
    if (ok) st.reload();
  };
  const del = async (m) => {
    if (!window.confirm(`Delete "${m.title}"? This cannot be undone.`)) return;
    if (await a.run(() => api.deleteMedia(m.id), 'File deleted')) st.reload();
  };

  return (
    <Card title={cat.label} action={<Button variant="ghost" loading={a.busy} onClick={() => choose(null)}><Upload size={16} />Upload</Button>}>
      <input ref={input} type="file" accept={cat.accept} hidden onChange={onFile} />
      {err && <div className="note err">{err}</div>}
      <Msg msg={a.msg} />
      <Gate st={st} what={cat.label.toLowerCase()}>
        {(items) => !items?.length ? <Empty>Nothing uploaded yet.</Empty> : (
          <ul className="list">
            {items.map((m) => (
              <li key={m.id}>
                <cat.Icon size={20} />
                <div className="grow"><b>{m.title}</b><small>{m.size ? size(m.size) : ''}{m.updatedAt ? ` · ${new Date(m.updatedAt).toLocaleDateString()}` : ''}</small></div>
                <button className="icon" aria-label="Replace" onClick={() => choose(m)}><RefreshCw size={18} /></button>
                <button className="icon danger" aria-label="Delete" onClick={() => del(m)}><Trash2 size={18} /></button>
              </li>
            ))}
          </ul>
        )}
      </Gate>
    </Card>
  );
}

export default function Media() {
  return (
    <>
      <PageHead title="Media" sub="Files the bot sends to customers." />
      {CATS.map((c) => <Section key={c.id} cat={c} />)}
    </>
  );
}
