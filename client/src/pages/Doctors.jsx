import { useCallback, useEffect, useState } from 'react';
import { Stethoscope, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/format';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { Field, Input, Select } from '@/components/ui/Field';
import { TableWrap, Table, Th, Td, Tr, Pagination } from '@/components/ui/Table';

const emptyForm = {
  name: '', email: '', phone: '', specialty: '', qualification: '',
  experienceYears: '', consultationFee: '', department: '', isAvailable: true,
};

export default function Doctors() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState({ items: [], specialties: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/doctors', { params: { search, specialty, page, limit: 8 } });
      setData({ items: res.data, specialties: res.specialties, pagination: res.pagination });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load doctors'));
    } finally {
      setLoading(false);
    }
  }, [search, specialty, page]);

  useEffect(() => {
    const t = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(t);
  }, [fetchDoctors]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name || '', email: d.email || '', phone: d.phone || '',
      specialty: d.specialty || '', qualification: d.qualification || '',
      experienceYears: d.experienceYears ?? '', consultationFee: d.consultationFee ?? '',
      department: d.department || '', isAvailable: d.isAvailable ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        experienceYears: Number(form.experienceYears) || 0,
        consultationFee: Number(form.consultationFee) || 0,
      };
      if (editing) {
        await api.put(`/doctors/${editing._id}`, payload);
        toast.success('Doctor updated');
      } else {
        await api.post('/doctors', payload);
        toast.success('Doctor added');
      }
      setModalOpen(false);
      fetchDoctors();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/doctors/${deleting._id}`);
      toast.success('Doctor removed');
      setDeleting(null);
      fetchDoctors();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Doctors" subtitle="Manage specialists, departments and availability.">
        <Button onClick={openCreate}><Plus size={16} /> Add Doctor</Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border-0 bg-white py-2.5 pl-10 pr-4 text-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-500"
            placeholder="Search by name or specialty…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-lg border-0 bg-white py-2.5 pl-3.5 pr-8 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
          value={specialty}
          onChange={(e) => { setSpecialty(e.target.value); setPage(1); }}
        >
          <option value="">All specialties</option>
          {data.specialties.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400"><Spinner className="h-8 w-8" /></div>
      ) : data.items.length === 0 ? (
        <TableWrap><EmptyState icon={Stethoscope} title="No doctors found" subtitle="Add your first doctor to get started." /></TableWrap>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr><Th>Doctor</Th><Th>Specialty</Th><Th>Experience</Th><Th>Fee</Th><Th>Availability</Th><Th>Actions</Th></tr>
            </thead>
            <tbody>
              {data.items.map((d) => (
                <Tr key={d._id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-sm font-semibold text-violet-700">
                        {d.name.replace('Dr. ', '').slice(0, 1)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{d.name}</p>
                        <p className="text-xs text-slate-400">{d.qualification}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <p className="text-slate-700">{d.specialty}</p>
                    <p className="text-xs text-slate-400">{d.department}</p>
                  </Td>
                  <Td>{d.experienceYears} yrs</Td>
                  <Td className="font-medium text-slate-700">{formatCurrency(d.consultationFee)}</Td>
                  <Td>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${d.isAvailable ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${d.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {d.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(d)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-primary-600" title="Edit">
                        <Pencil size={16} />
                      </button>
                      {isAdmin && (
                        <button onClick={() => setDeleting(d)} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit doctor' : 'Add new doctor'} wide>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Doe" />
            </Field>
            <Field label="Specialty" required>
              <Input required value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="e.g. Cardiology" list="specialty-list" />
              <datalist id="specialty-list">
                {data.specialties.map((s) => <option key={s} value={s} />)}
              </datalist>
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Qualification">
              <Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="MBBS, MD…" />
            </Field>
            <Field label="Department">
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </Field>
            <Field label="Experience (years)">
              <Input type="number" min="0" max="60" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
            </Field>
            <Field label="Consultation fee (₹)">
              <Input type="number" min="0" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
            />
            Currently accepting appointments
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add doctor'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remove doctor?"
        message={`This will remove ${deleting?.name} from the doctors directory. Existing appointments will remain on record.`}
        loading={deleteLoading}
      />
    </div>
  );
}
