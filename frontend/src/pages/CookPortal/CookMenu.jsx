import React, { useState, useEffect, useCallback, useContext } from 'react'
import './CookMenu.css'
import { getCookMenu, postMenuItem, patchMenuItem, deleteMenuItem } from '../../api/cook-portal.js'
import { uploadImage } from '../../api/uploads.js'
import { imageUrl } from '../../api/client.js'
import { StoreContext } from '../../context/StoreContext'

const CATEGORIES = ['Gujarati', 'Punjabi', 'South Indian', 'Jain', 'Diet Food'];
const EMPTY_FORM = { name: '', category: 'Gujarati', price: '', quantity: '', description: '', isVeg: true, imageUrl: '' };

const btnStyle = { padding: '10px 24px', background: 'tomato', color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer', fontSize: 15, fontWeight: 600 };

const CookMenu = () => {
  const { showToast } = useContext(StoreContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchMenu = useCallback(() => {
    setLoading(true);
    setLoadError('');
    getCookMenu()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.items || data?.menu || []);
        setItems(list);
      })
      .catch((err) => {
        setLoadError(err.message || 'Could not load menu.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const setF = (k) => (e) => setForm((prev) => ({
    ...prev,
    [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    setFormError('');
    try {
      const { url } = await uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: url }));
      showToast('Image uploaded!', 'success');
    } catch (err) {
      setFormError(`Image upload failed: ${err.message}`);
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        category: form.category,
        price: parseInt(form.price, 10),
        quantity: parseInt(form.quantity, 10),
        description: form.description.trim() || undefined,
        isVeg: form.isVeg,
        imageUrl: form.imageUrl || undefined,
      };
      if (editId) {
        await patchMenuItem(editId, body);
        showToast('Dish updated!', 'success');
      } else {
        await postMenuItem(body);
        showToast('Dish added to Today’s Menu!', 'success');
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      fetchMenu();
    } catch (err) {
      setFormError(err.message || 'Failed to save item.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setFormError('');
    setForm({
      name: item.name,
      category: item.category,
      price: String(item.price),
      quantity: String(item.quantity ?? 0),
      description: item.description || '',
      isVeg: Boolean(item.isVeg),
      imageUrl: item.imageUrl || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestock = async (item, addQty = 5) => {
    setBusyId(item.id);
    try {
      await patchMenuItem(item.id, { quantity: (item.quantity ?? 0) + addQty });
      showToast(`Restocked ${item.name} (+${addQty})`, 'success');
      fetchMenu();
    } catch (err) {
      showToast(err.message || 'Could not restock dish.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this dish from Today’s Menu?')) return;
    setBusyId(id);
    try {
      await deleteMenuItem(id);
      showToast('Dish removed.', 'neutral');
      fetchMenu();
    } catch (err) {
      showToast(err.message || 'Could not delete dish.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px' }}>
      <h2 style={{ color: '#49557e', marginBottom: 24 }}>Today's Menu</h2>

      {/* Add / Edit Form */}
      <form onSubmit={handleSubmit} className="cook-menu-form">
        <h3 style={{ color: '#49557e', marginBottom: 16 }}>{editId ? 'Edit Dish' : 'Add New Dish'}</h3>
        <div className="cook-form-grid">
          <input className="cook-input" type="text" placeholder="Dish name" value={form.name} onChange={setF('name')} minLength={2} required />
          <select className="cook-input" value={form.category} onChange={setF('category')}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="cook-input" type="number" placeholder="Price (₹)" value={form.price} onChange={setF('price')} min={1} max={5000} required />
          <input className="cook-input" type="number" placeholder="Quantity available" value={form.quantity} onChange={setF('quantity')} min={0} max={500} required />
        </div>
        <textarea
          className="cook-input cook-textarea"
          placeholder="Short description (optional)"
          value={form.description}
          onChange={setF('description')}
          rows={3}
          maxLength={300}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input type="checkbox" checked={form.isVeg} onChange={setF('isVeg')} />
            Pure Veg
          </label>
          <div>
            <label style={{ fontSize: 13, color: '#808080' }}>Dish photo:</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} style={{ marginLeft: 8, fontSize: 13 }} />
            {uploadingImg && <span style={{ fontSize: 12, color: '#808080' }}> uploading…</span>}
          </div>
        </div>
        {form.imageUrl && <img src={imageUrl(form.imageUrl)} alt="preview" style={{ marginTop: 10, height: 80, borderRadius: 8, objectFit: 'cover' }} />}
        {formError && <p style={{ color: '#e53e3e', fontSize: 13, marginTop: 8 }}>{formError}</p>}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button type="submit" disabled={submitting || uploadingImg} style={{ ...btnStyle, opacity: submitting || uploadingImg ? 0.65 : 1 }}>
            {submitting ? 'Saving…' : editId ? 'Update Dish' : 'Add Dish'}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => { setEditId(null); setForm(EMPTY_FORM); setFormError(''); }}
              style={{ ...btnStyle, background: '#eee', color: '#333' }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loadError && <p style={{ color: '#e53e3e', marginBottom: 16, fontSize: 14 }}>{loadError}</p>}

      {loading ? (
        <p style={{ color: '#808080' }}>Loading menu…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!loadError && items.length === 0 && (
            <p style={{ color: '#808080' }}>No dishes added yet. Use the form above to add your first item.</p>
          )}
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '12px 16px' }}>
              {item.imageUrl && (
                <img src={imageUrl(item.imageUrl)} alt={item.name} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: '#49557e' }}>
                  {item.name}{' '}
                  <span style={{ fontSize: 11, color: item.isVeg ? '#2e7d32' : '#c53030', fontWeight: 500 }}>
                    ({item.isVeg ? 'Veg' : 'Non-Veg'})
                  </span>
                </p>
                <p style={{ fontSize: 13, color: '#808080' }}>
                  {item.category} • ₹{item.price} • Qty left: <b>{item.quantity ?? 0}</b>
                </p>
                {item.description && <p style={{ fontSize: 12, color: '#aaa' }}>{item.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => handleRestock(item, 5)}
                  style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid #38a169', fontSize: 12, cursor: 'pointer', background: '#e8f5e9', color: '#2e7d32' }}
                >
                  +5 Restock
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => startEdit(item)}
                  style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid #49557e', fontSize: 12, cursor: 'pointer', background: '#f0f4ff', color: '#49557e' }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => handleDelete(item.id)}
                  style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid #e53e3e', fontSize: 12, cursor: 'pointer', background: '#fff5f5', color: '#e53e3e' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CookMenu;
