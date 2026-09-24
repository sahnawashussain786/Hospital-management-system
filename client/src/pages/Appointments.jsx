import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Plus, Search, Pencil, Trash2, CheckCircle2, XCircle, UserX } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatTime, todayISO } from '@/lib/format';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { TableWrap, Table, Th, Td, Tr, Pagination } from '@/components/ui/Table';

const emptyForm = { patient: '', doctor: '', date: todayISO(), time: '09:00', reason: '', notes: '' };

export default function Appointments() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const [data, setData] = useState({ items: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/appointments', { params: { search, status, date, page, limit: 8 } });
      setData({ items: res.data, pagination: res.pagination });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load appointments'));
    } finally {
      setLoading(false);
    }
  }, [search, status, date, page]);

  useEffect(() => {
    const t = setTimeout(fetchAppointments, 300);
    return () => clearTimeout(t);
  }, [fetchAppointments]);

  useEffect(() => {
    // Load lightweight lists for the booking form
    api.get('/patients', { params: { limit: 100 } }).then(({ data: res }) => setPatients(res.data)).catch(() => {});
    api.get('/doctors', { params: { limit: 100 } }).then(({ data: res }) => setDoctors(res.data)).catch(() => {});
  }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      patient: a.patient?._id || '',
      doctor: a.doctor?._id || '',
      date: a.date ? a.date.slice(0, 10) : todayISO(),
      time: a.time || '09:00',
      reason: a.reason || '',
      notes: a.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, date: new Date(form.date).toISOString() };
      if (editing) {
        await api.put(`/appointments/${editing._id}`, payload);
        toast.success('Appointment updated');
      } else {
        await api.post('/appointments', payload);
        toast.success('Appointment booked');
      }
      setModalOpen(false);
      fetchAppointments();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const setStatusFor = async (a, newStatus) => {
    try {
      await api.put(`/appointments/${a._id}`, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
      fetchAppointments();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Update failed'));
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/appointments/${deleting._id}`);
      toast.success('Appointment cancelled and removed');
      setDeleting(null);
      fetchAppointments();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Appointments" subtitle="Book, reschedule and track patient visits.">
        <Button onClick={openCreate}><Plus size={16} /> Book Appointment</Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border-0 bg-white py-2.5 pl-10 pr-4 text-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-500"
            placeholder="Search by patient or doctor name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border-0 bg-white py-2.5 pl-3.5 pr-8 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary-500">
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no-show">No-show</option>
        </select>
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }}
          className="rounded-lg border-0 bg-white py-2.5 pl-3.5 pr-4 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary-500" />
        {(search || status || date) && (
          <button onClick={() => { setSearch(''); setStatus(''); setDate(''); }}
            className="text-sm font-medium text-primary-600 hover:text-primary-700">Clear</button>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400"><Spinner className="h-8 w-8" /></div>
      ) : data.items.length === 0 ? (
        <TableWrap><EmptyState icon={CalendarDays} title="No appointments found" subtitle="Book a new appointment or adjust the filters." /></TableWrap>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr><Th>Patient</Th><Th>Doctor</Th><Th>Date & Time</Th><Th>Reason</Th><Th>Status</Th><Th>Actions</Th></tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <Tr key={a._id}>
                  <Td>
                    <p className="font-medium text-slate-800">{a.patient?.name}</p>
                    <p className="text-xs text-slate-400">{a.patient?.phone}</p>
                  </Td>
                  <Td>
                    <p className="text-slate-700">{a.doctor?.name}</p>
                    <p className="text-xs text-slate-400">{a.doctor?.specialty}</p>
                  </Td>
                  <Td>
                    <p className="text-slate-700">{formatDate(a.date, { weekday: 'short' })}</p>
                    <p className="text-xs text-slate-400">{formatTime(a.time)}</p>
                  </Td>
                  <Td className="max-w-[200px] truncate text-slate-500">{a.reason || '—'}</Td>
                  <Td><Badge tone={a.status}>{a.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      {a.status === 'scheduled' && (
                        <>
                          <button onClick={() => setStatusFor(a, 'completed')} className="rounded-md p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600" title="Mark completed">
                            <CheckCircle2 size={16} />
                          </button>
                          <button onClick={() => setStatusFor(a, 'cancelled')} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Cancel">
                            <XCircle size={16} />
                          </button>
                          <button onClick={() => setStatusFor(a, 'no-show')} className="rounded-md p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600" title="Mark no-show">
                            <UserX size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => openEdit(a)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-primary-600" title="Edit">
                        <Pencil size={16} />
                      </button>
                      {(role === 'admin' || role === 'receptionist') && (
                        <button onClick={() => setDeleting(a)} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit appointment' : 'Book appointment'} wide>
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
                {doctors.map((d) => (
                  <option key={d._id} value={d._id} disabled={!d.isAvailable}>
                    {d.name} — {d.specialty}{d.isAvailable ? '' : ' (unavailable)'}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date" required>
              <Input type="date" required min={editing ? undefined : todayISO()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Time" required>
              <Input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </Field>
          </div>
          <Field label="Reason for visit">
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Chest pain, follow-up…" />
          </Field>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes (optional)" />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Book appointment'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete appointment?"
        message={`Remove the appointment for ${deleting?.patient?.name} with ${deleting?.doctor?.name}? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}
