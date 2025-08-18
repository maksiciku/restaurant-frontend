// src/pages/TableMapEditorPage.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './tableMap.css';
import { useNavigate } from 'react-router-dom';

const API = 'http://192.168.1.212:5000/table-map';

export default function TableMapEditorPage() {
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({ name: '', seats: 2 });
  const [shape, setShape] = useState('circle');
  const [drag, setDrag] = useState(null);
  const [zone, setZone] = useState('Main');
  const mapRef = useRef(null);
  const [activeZone, setActiveZone] = useState('Main');
  const [editTable, setEditTable] = useState(null);
  const navigate = useNavigate();
  const fromPOS = window.location.search.includes('pos=true');
  const movedRef = useRef(false);   // ← true once the mouse actually moves

  // ✅ Helper: fetch live table statuses
const fetchStatuses = async () => {
  try {
    const { data: dbTables } = await axios.get(`${process.env.REACT_APP_API_URL}/tables`);

    setTables((prev) =>
      prev.map((t) => {
        const match =
          dbTables.find((d) => d.id === t.linked_table_id) ||
          dbTables.find((d) => d.name === t.name);

        return { ...t, status: match?.status || 'free' };
      })
    );
  } catch (err) {
    console.error('❌ Failed to fetch table statuses', err);
  }
};

  useEffect(() => {
    axios.get(API)
      .then(({ data }) => {
        const clean = data.map(t => ({
          ...t,
          shape: t.shape || 'square',
          x: Number(t.x) || 100,
          y: Number(t.y) || 100,
        }));
        setTables(clean);
      })
      .catch(err => console.error('❌ load tables', err));
  }, []);

// ✅ Refresh table statuses on interval
useEffect(() => {
  fetchStatuses(); // run immediately
  const id = setInterval(() => fetchStatuses(), 3000); // refresh every 3s
  return () => clearInterval(id); // cleanup on unmount
}, []);

  const addTable = async () => {
    if (!newTable.name.trim()) return;
    const payload = {
      ...newTable,
      shape,
      zone,                  // ✅ include zone
      x: 100,
      y: 100,
      status: 'free',
    };
    try {
      const { data } = await axios.post(API, payload);
      setTables(p => [...p, { ...payload, id: data.id }]);
      setNewTable({ name: '', seats: 2 });
      setShape('circle');
      setZone('Main');       // ✅ reset picker
    } catch (e) {
      console.error('❌ add', e);
    }
  };

  const deleteTable = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      setTables(p => p.filter(t => t.id !== id));
    } catch (e) {
      console.error('❌ delete', e);
    }
  };

  /* ---------------- drag helpers ---------------- */
const startDrag = (e, tbl) => {
  if (e.target.closest('.delete-btn')) return;
  e.preventDefault();
  setDrag({
    id: tbl.id,
    offX: e.nativeEvent.offsetX,
    offY: e.nativeEvent.offsetY
  });
  movedRef.current = false;

  const pressTimer = setTimeout(() => {
    setTables(p => p.map(t =>
      t.id === tbl.id ? { ...t, showDelete: true } : t
    ));
    setTimeout(() => {
      setTables(p => p.map(t =>
        t.id === tbl.id ? { ...t, showDelete: false } : t
      ));
    }, 3000);
  }, 1000);

  const clear = () => {
    clearTimeout(pressTimer);
    window.removeEventListener('mouseup', clear);
  };
  window.addEventListener('mouseup', clear);
};

const handleMouseMove = (e) => {
  if (!drag) return;
  movedRef.current = true;         // ✅ we did move
  const rect = mapRef.current.getBoundingClientRect();
  setTables(p => p.map(t =>
    t.id === drag.id
      ? { ...t,
          x: e.clientX - rect.left - drag.offX,
          y: e.clientY - rect.top  - drag.offY }
      : t
  ));
};

