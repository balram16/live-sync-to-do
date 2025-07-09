import React, { useState, useRef, useEffect } from 'react';
import './Board.css';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';
import MenuIcon from './icons/MenuIcon';
import CheckIcon from './icons/CheckIcon';
import CloseIcon from './icons/CloseIcon';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ActivityLog from './ActivityLog';
import TaskModal from './TaskModal';

const columnDefs = [
  { id: 'todo', name: 'To Do', status: 'Todo' },
  { id: 'doing', name: 'Doing', status: 'In Progress' },
  { id: 'done', name: 'Done', status: 'Done' },
];

const SOCKET_URL = '${import.meta.env.VITE_API_URL}';

const Board = ({ theme, toggleTheme }) => {
  const { logout, token, user } = useAuth();
  const navigate = useNavigate();
  const [columns, setColumns] = useState(columnDefs.map(col => ({ ...col, cards: [] })));
  const [newCard, setNewCard] = useState({});
  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listError, setListError] = useState('');
  const [editingCard, setEditingCard] = useState({ colId: null, cardId: null });
  const [editCardText, setEditCardText] = useState('');
  const [editingCol, setEditingCol] = useState(null);
  const [editColName, setEditColName] = useState('');
  const [colMenuOpen, setColMenuOpen] = useState(null);
  const [deleteColConfirm, setDeleteColConfirm] = useState(null);
  const menuRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const socketRef = useRef();
  const [conflict, setConflict] = useState(null); // { serverVersion, clientVersion }
  const [users, setUsers] = useState([]);
  const [modalTask, setModalTask] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [dragFreeze, setDragFreeze] = useState(false);

  // Fetch tasks on mount
  useEffect(() => {
    if (dragFreeze) return; // Prevent updates while dragging
    socketRef.current = io(SOCKET_URL);
    socketRef.current.on('connect', () => {
      // console.log('Connected to socket.io server');
    });
    socketRef.current.on('taskAdded', (task) => {
      setColumns(cols => cols.map(c =>
        c.status === task.status
          ? {
              ...c,
              cards: c.cards.some(card => (card._id || card.id) === (task._id || task.id))
                ? c.cards
                : [...c.cards, task]
            }
          : c
      ));
      setNotification('A task was added');
    });
    socketRef.current.on('taskUpdated', (task) => {
      setColumns(cols => cols.map(c =>
        c.status === task.status
          ? { ...c, cards: c.cards.map(card => (card._id === task._id || card.id === task._id) ? task : card) }
          : { ...c, cards: c.cards.filter(card => (card._id || card.id) !== task._id) }
      ));
      setNotification('A task was updated');
    });
    socketRef.current.on('taskDeleted', ({ _id }) => {
      setColumns(cols => cols.map(c =>
        ({ ...c, cards: c.cards.filter(card => (card._id || card.id) !== _id) })
      ));
      setNotification('A task was deleted');
    });
    socketRef.current.on('columnAdded', (col) => {
      setColumns(cols => [...cols, col]);
      setNotification('A column was added');
    });
    socketRef.current.on('columnUpdated', (col) => {
      setColumns(cols => cols.map(c => c.id === col.id ? { ...c, name: col.name } : c));
      setNotification('A column was renamed');
    });
    socketRef.current.on('columnDeleted', (colId) => {
      setColumns(cols => cols.filter(c => c.id !== colId));
      setNotification('A column was deleted');
    });
    return () => {
      socketRef.current.disconnect();
    };
  }, [token, dragFreeze]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const handleClick = (e) => {
      if (colMenuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setColMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [colMenuOpen]);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  // Add card (task)
  const handleAddCard = async (colId) => {
    const text = newCard[colId]?.trim();
    if (!text) return;
    setError('');
    try {
      const col = columns.find(c => c.id === colId);
      const res = await fetch('${import.meta.env.VITE_API_URL}/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: text, status: col.status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add task');
      // Do NOT update columns here; let the socket event handle it
      setNewCard({ ...newCard, [colId]: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddList = () => {
    const name = newListName.trim();
    if (!name) {
      setListError('List name required');
      return;
    }
    if (columns.some(col => col.name.toLowerCase() === name.toLowerCase())) {
      setListError('List name must be unique');
      return;
    }
    const newCol = { id: Date.now() + '', name, cards: [] };
    setColumns([...columns, newCol]);
    socketRef.current.emit('columnAdded', newCol);
    setNewListName('');
    setAddingList(false);
    setListError('');
  };

  // Edit card (task)
  const handleEditCard = (colId, cardId, text) => {
    setEditingCard({ colId, cardId });
    setEditCardText(text);
  };

  const handleSaveEditCard = async (colId, cardId) => {
    setError('');
    try {
      const col = columns.find(c => c.id === colId);
      const card = col.cards.find(card => card._id === cardId || card.id === cardId);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...card, title: editCardText }),
      });
      if (res.status === 409) {
        const data = await res.json();
        setConflict({
          server: data.serverVersion,
          client: data.clientVersion,
          colId,
          cardId,
        });
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update task');
      setColumns(cols => cols.map(c =>
        c.id === colId ? { ...c, cards: c.cards.map(card => (card._id === cardId || card.id === cardId) ? data : card) } : c
      ));
      setEditingCard({ colId: null, cardId: null });
      setEditCardText('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Conflict resolution handlers
  const handleOverwrite = async () => {
    if (!conflict) return;
    try {
      const { client, cardId, colId } = conflict;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...client, version: conflict.server.version }),
      });
      const data = await res.json();
      setColumns(cols => cols.map(c =>
        c.id === colId ? { ...c, cards: c.cards.map(card => (card._id === cardId || card.id === cardId) ? data : card) } : c
      ));
      setEditingCard({ colId: null, cardId: null });
      setEditCardText('');
      setConflict(null);
    } catch (err) {
      setError('Failed to overwrite: ' + err.message);
    }
  };
  const handleMerge = async () => {
    if (!conflict) return;
    // For demo: merge title and description, prefer client for others
    const merged = {
      ...conflict.server,
      ...conflict.client,
      title: `${conflict.server.title} / ${conflict.client.title}`,
      description: `${conflict.server.description || ''} / ${conflict.client.description || ''}`,
      version: conflict.server.version,
    };
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${conflict.cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(merged),
      });
      const data = await res.json();
      setColumns(cols => cols.map(c =>
        c.id === conflict.colId ? { ...c, cards: c.cards.map(card => (card._id === conflict.cardId || card.id === conflict.cardId) ? data : card) } : c
      ));
      setEditingCard({ colId: null, cardId: null });
      setEditCardText('');
      setConflict(null);
    } catch (err) {
      setError('Failed to merge: ' + err.message);
    }
  };

  // Delete card (task)
  const handleDeleteCard = async (colId, cardId) => {
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete task');
      setColumns(cols => cols.map(c =>
        c.id === colId ? { ...c, cards: c.cards.filter(card => (card._id || card.id) !== cardId) } : c
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  // Smart assign handler
  const handleSmartAssign = async (cardId, colId) => {
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${cardId}/smart-assign`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to smart assign');
      setColumns(cols => cols.map(c =>
        c.id === colId ? { ...c, cards: c.cards.map(card => (card._id === cardId || card.id === cardId) ? data : card) } : c
      ));
      setNotification('Task smart assigned');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReassign = async (cardId, colId, userId, newPriority) => {
    setError('');
    try {
      let col = columns.find(c => c.id === colId);
      let card = null;
      if (colId) {
        card = col.cards.find(card => card._id === cardId || card.id === cardId);
      } else {
        // Find card in any column (for modal)
        for (const c of columns) {
          card = c.cards.find(card => card._id === cardId || card.id === cardId);
          if (card) break;
        }
      }
      if (!card) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...card,
          assignedTo: userId !== undefined ? userId : card.assignedTo,
          priority: newPriority !== undefined ? newPriority : card.priority,
          version: card.version,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reassign');
      setColumns(cols => cols.map(c =>
        c.cards.some(card => (card._id || card.id) === cardId)
          ? { ...c, cards: c.cards.map(card => (card._id === cardId || card.id === cardId) ? data : card) }
          : c
      ));
      setNotification('Task updated');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditCol = (colId, name) => {
    setEditingCol(colId);
    setEditColName(name);
    setColMenuOpen(null);
  };

  const handleSaveEditCol = (colId) => {
    const name = editColName.trim();
    if (!name) return;
    if (columns.some(col => col.name.toLowerCase() === name.toLowerCase() && col.id !== colId)) return;
    setColumns(cols => cols.map(col =>
      col.id === colId ? { ...col, name } : col
    ));
    socketRef.current.emit('columnUpdated', { id: colId, name });
    setEditingCol(null);
    setEditColName('');
  };

  const handleDeleteCol = (colId) => {
    if (columns.length === 1) return;
    setColumns(cols => cols.filter(col => col.id !== colId));
    socketRef.current.emit('columnDeleted', colId);
    setDeleteColConfirm(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const onDragEnd = async (result) => {
    setIsDragging(false);
    console.log('onDragEnd', result);
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const sourceColIdx = columns.findIndex(c => c.id === source.droppableId);
    const destColIdx = columns.findIndex(c => c.id === destination.droppableId);
    const sourceCol = columns[sourceColIdx];
    const destCol = columns[destColIdx];
    const movedCard = sourceCol.cards[source.index];
    // Remove from source
    const newSourceCards = Array.from(sourceCol.cards);
    newSourceCards.splice(source.index, 1);
    // Add to destination
    const newDestCards = Array.from(destCol.cards);
    newDestCards.splice(destination.index, 0, movedCard);
    // Update columns
    const newColumns = columns.map((col, idx) => {
      if (idx === sourceColIdx) return { ...col, cards: newSourceCards };
      if (idx === destColIdx) return { ...col, cards: newDestCards };
      return col;
    });
    setColumns(newColumns);
    // If status changed, update backend
    if (sourceCol.status !== destCol.status) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${movedCard._id || movedCard.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...movedCard, status: destCol.status, version: movedCard.version }),
        });
      } catch (err) {
        setNotification('Failed to update task status');
      }
    }
  };

  // Fetch users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('${import.meta.env.VITE_API_URL}/api/auth/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUsers(data);
      } catch {}
    };
    fetchUsers();
  }, [token]);

  useEffect(() => {
    if (dragFreeze) return; // Prevent updates while dragging
    const fetchTasks = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('${import.meta.env.VITE_API_URL}/api/tasks', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch tasks');
        // Group tasks by status
        const grouped = columnDefs.map(col => ({
          ...col,
          cards: data.filter(task => task.status === col.status),
        }));
        setColumns(grouped);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchTasks();
  }, [token, dragFreeze]);

  // Save from modal (desc/priority)
  const handleSaveModal = async (taskId, desc, priority) => {
    setError('');
    try {
      // Find the card and its column
      let colId = null;
      let card = null;
      for (const c of columns) {
        card = c.cards.find(card => card._id === taskId || card.id === taskId);
        if (card) { colId = c.id; break; }
      }
      if (!card) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...card, description: desc, priority, version: card.version }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update task');
      setColumns(cols => cols.map(c =>
        c.cards.some(card => (card._id || card.id) === taskId)
          ? { ...c, cards: c.cards.map(card => (card._id === taskId || card.id === taskId) ? data : card) }
          : c
      ));
      setModalTask(null);
      setNotification('Task updated');
    } catch (err) {
      setError(err.message);
    }
  };

  // Mark as Done handler
  const handleMarkAsDone = async (card, colId) => {
    // Find the 'Done' column
    const doneCol = columns.find(c => c.status === 'Done');
    if (!doneCol) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${card._id || card.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...card, status: 'Done', version: card.version }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to mark as done');
      // Remove from current column and add to Done
      setColumns(cols => cols.map(c => {
        if (c.id === colId) return { ...c, cards: c.cards.filter(t => (t._id || t.id) !== (card._id || card.id) ) };
        if (c.status === 'Done') return { ...c, cards: [...c.cards, data] };
        return c;
      }));
      setNotification('Task marked as done');
    } catch (err) {
      setError(err.message);
    }
  };

  // Render loading/error
  if (loading) return (
    <div className="trello-bg">
      <div className="trello-header">
        <div className="trello-board-title">hi</div>
      </div>
      <div style={{ padding: 40, color: '#888' }}>Loading tasks...</div>
    </div>
  );
  if (error) return (
    <div className="trello-bg">
      <div className="trello-header">
        <div className="trello-board-title">hi</div>
      </div>
      <div style={{ padding: 40, color: '#d32f2f' }}>{error}</div>
    </div>
  );

  return (
    <div className="trello-bg">
      <div className="trello-header">
        <div className="trello-board-title">TO-DO</div>
        <div className="trello-header-controls" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && (
            <>
              <span style={{ marginRight: 8, color: '#bcd4e6', fontWeight: 500, display: 'none' }}>
              {user.username} ({user.email})
            </span>
              <div
                className="trello-profile-avatar"
                onClick={() => setProfileOpen((v) => !v)}
                ref={profileRef}
                title="Profile"
              >
                {user.username ? user.username[0].toUpperCase() : '?'}
              </div>
              {profileOpen && (
                <div className="trello-profile-dropdown" style={{ right: 0 }}>
                  <div className="profile-info"><b>{user.username}</b></div>
                  <div className="profile-info" style={{ fontSize: '0.98em', color: '#bcd4e6' }}>{user.email}</div>
                  <button className="profile-logout-btn" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {notification && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#222', color: '#fff', padding: '0.7rem 1.5rem', borderRadius: 8, zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
          {notification}
        </div>
      )}
      {conflict && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,32,38,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', color: '#222', borderRadius: 12, padding: 32, minWidth: 340, maxWidth: 480, boxShadow: '0 4px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 16 }}>Conflict Detected</div>
            <div style={{ marginBottom: 12 }}>This task was changed by someone else. Choose how to resolve:</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Server Version</div>
                <div><b>Title:</b> {conflict.server.title}</div>
                <div><b>Description:</b> {conflict.server.description}</div>
              </div>
              <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Your Version</div>
                <div><b>Title:</b> {conflict.client.title}</div>
                <div><b>Description:</b> {conflict.client.description}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="trello-add-card-btn" style={{ background: '#f5c518', color: '#222' }} onClick={handleMerge}>Merge</button>
              <button className="trello-add-card-btn" style={{ background: '#d32f2f' }} onClick={handleOverwrite}>Overwrite</button>
              <button className="trello-add-card-btn" style={{ background: '#555' }} onClick={() => setConflict(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <DragDropContext
        onDragEnd={async (result) => {
          setDragFreeze(false);
          console.log('onDragEnd', result);
          const { source, destination, draggableId } = result;
          if (!destination) return;
          if (source.droppableId === destination.droppableId && source.index === destination.index) return;
          const sourceColIdx = columns.findIndex(c => c.id === source.droppableId);
          const destColIdx = columns.findIndex(c => c.id === destination.droppableId);
          const sourceCol = columns[sourceColIdx];
          const destCol = columns[destColIdx];
          const movedCard = sourceCol.cards[source.index];
          // Remove from source
          const newSourceCards = Array.from(sourceCol.cards);
          newSourceCards.splice(source.index, 1);
          // Add to destination
          const newDestCards = Array.from(destCol.cards);
          newDestCards.splice(destination.index, 0, movedCard);
          // Update columns
          const newColumns = columns.map((col, idx) => {
            if (idx === sourceColIdx) return { ...col, cards: newSourceCards };
            if (idx === destColIdx) return { ...col, cards: newDestCards };
            return col;
          });
          setColumns(newColumns);
          // If status changed, update backend
          if (sourceCol.status !== destCol.status) {
            try {
              await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${movedCard._id || movedCard.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...movedCard, status: destCol.status, version: movedCard.version }),
              });
            } catch (err) {
              setNotification('Failed to update task status');
            }
          }
          // After drag ends, re-fetch tasks to re-sync
          const res = await fetch('${import.meta.env.VITE_API_URL}/api/tasks', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (Array.isArray(data)) {
            const grouped = columnDefs.map(col => ({
              ...col,
              cards: data.filter(task => task.status === col.status),
            }));
            setColumns(grouped);
          }
        }}
        onDragStart={() => setDragFreeze(true)}
      >
        <div className="trello-main" style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
          <ActivityLog token={token} />
        <div className="trello-board-area">
          <div className="trello-columns">
            {columns.map(col => (
              <Droppable droppableId={String(col.id || col._id || col.name)} key={String(col.id || col._id || col.name)}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`trello-column trello-fade-in${snapshot.isDraggingOver ? ' dragging-over' : ''}`}
                  >
                    <div className="trello-column-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', position: 'relative' }}>
                      {editingCol === col.id ? (
                        <>
                          <input
                            className="trello-add-card-input"
                            style={{ flex: 1, marginRight: '0.5rem' }}
                            value={editColName}
                            onChange={e => setEditColName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveEditCol(col.id)}
                            autoFocus
                          />
                          <button className="trello-icon-btn" onClick={() => handleSaveEditCol(col.id)} title="Save"><CheckIcon /></button>
                          <button className="trello-icon-btn" onClick={() => setEditingCol(null)} title="Cancel"><CloseIcon /></button>
                        </>
                      ) : (
                        <>
                          <span style={{ flex: 1 }}>{col.name}</span>
                          <button className="trello-icon-btn" onClick={() => setColMenuOpen(colMenuOpen === col.id ? null : col.id)} title="Column menu"><MenuIcon /></button>
                          {colMenuOpen === col.id && (
                            <div ref={menuRef} style={{ position: 'absolute', background: '#22272b', color: '#fff', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.18)', zIndex: 10, right: 0, marginTop: 30, minWidth: 120 }}>
                              <div style={{ padding: '0.7rem 1rem', cursor: 'pointer' }} onClick={() => handleEditCol(col.id, col.name)}>Edit</div>
                              <div style={{ padding: '0.7rem 1rem', cursor: columns.length === 1 ? 'not-allowed' : 'pointer', color: columns.length === 1 ? '#888' : '#d32f2f' }} onClick={() => columns.length === 1 ? null : setDeleteColConfirm(col.id)}>Delete</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {deleteColConfirm === col.id && (
                      <div style={{ background: '#fff', color: '#222', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.18)', padding: '1rem', position: 'absolute', zIndex: 20, right: 10, top: 40, minWidth: 180 }}>
                        <div style={{ marginBottom: 10 }}>Delete this list and all its cards?</div>
                        <button className="trello-add-card-btn" style={{ background: '#d32f2f', marginRight: 8 }} onClick={() => handleDeleteCol(col.id)}>Delete</button>
                        <button className="trello-add-card-btn" style={{ background: '#555' }} onClick={() => setDeleteColConfirm(null)}>Cancel</button>
                      </div>
                    )}
                    <div className="trello-cards" style={{ overflow: 'visible' }}>
                      {col.cards.map((card, idx) => (
                        <Draggable draggableId={String(card._id || card.id)} index={idx} key={String(card._id || card.id)}>
                          {(provided, snapshot) => {
                            const isEditing = editingCard.colId === col.id && editingCard.cardId === (card._id || card.id);
                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`trello-card trello-slide-in${snapshot.isDragging ? ' dragging' : ''}${isEditing ? ' flipped' : ''}`}
                                style={{
                                  ...provided.draggableProps.style,
                                  boxShadow: snapshot.isDragging ? '0 4px 16px rgba(0,0,0,0.18)' : undefined,
                                  background: snapshot.isDragging ? 'rgba(66,153,225,0.18)' : undefined,
                                  transition: 'box-shadow 0.2s, background 0.2s',
                                  cursor: 'grab',
                                }}
                                onClick={e => {
                                  if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.closest('button') || e.target.closest('select')) return;
                                  setModalTask(card);
                                }}
                              >
                                <div className="trello-card-front" style={{ visibility: isEditing ? 'hidden' : 'visible', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  {/* Mark as Done checkbox (not in Done column) */}
                                  {col.status !== 'Done' && (
                                    <input
                                      type="checkbox"
                                      className="mark-done-checkbox"
                                      title="Mark as done"
                                      onClick={e => { e.stopPropagation(); handleMarkAsDone(card, col.id); }}
                                      onMouseDown={e => e.stopPropagation()}
                                      style={{ marginRight: 10 }}
                                    />
                                  )}
                                  <span style={{ flex: 1 }}>{card.title}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <button className="trello-icon-btn" onClick={e => { e.stopPropagation(); handleEditCard(col.id, card._id || card.id, card.title); }} title="Edit"><EditIcon /></button>
                                    <button className="trello-icon-btn" onClick={e => { e.stopPropagation(); handleDeleteCard(col.id, card._id || card.id); }} title="Delete"><DeleteIcon /></button>
                                  </div>
                                </div>
                                <div className="trello-card-back" style={{ visibility: isEditing ? 'visible' : 'hidden' }}>
                                  <input
                                    className="trello-add-card-input"
                                    style={{ flex: 1, marginRight: '0.5rem' }}
                                    value={editCardText}
                                    onChange={e => setEditCardText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveEditCard(col.id, card._id || card.id)}
                                    autoFocus
                                  />
                                  <button className="trello-icon-btn" onClick={() => handleSaveEditCard(col.id, card._id || card.id)} title="Save"><CheckIcon /></button>
                                  <button className="trello-icon-btn" onClick={() => setEditingCard({ colId: null, cardId: null })} title="Cancel"><CloseIcon /></button>
                                </div>
                              </div>
                            );
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      <div className="trello-add-card-row">
                        <input
                          className="trello-add-card-input"
                          type="text"
                          placeholder="Add a card"
                          value={newCard[col.id] || ''}
                          onChange={e => setNewCard({ ...newCard, [col.id]: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && handleAddCard(col.id)}
                        />
                        <button className="trello-add-card-btn" onClick={() => handleAddCard(col.id)}>+</button>
                      </div>
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
            <div className="trello-add-list">
              {addingList ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <input
                    className="trello-add-card-input"
                    type="text"
                    placeholder="Enter list title..."
                    value={newListName}
                    onChange={e => { setNewListName(e.target.value); setListError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleAddList()}
                    autoFocus
                  />
                  {listError && <div style={{ color: '#d32f2f', fontSize: '0.95rem' }}>{listError}</div>}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="trello-add-card-btn" onClick={handleAddList}>Add list</button>
                    <button className="trello-add-card-btn" style={{ background: '#555' }} onClick={() => { setAddingList(false); setNewListName(''); setListError(''); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <span onClick={() => setAddingList(true)} style={{ cursor: 'pointer' }}>+ Add another list</span>
              )}
            </div>
          </div>
        </div>
      </div>
      </DragDropContext>
      {modalTask && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalTask(null)}
          users={users}
          onReassign={handleReassign}
          onSmartAssign={handleSmartAssign}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
};

export default Board; 