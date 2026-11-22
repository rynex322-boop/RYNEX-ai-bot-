import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { api } from '../api/services.js';
import { useLoad, useAction } from '../hooks.js';
import { Card, Button, PageHead, Gate, Msg, Empty } from '../components/UI.jsx';

const MAX_MB = 2;

export default function Qr() {
  const st = useLoad(api.getQr);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [err, setErr] = useState('');
  const a = useAction();

  useEffect(() => {
    if (!file) return setPreview('');
    const u = URL.createObjectURL(file); setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const pick = (f) => {
    setErr(''); if (!f) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) return setErr('Use a PNG, JPG or WebP image.');
    if (f.size > MAX_MB * 1048576) return setErr(`Image must be under ${MAX_MB} MB.`);
    setFile(f);
  };
  const save = async () => { if (await a.run(() => api.uploadQr(file), 'QR updated')) { setFile(null); st.reload(); } };

  return (
    <>
      <PageHead title="Payment QR" sub="Customers receive this QR when they place an order." />
      <Gate st={st} keepOnPending what="QR image">
        {(d) => (
          <div className="grid two">
            <Card title="Current QR">
              {d?.url ? <img className="qr" src={d.url} alt="Current payment QR" /> : <Empty>No QR uploaded yet.</Empty>}
            </Card>
            <Card title={d?.url ? 'Replace QR' : 'Upload QR'}>
              <label className="drop"><Upload size={22} /><span>Choose image (max {MAX_MB} MB)</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => pick(e.target.files[0])} /></label>
              {preview && <img className="qr" src={preview} alt="New QR preview" />}
              {err && <div className="note err">{err}</div>}
              <Msg msg={a.msg} />
              <Button disabled={!file} loading={a.busy} onClick={save}>Save QR</Button>
            </Card>
          </div>
        )}
      </Gate>
    </>
  );
}
