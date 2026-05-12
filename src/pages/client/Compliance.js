import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar'; 
import { triggerHaptic } from '../../utils/audio'; 
import { ImpactStyle } from '@capacitor/haptics';
import { 
  Plus, 
  Flame, 
  Settings2, 
  ShieldAlert, 
  AlertCircle,
  X,
  ListTodo,
  CheckCircle2,
  Circle,
  Trash2
} from 'lucide-react';

const Compliance = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  
  // 1. Initialize state directly from localStorage
  const [todos, setTodos] = useState(() => {
    const savedData = localStorage.getItem('fuelmaster_compliance_todos');
    return savedData ? JSON.parse(savedData) : [];
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState('Safety');

  const filters = ['All', 'Statutory', 'Maintenance', 'Safety'];

  // 2. Auto-Save to localStorage whenever 'todos' changes
  useEffect(() => {
    localStorage.setItem('fuelmaster_compliance_todos', JSON.stringify(todos));
  }, [todos]);

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Safety': return <Flame size={18} color="#f97316" />; 
      case 'Statutory': return <Settings2 size={18} color="#3b82f6" />; 
      case 'Maintenance': return <ShieldAlert size={18} color="#10b981" />; 
      default: return <AlertCircle size={18} color="var(--text-muted)" />;
    }
  };

  const handleAddTodo = (e) => {
    e.preventDefault();
    try { triggerHaptic(ImpactStyle.Light); } catch(e) {}

    const newTodoObj = {
      id: Date.now(),
      title: newTask,
      status: 'Pending',
      category: newCategory,
    };

    setTodos([newTodoObj, ...todos]);
    setNewTask('');
    setIsModalOpen(false);
  };

  // NEW LOGIC: Mark as completed, then auto-delete after a short delay
  const markAsCompleted = (id) => {
    try { triggerHaptic(ImpactStyle.Light); } catch(e) {}
    
    // Step 1: Update the status to 'Completed' so the UI shows the checkmark immediately
    setTodos(prevTodos => prevTodos.map(todo => 
      todo.id === id ? { ...todo, status: 'Completed' } : todo
    ));

    // Step 2: Permanently delete it from state (and localStorage) 600ms later
    setTimeout(() => {
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    }, 600);
  };

  const deleteTodo = (id) => {
    try { triggerHaptic(ImpactStyle.Heavy); } catch(e) {}
    if(window.confirm("Delete this task?")) {
        setTodos(todos.filter(todo => todo.id !== id));
    }
  };

  const filteredTodos = activeFilter === 'All' 
    ? todos 
    : todos.filter(t => t.category === activeFilter);

  return (
    <div className="app-layout">
      <Navbar title="Task List" />
      
      <main className="main-content">
        
        <div className="scroll-wrapper">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => {
                try { triggerHaptic(ImpactStyle.Light); } catch(e) {}
                setActiveFilter(filter)
              }}
              className={`tank-btn ${activeFilter === filter ? 'active' : ''}`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="content-card animate__animated animate__fadeIn" style={{ minHeight: '60vh', position: 'relative' }}>
          
          <div className="card-head">
            <h3><ListTodo size={20} color="var(--primary)" /> Compliance Tasks</h3>
          </div>

          {todos.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-muted)' }}>
              <ListTodo size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
              <p style={{ fontWeight: 600 }}>All caught up!</p>
              <p style={{ fontSize: '0.85rem' }}>Tap + to add a new task.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredTodos.map((todo) => {
                const isCompleted = todo.status === 'Completed';
                
                return (
                  <div key={todo.id} style={{ 
                    display: 'flex', gap: '12px', alignItems: 'center', 
                    padding: '15px', background: 'var(--bg-body)', 
                    border: isCompleted ? '1px dashed var(--border)' : '1px solid var(--border)', 
                    borderRadius: '16px',
                    opacity: isCompleted ? 0.6 : 1,
                    transition: 'all 0.4s ease' // Added smooth fade transition
                  }}>
                    
                    <div 
                      onClick={() => !isCompleted && markAsCompleted(todo.id)}
                      style={{ cursor: isCompleted ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {isCompleted 
                        ? <CheckCircle2 size={28} color="var(--success)" /> 
                        : <Circle size={28} color="var(--text-light)" />
                      }
                    </div>

                    <div 
                      style={{ flex: 1, cursor: isCompleted ? 'default' : 'pointer' }} 
                      onClick={() => !isCompleted && markAsCompleted(todo.id)}
                    >
                      <h4 style={{ 
                        margin: '0 0 6px 0', 
                        color: 'var(--text-main)', 
                        fontSize: '1rem',
                        textDecoration: isCompleted ? 'line-through' : 'none'
                      }}>
                        {todo.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {getCategoryIcon(todo.category)}
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                          {todo.category}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => deleteTodo(todo.id)}
                      className="icon-btn-danger"
                      style={{ padding: '8px' }}
                      disabled={isCompleted}
                    >
                      <Trash2 size={20} />
                    </button>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <button 
        onClick={() => {
          try { triggerHaptic(ImpactStyle.Light); } catch(e) {}
          setIsModalOpen(true);
        }}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'var(--primary)', color: 'white',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-float)', cursor: 'pointer', zIndex: 100
        }}
      >
        <Plus size={30} strokeWidth={2.5} />
      </button>

      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-card">
            
            <div className="modal-head">
              <h3>New Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="close-btn">
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleAddTodo}>
                
                <div className="input-group">
                  <label>Task Description</label>
                  <input 
                    type="text" 
                    required
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="e.g. Check Extinguishers"
                    autoFocus
                  />
                </div>

                <div className="input-group">
                  <label>Category</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Safety">Safety</option>
                    <option value="Statutory">Statutory</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <button type="submit" className="primary-btn" style={{ marginTop: '20px' }}>
                  Save Task
                </button>

              </form>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default Compliance;