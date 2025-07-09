import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = `${import.meta.env.VITE_API_URL}`;

const actionLabels = {
  add: 'added',
  edit: 'edited',
  delete: 'deleted',
  assign: 'assigned',
  'drag-drop': 'moved',
  'column-add': 'added column',
  'column-edit': 'renamed column',
  'column-delete': 'deleted column',
};

const ActivityLog = ({ token }) => {
  const [actions, setActions] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    const fetchActions = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/actions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setActions(data);
    };
    fetchActions();
    socketRef.current = io(SOCKET_URL);
    // Listen for any task/column event to refresh log
    ['taskAdded','taskUpdated','taskDeleted','columnAdded','columnUpdated','columnDeleted'].forEach(event => {
      socketRef.current.on(event, fetchActions);
    });
    return () => socketRef.current.disconnect();
  }, [token]);

  return (
    <div className="ActivityLog">
      <div style={{ fontWeight: 600, marginBottom: 12, fontSize: '1.1rem' }}>Activity Log</div>
      {actions.length === 0 && <div style={{ color: '#aaa' }}>No recent activity.</div>}
      {actions.map((a, i) => (
        <div key={a._id || i} style={{ marginBottom: 10, fontSize: '0.97rem', borderBottom: '1px solid #333', paddingBottom: 6 }}>
          <span style={{ color: '#bcd4e6', fontWeight: 500 }}>{a.user?.username || 'Someone'}</span> {actionLabels[a.action] || a.action} <span style={{ color: '#f5c518' }}>{a.target}</span>
          <span style={{ float: 'right', color: '#888', fontSize: '0.92em' }}>{new Date(a.timestamp).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default ActivityLog; 