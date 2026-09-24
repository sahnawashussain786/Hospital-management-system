import { useCallback, useEffect, useState } from 'react';
import { Users, Plus, Search, Pencil, Trash2, Eye, Phone, Mail } from 'lucide-react';
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
import Badge from '@/components/ui/Badge';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { TableWrap, Table, Th, Td, Tr, Pagination } from '@/components/ui/Table';

const emptyForm = {
  name: '', phone: '', email: '', gender: 'Male', dateOfBirth: '',
  bloodGroup: 'Unknown', address: '', medicalHistory: '', allergies: '',
  status: 'outpatient', roomNumber: '',
};

export default function Patients() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState({ items: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/patients', { params: { search, status, page, limit: 8 } });
      setData({ items: res.data, pagination: res.pagination });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load patients'));
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    const t = setTimeout(fetchPatients, 300); // debounce search
    return () => clearTimeout(t);
  }, [fetchPatients]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || '', phone: p.phone || '', email: p.email || '',
      gender: p.gender || 'Male', dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
      bloodGroup: p.bloodGroup || 'Unknown', address: p.address || '',
      medicalHistory: p.medicalHistory || '', allergies: p.allergies || '',
      status: p.status || 'outpatient', roomNumber: p.roomNumber || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/patients/${editing._id}`, form);
        toast.success('Patient updated');
      } else {
        await api.post('/patients', form);
        toast.success('Patient registered');
      }
      setModalOpen(false);
      fetchPatients();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/patients/${deleting._id}`);
      toast.success('Patient deleted');
      setDeleting(null);
      fetchPatients();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const openProfile = async (p) => {
    setProfileLoading(true);
    setProfile({ patient: p, appointments: [], prescriptions: [], bills: [] });
    try {
      const { data: res } = await api.get(`/patients/${p._id}`);
      setProfile(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load profile'));
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Patients" subtitle="Register, search and manage patient records.">
        <Button onClick={openCreate}>
          <Plus size={16} /> Register Patient
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border-0 bg-white py-2.5 pl-10 pr-4 text-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-500"
            placeholder="Search by name, phone or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-lg border-0 bg-white py-2.5 pl-3.5 pr-8 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="outpatient">Outpatient</option>
          <option value="admitted">Admitted</option>
          <option value="discharged">Discharged</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400"><Spinner className="h-8 w-8" /></div>
      ) : data.items.length === 0 ? (
        <TableWrap>
          <EmptyState icon={Users} title="No patients found" subtitle="Try adjusting your search, or register a new patient." />
        </TableWrap>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th><Th>Contact</Th><Th>Age / Gender</Th><Th>Blood</Th><Th>Status</Th><Th>Registered</Th><Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <Tr key={p._id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                        {p.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{p.name}</p>
                        {p.roomNumber && <p className="text-xs text-slate-400">Room {p.roomNumber}</p>}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <p className="text-slate-700">{p.phone}</p>
                    {p.email && <p className="text-xs text-slate-400">{p.email}</p>}
                  </Td>
                  <Td>{calcAge(p.dateOfBirth)} · {p.gender}</Td>
                  <Td><span className="font-medium text-slate-700">{p.bloodGroup}</span></Td>
                  <Td><Badge tone={p.status}>{p.status}</Badge></Td>
                  <Td className="text-slate-500">{formatDate(p.createdAt)}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openProfile(p)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-primary-600" title="View profile">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openEdit(p)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-primary-600" title="Edit">
                        <Pencil size={16} />
                      </button>
                      {isAdmin && (
                        <button onClick={() => setDeleting(p)} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <Pagination
            page={data.pagination.page}
            pages={data.pagination.pages}
            total={data.pagination.total}
            onPage={setPage}
          />
        </TableWrap>
      )}

      {/* Create / edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit patient' : 'Register new patient'} wide>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Priya Patel" />
            </Field>
            <Field label="Phone" required>
              <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98765 43210" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="optional" />
            </Field>
            <Field label="Date of birth">
              <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option>Male</option><option>Female</option><option>Other</option>
              </Select>
            </Field>
            <Field label="Blood group">
              <Select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((b) => <option key={b}>{b}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="outpatient">Outpatient</option>
                <option value="admitted">Admitted</option>
                <option value="discharged">Discharged</option>
              </Select>
            </Field>
            <Field label="Room number (if admitted)">
              <Input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} placeholder="e.g. 204" />
            </Field>
          </div>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Medical history">
              <Textarea value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} placeholder="Chronic conditions, past surgeries…" />
            </Field>
            <Field label="Allergies">
              <Textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="Drug / food allergies…" />
            </Field>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Register patient'}</Button>
          </div>
        </form>
      </Modal>

      {/* Profile drawer/modal */}
      <Modal open={!!profile} onClose={() => setProfile(null)} title="Patient profile" wide>
        {profile && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white">
                {profile.patient.name.slice(0, 1)}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-slate-900">{profile.patient.name}</p>
                <p className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1"><Phone size={12} /> {profile.patient.phone}</span>
                  {profile.patient.email && <span className="inline-flex items-center gap-1"><Mail size={12} /> {profile.patient.email}</span>}
                </p>
              </div>
              <Badge tone={profile.patient.status}>{profile.patient.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {[
                ['Age / Gender', `${calcAge(profile.patient.dateOfBirth)} · ${profile.patient.gender}`],
                ['Blood group', profile.patient.bloodGroup],
                ['Date of birth', formatDate(profile.patient.dateOfBirth)],
                ['Room', profile.patient.roomNumber || '—'],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-400">{l}</p>
                  <p className="mt-0.5 font-medium text-slate-800">{v}</p>
                </div>
              ))}
            </div>

            {(profile.patient.medicalHistory || profile.patient.allergies) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {profile.patient.medicalHistory && (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm ring-1 ring-amber-200">
                    <p className="text-xs font-semibold text-amber-700">Medical history</p>
                    <p className="mt-1 text-amber-900">{profile.patient.medicalHistory}</p>
                  </div>
                )}
                {profile.patient.allergies && (
                  <div className="rounded-lg bg-rose-50 p-3 text-sm ring-1 ring-rose-200">
                    <p className="text-xs font-semibold text-rose-700">Allergies</p>
                    <p className="mt-1 text-rose-900">{profile.patient.allergies}</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Recent appointments</h3>
              {profile.appointments.length ? (
                <div className="divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
                  {profile.appointments.slice(0, 5).map((a) => (
                    <div key={a._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-slate-700">{a.doctor?.name} · {a.doctor?.specialty}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-slate-500">{formatDate(a.date)}</span>
                        <Badge tone={a.status}>{a.status}</Badge>
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400">No appointments recorded.</p>}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Prescriptions</h3>
              {profile.prescriptions.length ? (
                <div className="space-y-2">
                  {profile.prescriptions.slice(0, 5).map((r) => (
                    <div key={r._id} className="rounded-lg p-3 ring-1 ring-slate-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800">{r.diagnosis || 'General consultation'}</p>
                        <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {r.doctor?.name} — {r.medicines?.map((m) => m.name).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400">No prescriptions recorded.</p>}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Bills</h3>
              {profile.bills.length ? (
                <div className="divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
                  {profile.bills.slice(0, 5).map((b) => (
                    <div key={b._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-slate-600">{formatDate(b.createdAt)} · {b.items?.length} items</span>
                      <span className="flex items-center gap-3">
                        <span className="font-medium text-slate-800">₹{b.total?.toLocaleString('en-IN')}</span>
                        <Badge tone={b.status}>{b.status}</Badge>
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400">No bills recorded.</p>}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete patient?"
        message={`This will permanently remove ${deleting?.name}'s record. Related appointments, prescriptions and bills are kept for audit purposes.`}
        loading={deleteLoading}
      />
    </div>
  );
}
