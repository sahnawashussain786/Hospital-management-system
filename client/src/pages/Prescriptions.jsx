import { useCallback, useEffect, useState } from 'react';
import { FileText, Plus, Search, Trash2, Plus as PlusIcon, Minus as MinusIcon, Printer } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { formatDate, calcAge } from '@/lib/format';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { TableWrap, Table, Th, Td, Tr, Pagination } from '@/components/ui/Table';

const emptyMedicine = { name: '', dosage: '', frequency: '', durationDays: 5, instructions: '' };
const emptyForm = { patient: '', doctor: '', diagnosis: '', medicines: [{ ...emptyMedicine }], notes: '' };

export default function Prescriptions() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const [data, setData] = useState({ items: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewing, setViewing] = useState(null);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/prescriptions', { params: { search, page, limit: 8 } });
      setData({ items: res.data, pagination: res.pagination });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load prescriptions'));
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(fetchPrescriptions, 300);
    return () => clearTimeout(t);
  }, [fetchPrescriptions]);

  useEffect(() => {
    api.get('/patients', { params: { limit: 100 } }).then(({ data: res }) => setPatients(res.data)).catch(() => {});
    api.get('/doctors', { params: { limit: 100 } }).then(({ data: res }) => setDoctors(res.data)).catch(() => {});
  }, []);

  const openCreate = () => { setForm(emptyForm); setModalOpen(true); };

  const setMedicine = (i, key, value) => {
    setForm((f) => {
      const medicines = [...f.medicines];
      medicines[i] = { ...medicines[i], [key]: value };
      return { ...f, medicines };
    });
  };

  const addMedicine = () => setForm((f) => ({ ...f, medicines: [...f.medicines, { ...emptyMedicine }] }));
  const removeMedicine = (i) =>
    setForm((f) => ({ ...f, medicines: f.medicines.filter((_, idx) => idx !== i) }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/prescriptions', form);
      toast.success('Prescription created');
      setModalOpen(false);
      fetchPrescriptions();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/prescriptions/${deleting._id}`);
      toast.success('Prescription deleted');
      setDeleting(null);
      fetchPrescriptions();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const openView = async (r) => {
    try {
      const { data: res } = await api.get(`/prescriptions/${r._id}`);
      setViewing(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load prescription'));
    }
  };

  return (
    <div>
      <PageHeader title="Prescriptions" subtitle="Create and review clinical prescriptions.">
        {(role === 'admin' || role === 'doctor') && (
          <Button onClick={openCreate}><Plus size={16} /> New Prescription</Button>
        )}
      </PageHeader>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border-0 bg-white py-2.5 pl-10 pr-4 text-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-500"
            placeholder="Search patient, doctor, diagnosis or medicine…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400"><Spinner className="h-8 w-8" /></div>
      ) : data.items.length === 0 ? (
        <TableWrap><EmptyState icon={FileText} title="No prescriptions found" subtitle="Create a prescription to get started." /></TableWrap>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr><Th>Date</Th><Th>Patient</Th><Th>Doctor</Th><Th>Diagnosis</Th><Th>Medicines</Th><Th>Actions</Th></tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <Tr key={r._id}>
                  <Td className="whitespace-nowrap text-slate-500">{formatDate(r.createdAt)}</Td>
                  <Td className="font-medium text-slate-800">{r.patient?.name}</Td>
                  <Td>
                    <p className="text-slate-700">{r.doctor?.name}</p>
                    <p className="text-xs text-slate-400">{r.doctor?.specialty}</p>
                  </Td>
                  <Td className="max-w-[220px] truncate">{r.diagnosis || '—'}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {r.medicines?.slice(0, 3).map((m, i) => (
                        <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {m.name}
                        </span>
                      ))}
                      {r.medicines?.length > 3 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          +{r.medicines.length - 3} more
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openView(r)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-primary-600" title="View / print">
                        <Printer size={16} />
                      </button>
                      {(role === 'admin' || role === 'doctor') && (
                        <button onClick={() => setDeleting(r)} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} onPage={setPage} />
        </TableWrap>
      )}

      {/* Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New prescription" wide>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Patient" required>
              <Select required value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}>
                <option value="">Select patient…</option>
                {patients.map((p) => <option key={p._id} value={p._id}>{p.name} — {p.phone}</option>)}
              </Select>
            </Field>
            <Field label="Doctor" required>
              <Select required value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })}>
                <option value="">Select doctor…</option>
                {doctors.map((d) => <option key={d._id} value={d._id}>{d.name} — {d.specialty}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Diagnosis">
            <Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="e.g. Acute bronchitis" />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Medicines <span className="text-rose-500">*</span></p>
              <button type="button" onClick={addMedicine}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
                <PlusIcon size={14} /> Add medicine
              </button>
            </div>
            <div className="space-y-3">
              {form.medicines.map((m, i) => (
                <div key={i} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Input placeholder="Medicine name" required value={m.name} onChange={(e) => setMedicine(i, 'name', e.target.value)} />
                    <Input placeholder="Dosage (500mg)" value={m.dosage} onChange={(e) => setMedicine(i, 'dosage', e.target.value)} />
                    <Input placeholder="Frequency" value={m.frequency} onChange={(e) => setMedicine(i, 'frequency', e.target.value)} />
                    <div className="flex items-center gap-2">
                      <Input type="number" min="1" value={m.durationDays} onChange={(e) => setMedicine(i, 'durationDays', e.target.value)} placeholder="Days" />
                      {form.medicines.length > 1 && (
                        <button type="button" onClick={() => removeMedicine(i)}
                          className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remove">
                          <MinusIcon size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <Input className="mt-3" placeholder="Instructions (after meals…)" value={m.instructions} onChange={(e) => setMedicine(i, 'instructions', e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional advice, follow-up date…" />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create prescription</Button>
          </div>
        </form>
      </Modal>

      {/* Printable view */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Prescription" wide>
        {viewing && (
          <div id="prescription-print">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-lg font-bold text-slate-900">MediBook Hospital</p>
                <p className="text-xs text-slate-400">Prescription record</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>{formatDate(viewing.createdAt)}</p>
                <p>Dr. {viewing.doctor?.name}</p>
                <p>{viewing.doctor?.specialty}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Patient</p>
                <p className="font-medium text-slate-800">{viewing.patient?.name}</p>
                <p className="text-slate-500">{viewing.patient?.gender} · {calcAge(viewing.patient?.dateOfBirth)} · {viewing.patient?.bloodGroup}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Diagnosis</p>
                <p className="font-medium text-slate-800">{viewing.diagnosis || '—'}</p>
              </div>
            </div>

            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2">Medicine</th><th className="py-2">Dosage</th><th className="py-2">Frequency</th><th className="py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {viewing.medicines?.map((m, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2.5 font-medium text-slate-800">{m.name}</td>
                    <td className="py-2.5">{m.dosage || '—'}</td>
                    <td className="py-2.5">{m.frequency || '—'}</td>
                    <td className="py-2.5">{m.durationDays ? `${m.durationDays} days` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {viewing.notes && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-200">
                <p className="text-xs font-semibold text-slate-400">Notes</p>
                {viewing.notes}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button onClick={() => window.print()}><Printer size={16} /> Print</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete prescription?"
        message="This prescription record will be permanently removed."
        loading={deleteLoading}
      />
    </div>
  );
}
