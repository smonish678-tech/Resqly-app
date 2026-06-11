import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, FlaskConical, Trash2, Calendar, FileText, X, Upload, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ConsumerLabTests() {
  const [tab, setTab] = useState('upcoming');
  const [tests, setTests] = useState([]);
  const [reports, setReports] = useState([]);
  const [open, setOpen] = useState(false); // test sheet
  const [reportOpen, setReportOpen] = useState(false);
  const [form, setForm] = useState({ test_name: '', status: 'upcoming', scheduled_date: '', lab_name: '', notes: '' });
  const [reportForm, setReportForm] = useState({ title: '', test_name: '', lab_name: '', date: '', file_url: '' });
  const [viewing, setViewing] = useState(null);
  const fileRef = useRef(null);

  const load = async () => {
    const [t, r] = await Promise.all([
      api.get('/users/me/lab-tests'),
      api.get('/users/me/lab-reports'),
    ]);
    setTests(t.data.tests);
    setReports(r.data.reports);
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const saveTest = async () => {
    if (!form.test_name) { toast.error('Test name required'); return; }
    try {
      await api.post('/users/me/lab-tests', form);
      toast.success('Test added');
      setOpen(false);
      setForm({ test_name: '', status: tab === 'past' ? 'past' : 'upcoming', scheduled_date: '', lab_name: '', notes: '' });
      await load();
    } catch (e) { toast.error('Could not save'); }
  };
  const removeTest = async (id) => {
    if (!window.confirm('Delete this test?')) return;
    try { await api.delete(`/users/me/lab-tests/${id}`); await load(); toast.success('Deleted'); }
    catch (e) { toast.error('Could not delete'); }
  };

  const onReportFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error('Max 4MB'); return; }
    const r = new FileReader();
    r.onload = () => setReportForm((f) => ({ ...f, file_url: r.result }));
    r.readAsDataURL(file);
  };
  const saveReport = async () => {
    if (!reportForm.title) { toast.error('Title required'); return; }
    try {
      await api.post('/users/me/lab-reports', reportForm);
      toast.success('Report uploaded');
      setReportOpen(false);
      setReportForm({ title: '', test_name: '', lab_name: '', date: '', file_url: '' });
      await load();
    } catch (e) { toast.error('Could not upload'); }
  };
  const removeReport = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try { await api.delete(`/users/me/lab-reports/${id}`); await load(); toast.success('Deleted'); }
    catch (e) { toast.error('Could not delete'); }
  };

  const upcoming = tests.filter((t) => t.status === 'upcoming');
  const past = tests.filter((t) => t.status === 'past');

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        <MobileShell title="Lab Tests & Reports" header>
          <div className="px-5 py-5 pb-32">
            <div className="flex gap-2 mb-4">
              {[
                { k: 'upcoming', l: 'Upcoming' },
                { k: 'past', l: 'Past' },
                { k: 'reports', l: 'Reports' },
              ].map(({ k, l }) => (
                <button data-testid={`lab-tab-${k}`} key={k} onClick={() => setTab(k)} className={`flex-1 py-2 rounded-full text-sm font-semibold ${tab === k ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{l}</button>
              ))}
            </div>

            {tab === 'upcoming' && (
              <Section
                icon={<Calendar className="w-5 h-5 text-blue-700" />}
                title="Upcoming Tests"
                empty="No upcoming tests scheduled."
                items={upcoming}
                onAdd={() => { setForm({ ...form, status: 'upcoming' }); setOpen(true); }}
                onRemove={removeTest}
                addTestId="lab-add-upcoming"
                renderItem={(t) => (
                  <>
                    <div className="font-semibold text-slate-900">{t.test_name}</div>
                    <div className="text-xs text-slate-500">{t.scheduled_date || 'Date TBD'}{t.lab_name ? ` • ${t.lab_name}` : ''}</div>
                    {t.notes && <div className="text-xs text-slate-600 mt-1">{t.notes}</div>}
                  </>
                )}
              />
            )}

            {tab === 'past' && (
              <Section
                icon={<FlaskConical className="w-5 h-5 text-blue-700" />}
                title="Past Tests"
                empty="No past tests recorded."
                items={past}
                onAdd={() => { setForm({ ...form, status: 'past' }); setOpen(true); }}
                onRemove={removeTest}
                addTestId="lab-add-past"
                renderItem={(t) => (
                  <>
                    <div className="font-semibold text-slate-900">{t.test_name}</div>
                    <div className="text-xs text-slate-500">{t.scheduled_date || ''}{t.lab_name ? ` • ${t.lab_name}` : ''}</div>
                  </>
                )}
              />
            )}

            {tab === 'reports' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 inline-flex items-center gap-2"><FileText className="w-5 h-5 text-blue-700" /> Reports</h3>
                  <button data-testid="lab-add-report" onClick={() => setReportOpen(true)} className="text-blue-700 text-sm font-semibold inline-flex items-center gap-1"><Upload className="w-4 h-4" /> Upload</button>
                </div>
                {reports.length === 0 ? (
                  <EmptyBlock text="No reports uploaded yet." />
                ) : (
                  <div className="space-y-3">
                    {reports.map((r) => (
                      <div key={r.id} className="resqly-card p-4 flex items-start gap-3">
                        <button onClick={() => r.file_url && setViewing(r.file_url)} className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {r.file_url && r.file_url.startsWith('data:image') ? (
                            <img src={r.file_url} alt="report" className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-6 h-6 text-slate-400" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{r.title}</div>
                          <div className="text-xs text-slate-500">{r.test_name || ''}{r.lab_name ? ` • ${r.lab_name}` : ''}{r.date ? ` • ${r.date}` : ''}</div>
                        </div>
                        <button data-testid={`lab-remove-report-${r.id}`} onClick={() => removeReport(r.id)} className="p-2 text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </MobileShell>

        {/* Test sheet */}
        {open && (
          <div className="fixed inset-0 z-40 bg-black/40 flex items-end justify-center" onClick={() => setOpen(false)}>
            <div className="bg-white rounded-t-3xl w-full max-w-[480px] p-5 max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900">{form.status === 'past' ? 'Add Past Test' : 'Schedule Test'}</h3>
                <button onClick={() => setOpen(false)} className="text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <Field label="Test Name *"><Input data-testid="lab-form-name" value={form.test_name} onChange={(e) => setForm({ ...form, test_name: e.target.value })} placeholder="e.g. Complete Blood Count" /></Field>
                <Field label="Date"><Input data-testid="lab-form-date" type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} /></Field>
                <Field label="Lab Name"><Input data-testid="lab-form-lab" value={form.lab_name} onChange={(e) => setForm({ ...form, lab_name: e.target.value })} placeholder="e.g. Apollo Diagnostics" /></Field>
                <Field label="Notes"><Textarea data-testid="lab-form-notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
              </div>
              <Button data-testid="lab-form-save" onClick={saveTest} className="w-full mt-4 bg-blue-700 hover:bg-blue-800">Save</Button>
            </div>
          </div>
        )}

        {/* Report sheet */}
        {reportOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 flex items-end justify-center" onClick={() => setReportOpen(false)}>
            <div className="bg-white rounded-t-3xl w-full max-w-[480px] p-5 max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900">Upload Report</h3>
                <button onClick={() => setReportOpen(false)} className="text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <Field label="Title *"><Input data-testid="lab-report-title" value={reportForm.title} onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })} /></Field>
                <Field label="Test Name"><Input data-testid="lab-report-testname" value={reportForm.test_name} onChange={(e) => setReportForm({ ...reportForm, test_name: e.target.value })} /></Field>
                <Field label="Lab Name"><Input data-testid="lab-report-lab" value={reportForm.lab_name} onChange={(e) => setReportForm({ ...reportForm, lab_name: e.target.value })} /></Field>
                <Field label="Date"><Input data-testid="lab-report-date" type="date" value={reportForm.date} onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })} /></Field>
                <Field label="File">
                  <button data-testid="lab-report-upload" onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center text-slate-500 hover:bg-slate-50">
                    {reportForm.file_url ? (
                      reportForm.file_url.startsWith('data:image') ? (
                        <img src={reportForm.file_url} alt="preview" className="max-h-40 rounded" />
                      ) : (<><FileText className="w-6 h-6" /><span className="text-xs mt-1">File attached</span></>)
                    ) : (<><ImageIcon className="w-6 h-6 mb-1" /><span className="text-xs">Tap to select file</span></>)}
                    <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onReportFile} className="hidden" />
                  </button>
                </Field>
              </div>
              <Button data-testid="lab-report-save" onClick={saveReport} className="w-full mt-4 bg-blue-700 hover:bg-blue-800">Upload Report</Button>
            </div>
          </div>
        )}

        {viewing && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
            <img src={viewing} alt="report" className="max-h-[90vh] max-w-full rounded-lg" />
          </div>
        )}
        <BottomNav variant="consumer" />
      </div>
    </div>
  );
}

function Section({ icon, title, empty, items, onAdd, onRemove, renderItem, addTestId }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-900 inline-flex items-center gap-2">{icon} {title}</h3>
        <button data-testid={addTestId} onClick={onAdd} className="text-blue-700 text-sm font-semibold inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
      </div>
      {items.length === 0 ? (
        <EmptyBlock text={empty} />
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <div key={t.id} className="resqly-card p-4 flex items-start gap-3">
              <div className="flex-1">{renderItem(t)}</div>
              <button onClick={() => onRemove(t.id)} className="p-2 text-rose-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyBlock({ text }) {
  return (
    <div className="resqly-card p-8 text-center">
      <FlaskConical className="w-8 h-8 text-slate-300 mx-auto" />
      <p className="text-sm text-slate-500 mt-2">{text}</p>
    </div>
  );
}

function Field({ label, children }) { return <div><label className="text-xs font-medium text-slate-500">{label}</label><div className="mt-1">{children}</div></div>; }