const handleMouseUp = async () => {
  if (!drag) return;
  const tbl = tables.find(t => t.id === drag.id);
  setDrag(null);
  try { await axios.post(API, tbl); } catch (e) { console.error('❌ save', e); }
};

  const handleMouseDown = (e, tbl) => {
    if (e.target.tagName === 'BUTTON') return;
    startDrag(e, tbl);
  };

  const chairStyleCircle = (i, total) => {
    const R = 55;
    const angle = (2 * Math.PI * i) / total;
    return {
      position: 'absolute',
      left: `calc(50% + ${Math.cos(angle) * R}px)`,
      top: `calc(50% + ${Math.sin(angle) * R}px)`,
      transform: 'translate(-50%, -50%)'
    };
  };

  const chairStyleBox = (i, total, tbl) => {
    const tableWidth = tbl.shape === 'rectangle' ? 130 : 100;
    const tableHeight = tbl.shape === 'rectangle' ? 80 : 100;

    const perSide = Math.ceil(total / 4);
    const side = Math.floor(i / perSide);
    const idx = i % perSide;

    const gapX = tableWidth / (perSide + 1);
    const gapY = tableHeight / (perSide + 1);

    switch (side) {
      case 0:
        return {
          position: 'absolute',
          top: '-12px',
          left: `${(idx + 1) * gapX}px`,
          transform: 'translate(-50%, -50%)'
        };
      case 1:
        return {
          position: 'absolute',
          top: `${(idx + 1) * gapY}px`,
          left: `${tableWidth + 12}px`,
          transform: 'translate(-50%, -50%)'
        };
      case 2:
        return {
          position: 'absolute',
          top: `${tableHeight + 12}px`,
          left: `${(idx + 1) * gapX}px`,
          transform: 'translate(-50%, -50%)'
        };
      default:
        return {
          position: 'absolute',
          top: `${(idx + 1) * gapY}px`,
          left: '-12px',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  return (
  <div className="map-editor">
    <h1 className="title">🗺 Table Map Editor</h1>

    <div className="new-table-form">
      <input
        placeholder="Table"
        value={newTable.name}
        onChange={e => setNewTable({ ...newTable, name: e.target.value })}
      />
      <input
        type="number"
        min="1"
        value={newTable.seats}
        onChange={e =>
          setNewTable({ ...newTable, seats: +e.target.value || 1 })
        }
      />
      <select value={shape} onChange={e => setShape(e.target.value)}>
        <option value="circle">⚪ Circle</option>
        <option value="square">🟥 Square</option>
        <option value="rectangle">▭ Rectangle</option>
      </select>
      <select value={zone} onChange={e => setZone(e.target.value)}>
        <option value="Main">Main</option>
        <option value="Terrace">Terrace</option>
        <option value="Garden">Garden</option>
      </select>
      <button onClick={addTable}>➕ Add</button>
    </div>

    <div className="zone-tabs">
      {['Main', 'Terrace', 'Garden'].map(z => (
        <button
          key={z}
          className={z === activeZone ? 'active-zone' : ''}
          onClick={() => setActiveZone(z)}
        >
          {z}
        </button>
      ))}
    </div>

    <div
      ref={mapRef}
      className="map-area"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {tables.filter(t => t.zone === activeZone).map(t => (
    <div
  key={t.id}
  className={`tbl ${t.shape}`}
  style={{
    left: `${t.x}px`,
    top: `${t.y}px`,
    backgroundColor: t.status === 'occupied' ? '#f87171' : '#34d399' // red / green
  }}
  onMouseDown={(e) => startDrag(e, t)}
  onMouseUp={(e) => {
  if (movedRef.current) return;
  if (e.target.closest('.delete-btn')) return;

  navigate(
    `/pos/${t.linked_table_id || t.name.replace(/^\D+/g, '')}`
  );
}}
>
          {Array.from({ length: t.seats }).map((_, i) => {
            const style =
              t.shape === 'circle'
                ? chairStyleCircle(i, t.seats)
                : chairStyleBox(i, t.seats, t);
            return <div key={i} className="chair" style={style} />;
          })}

          <div className="centre">
            {t.name}
            <div className="zone-label">{t.zone}</div>
            {t.showDelete && (
              <button
  className="delete-btn"
  onClick={(e) => {
    e.stopPropagation();
    deleteTable(t.id);
  }}
>
  🗑️
</button>
            )}
          </div>
        </div>
      ))}
    </div>

    {editTable && (
      <div className="modal">
        <div className="modal-content">
          <h3>Edit Table</h3>

          <input
            value={editTable.name}
            onChange={e =>
              setEditTable({ ...editTable, name: e.target.value })
            }
            placeholder="Table Name"
          />
          <input
            type="number"
            min="1"
            value={editTable.seats}
            onChange={e =>
              setEditTable({
                ...editTable,
                seats: +e.target.value || 1
              })
            }
            placeholder="Seats"
          />
          <select
            value={editTable.shape}
            onChange={e =>
              setEditTable({ ...editTable, shape: e.target.value })
            }
          >
            <option value="circle">⚪ Circle</option>
            <option value="square">🟥 Square</option>
            <option value="rectangle">▭ Rectangle</option>
          </select>
          <select
            value={editTable.zone}
            onChange={e =>
              setEditTable({ ...editTable, zone: e.target.value })
            }
          >
            <option value="Main">Main</option>
            <option value="Terrace">Terrace</option>
            <option value="Garden">Garden</option>
          </select>

          <div className="modal-actions">
            <button onClick={() => setEditTable(null)}>Cancel</button>
            <button
              onClick={async () => {
                try {
                  await axios.post(API, editTable);
                  setTables(prev =>
                    prev.map(t => (t.id === editTable.id ? editTable : t))
                  );
                  setEditTable(null);
                } catch (err) {
                  console.error('❌ save edit', err);
                }
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
