import { useCallback, useEffect, useState } from 'react';
import { Receipt, Plus, Search, Trash2, Printer, BadgeCheck, CircleDollarSign } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatCurrency } from '@/lib/format';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { Field, Input, Select } from '@/components/ui/Field';
import { TableWrap, Table, Th, Td, Tr, Pagination } from '@/components/ui/Table';

const emptyItem = { description: '', amount: '' };

export default function Billing() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const canManage = role === 'admin' || role === 'receptionist';

  const [data, setData] = useState({ items: [], revenue: { paid: 0, pending: 0 }, pagination: { page: 1, pages: 1, total: 0 } });
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ patient: '', items: [{ ...emptyItem }], discount: 0, taxPercent: 0, paymentMethod: 'cash' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewing, setViewing] = useState(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/bills', { params: { search, status, page, limit: 8 } });
      setData({ items: res.data, revenue: res.revenue, pagination: res.pagination });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load bills'));
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    const t = setTimeout(fetchBills, 300);
    return () => clearTimeout(t);
  }, [fetchBills]);

  useEffect(() => {
    api.get('/patients', { params: { limit: 100 } }).then(({ data: res }) => setPatients(res.data)).catch(() => {});
  }, []);

  const openCreate = () =>
    setForm({ patient: '', items: [{ ...emptyItem }], discount: 0, taxPercent: 0, paymentMethod: 'cash' }) || setModalOpen(true);

  const setItem = (i, key, value) => {
    setForm((f) => {
      const items = [...f.items];
      items[i] = { ...items[i], [key]: value };
      return { ...f, items };
    });
  };

  const subtotal = form.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const afterDiscount = subtotal - (Number(form.discount) || 0);
  const taxAmount = afterDiscount * ((Number(form.taxPercent) || 0) / 100);
  const grandTotal = afterDiscount + taxAmount;

  const handleSave = async (e) => {
    e.preventDefault();
    if (grandTotal <= 0) return toast.error('Total must be greater than zero');
    setSaving(true);
    try {
      await api.post('/bills', {
        ...form,
        items: form.items.map((i) => ({ description: i.description, amount: Number(i.amount) || 0 })),
      });
      toast.success('Bill created');
      setModalOpen(false);
      fetchBills();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (b) => {
    try {
      await api.patch(`/bills/${b._id}/pay`, { paymentMethod: b.paymentMethod });
      toast.success('Bill marked as paid');
      fetchBills();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Update failed'));
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/bills/${deleting._id}`);
      toast.success('Bill deleted');
      setDeleting(null);
      fetchBills();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const openView = async (b) => {
    try {
      const { data: res } = await api.get(`/bills/${b._id}`);
      setViewing(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load invoice'));
    }
  };

  return (
    <div>
      <PageHeader title="Billing" subtitle="Invoices, payments and revenue at a glance.">
        {canManage && (
          <Button onClick={() => { setForm({ patient: '', items: [{ ...emptyItem }], discount: 0, taxPercent: 0, paymentMethod: 'cash' }); setModalOpen(true); }}>
            <Plus size={16} /> New Bill
          </Button>
        )}
      </PageHeader>

      {/* Revenue cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Revenue collected</p>
            <BadgeCheck className="text-emerald-500" size={20} />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(data.revenue?.paid)}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Pending payments</p>
            <CircleDollarSign className="text-amber-500" size={20} />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(data.revenue?.pending)}</p>
        </div>
    </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border-0 bg-white py-2.5 pl-10 pr-4 text-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-500"
            placeholder="Search by patient or item description…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border-0 bg-white py-2.5 pl-3.5 pr-8 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary-500">
          <option value="">All bills</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400"><Spinner className="h-8 w-8" /></div>
      ) : data.items.length === 0 ? (
        <TableWrap><EmptyState icon={Receipt} title="No bills found" subtitle="Create a bill to get started." /></TableWrap>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr><Th>Invoice</Th><Th>Patient</Th><Th>Items</Th><Th>Total</Th><Th>Status</Th><Th>Date</Th><Th>Actions</Th></tr>
            </thead>
            <tbody>
              {data.items.map((b) => (
                <Tr key={b._id}>
                  <Td className="font-mono text-xs text-slate-500">#{b._id.slice(-6).toUpperCase()}</Td>
                  <Td className="font-medium text-slate-800">{b.patient?.name}</Td>
                  <Td className="max-w-[240px] truncate text-slate-500">{b.items?.map((i) => i.description).join(', ')}</Td>
                  <Td className="font-semibold text-slate-800">{formatCurrency(b.total)}</Td>
                  <Td><Badge tone={b.status}>{b.status}</Badge></Td>
                  <Td className="whitespace-nowrap text-slate-500">{formatDate(b.createdAt)}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openView(b)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-primary-600" title="View invoice">
                        <Printer size={16} />
                      </button>
                      {canManage && b.status === 'pending' && (
                        <button onClick={() => markPaid(b)} className="rounded-md p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600" title="Mark as paid">
                          <BadgeCheck size={16} />
                        </button>
                      )}
                      {canManage && (
                        <button onClick={() => setDeleting(b)} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
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

      {/* Create bill modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create bill" wide>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Patient" required>
            <Select required value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}>
              <option value="">Select patient…</option>
              {patients.map((p) => <option key={p._id} value={p._id}>{p.name} — {p.phone}</option>)}
            </Select>
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Line items <span className="text-rose-500">*</span></p>
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, items: [...f.items, { ...emptyItem }] }))}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
                <Plus size={14} /> Add item
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Description (consultation, X-ray…)" required value={item.description}
                    onChange={(e) => setItem(i, 'description', e.target.value)} />
                  <Input type="number" min="0" step="0.01" placeholder="Amount ₹" required value={item.amount}
                    onChange={(e) => setItem(i, 'amount', e.target.value)} className="max-w-[140px]" />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}
                      className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remove item">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Discount (₹)">
              <Input type="number" min="0" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
            </Field>
            <Field label="Tax (%)">
              <Input type="number" min="0" max="100" value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: e.target.value })} />
            </Field>
            <Field label="Payment method">
              <Select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="insurance">Insurance</option>
                <option value="bank-transfer">Bank transfer</option>
              </Select>
            </Field>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm">
            <div className="flex justify-between py-0.5 text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between py-0.5 text-slate-600"><span>Discount</span><span>− {formatCurrency(form.discount || 0)}</span></div>
            <div className="flex justify-between py-0.5 text-slate-600"><span>Tax</span><span>{formatCurrency(taxAmount)}</span></div>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <span>Total</span><span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create bill</Button>
          </div>
        </form>
      </Modal>

      {/* Invoice view */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Invoice" wide>
        {viewing && (
          <div>
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-lg font-bold text-slate-900">MediBook Hospital</p>
                <p className="text-xs text-slate-400">Invoice #{viewing._id.slice(-6).toUpperCase()}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>{formatDate(viewing.createdAt)}</p>
                <p className="capitalize">{viewing.status}</p>
              </div>
            </div>
            <div className="mt-4 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Billed to</p>
              <p className="font-medium text-slate-800">{viewing.patient?.name}</p>
              <p className="text-slate-500">{viewing.patient?.phone}</p>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2">Description</th><th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {viewing.items?.map((i, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-2.5 text-slate-700">{i.description}</td>
                    <td className="py-2.5 text-right font-medium text-slate-800">{formatCurrency(i.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 ml-auto max-w-xs text-sm">
              <div className="flex justify-between py-0.5 text-slate-600"><span>Subtotal</span><span>{formatCurrency(viewing.subtotal)}</span></div>
              <div className="flex justify-between py-0.5 text-slate-600"><span>Discount</span><span>− {formatCurrency(viewing.discount)}</span></div>
              <div className="flex justify-between py-0.5 text-slate-600"><span>Tax</span><span>{formatCurrency(viewing.taxAmount)}</span></div>
              <div className="mt-1 flex justify-between border-t border-slate-300 pt-2 text-base font-bold text-slate-900">
                <span>Total</span><span>{formatCurrency(viewing.total)}</span>
              </div>
            </div>
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
        title="Delete bill?"
        message="This invoice will be permanently removed."
        loading={deleteLoading}
      />
    </div>
  );
}
