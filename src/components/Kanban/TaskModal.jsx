import React, { useState } from 'react';

const priorities = ['Low', 'Medium', 'High'];

const TaskModal = ({ task, onClose, users, onReassign, onSmartAssign, onSave }) => {
  const [desc, setDesc] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority || 'Medium');
  if (!task) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(24,28,38,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", sans-serif',
      animation: 'fadeIn 0.2s',
    }}>
      <div style={{
        background: 'rgba(32,33,36,0.98)', color: '#fff', borderRadius: 18, minWidth: 1100, maxWidth: 1200, minHeight: 600,
        boxShadow: '0 8px 32px rgba(0,0,0,0.28)', padding: 0, position: 'relative', display: 'flex', flexDirection: 'row',
        border: '1.5px solid #23242a',
        animation: 'slideIn 0.25s',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', opacity: 0.7, zIndex: 2 }}>×</button>
        {/* Left: Details */}
        <div style={{ flex: 2.5, padding: '2.5rem 2.5rem 2.5rem 2.5rem', borderRight: '1.5px solid #23242a', minWidth: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: '2.1rem', marginRight: 12, lineHeight: 1.1 }}>{task.title}</div>
            <select
              value={task.assignedTo?._id || task.assignedTo || ''}
              onChange={e => onReassign(task._id || task.id, null, e.target.value)}
              style={{ borderRadius: 8, padding: '6px 18px', fontSize: '1.1em', background: '#23242a', color: '#fff', border: '1px solid #444', marginRight: 12 }}
            >
              <option value=''>Unassigned</option>
              {users && users.map(u => (
                <option key={u._id} value={u._id}>{u.username}</option>
              ))}
            </select>
            <button
              className="trello-icon-btn"
              style={{ background: '#f5c518', color: '#222', fontWeight: 700, fontSize: '1.1em', padding: '0.5rem 1.2rem', marginRight: 8 }}
              onClick={() => onSmartAssign(task._id || task.id, null)}
              title="Smart Assign"
            >🤖 Smart Assign</button>
          </div>
          <div style={{ display: 'flex', gap: 32, marginBottom: 28, alignItems: 'center' }}>
            <div style={{ fontSize: '1.1rem' }}><b>Status:</b> {task.status}</div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.1rem' }}>
              <b style={{ marginRight: 10 }}>Priority:</b>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                style={{ borderRadius: 8, padding: '6px 18px', fontSize: '1.1em', background: '#23242a', color: '#fff', border: '1px solid #444' }}
              >
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: 10 }}>Description</div>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              style={{ width: '100%', minHeight: 110, background: '#23242a', color: '#bbb', borderRadius: 10, padding: '1.3rem 1.4rem', fontSize: '1.13rem', border: '1px solid #23242a', resize: 'vertical' }}
              placeholder="Add a more detailed description..."
            />
          </div>
          <button
            onClick={() => onSave(task._id || task.id, desc, priority)}
            style={{ background: '#0079bf', color: '#fff', fontWeight: 700, fontSize: '1.1em', padding: '0.7rem 2.2rem', borderRadius: 8, border: 'none', marginTop: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >Save</button>
          <div style={{ color: '#888', fontSize: '1.08em', marginTop: 18 }}><b>Created by:</b> {task.createdBy?.username || 'Unknown'}<br /><b>Created at:</b> {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Unknown'}</div>
        </div>
        {/* Right: Activity */}
        <div style={{ flex: 1.2, padding: '2.5rem 2.2rem 2.5rem 2.2rem', background: 'rgba(24,28,38,0.98)', borderTopRightRadius: 18, borderBottomRightRadius: 18, minWidth: 320 }}>
          <div style={{ fontWeight: 600, fontSize: '1.18rem', marginBottom: 28 }}>Activity</div>
          <div style={{ color: '#bbb', fontSize: '1.09rem', marginBottom: 10 }}>
            <b>{task.createdBy?.username || 'Unknown'}</b> added this card to <b>{task.status}</b><br />
            {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Unknown'}
          </div>
        </div>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideIn { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
        `}</style>
      </div>
    </div>
  );
};

export default TaskModal; 