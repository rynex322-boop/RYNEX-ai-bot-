import { useEffect, useState } from 'react';
import { api } from '../api/services.js';
import { useLoad, useAction } from '../hooks.js';
import { Card, Button, PageHead, Gate, Msg, Field } from '../components/UI.jsx';

const FIELDS = [
  ['displayName', 'Bot display name', false],
  ['welcomeMessage', 'Welcome message', true],
  ['paymentMessage', 'Payment instructions', true],
  ['approvedMessage', 'Order approved message', true],
  ['rejectedMessage', 'Order rejected message', true],
  ['supportMessage', 'Support message', true],
];

export default function BotSettings() {
  const st = useLoad(api.getBot);
  const [d, setD] = useState({});
  const a = useAction();
  useEffect(() => { if (st.data) setD(st.data); }, [st.data]);
  return (
    <>
      <PageHead title="Bot settings" sub="Texts your Telegram bot sends. The bot token stays on your backend." />
      <Gate st={st} keepOnPending what="bot settings">
        {() => (
          <Card>
            {FIELDS.map(([k, label, multi]) => (
              <Field key={k} label={label}>
                {multi ? <textarea rows={4} value={d[k] || ''} onChange={(e) => setD({ ...d, [k]: e.target.value })} />
                  : <input value={d[k] || ''} onChange={(e) => setD({ ...d, [k]: e.target.value })} />}
              </Field>
            ))}
            <Msg msg={a.msg} />
            <Button loading={a.busy} onClick={() => a.run(() => api.saveBot(d), 'Bot settings saved')}>Save settings</Button>
          </Card>
        )}
      </Gate>
    </>
  );
}
