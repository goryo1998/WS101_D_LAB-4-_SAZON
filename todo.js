    const API_BASE = '/api/todos';
    const appEl = document.getElementById('app');
    const statusEl = document.getElementById('status');
    const todoListEl = document.getElementById('todoList');
    const countEl = document.getElementById('count');
    const addForm = document.getElementById('addForm');
    const newTodoInput = document.getElementById('newTodo');
    const filterEl = document.getElementById('filter');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const syncBtn = document.getElementById('syncNow');

    let todos = []; // local copy
    let online = true; // whether server comms appear to work

    // --- helper: show status ---
    function setStatus(text, short=false){ statusEl.textContent = text; }

    // --- storage fallback ---
    const LOCAL_KEY = 'todo_app_localcopy_v1';
    function saveLocal(){ localStorage.setItem(LOCAL_KEY, JSON.stringify(todos)); }
    function loadLocal(){ try{ todos = JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; }catch(e){ todos = []; } }

    // --- rendering ---
    function render(){
      const filter = filterEl.value;
      const items = todos.filter(t => {
        if(filter==='all') return true;
        if(filter==='active') return !t.completed;
        return t.completed;
      });
      todoListEl.innerHTML = '';
      for(const t of items){
        const li = document.createElement('li'); li.className = 'todo';
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!t.completed;
        cb.addEventListener('change', ()=> toggleComplete(t.id, cb.checked));
        const title = document.createElement('div'); title.className = 'title' + (t.completed ? ' completed' : '');
        title.textContent = t.title;
        title.contentEditable = false;
        title.addEventListener('dblclick', ()=> enableEdit(title, t));

        const actions = document.createElement('div'); actions.className='actions';
        const editBtn = document.createElement('button'); editBtn.className='icon-btn'; editBtn.textContent='Edit';
        editBtn.addEventListener('click', ()=> enableEdit(title, t));
        const delBtn = document.createElement('button'); delBtn.className='icon-btn'; delBtn.textContent='Delete';
        delBtn.addEventListener('click', ()=> removeTodo(t.id));

        actions.append(editBtn, delBtn);
        li.append(cb, title, actions);
        todoListEl.appendChild(li);
      }
      const remaining = todos.filter(t=>!t.completed).length;
      countEl.textContent = `${remaining} item${remaining!==1 ? 's' : ''} left`;
    }

    function enableEdit(titleEl, todo){
      titleEl.contentEditable = true; titleEl.focus();
      const range = document.createRange(); range.selectNodeContents(titleEl);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      function finish(){
        titleEl.contentEditable = false;
        const newText = titleEl.textContent.trim() || 'Untitled';
        if(newText !== todo.title) updateTodo(todo.id, {title:newText});
        titleEl.removeEventListener('blur', finish);
        titleEl.removeEventListener('keydown', onKey);
      }
      function onKey(e){ if(e.key==='Enter'){ e.preventDefault(); titleEl.blur(); } }
      titleEl.addEventListener('blur', finish);
      titleEl.addEventListener('keydown', onKey);
    }

    // --- CRUD operations (use fetch, fallback to local) ---
    async function fetchTodos(){
      try{
        const res = await fetch(API_BASE);
        if(!res.ok) throw new Error('Network response not ok');
        const data = await res.json();
        todos = data;
        online = true; setStatus('Online');
        saveLocal(); render();
      }catch(err){
        // fallback
        online = false; setStatus('Offline — using local data');
        loadLocal(); render();
      }
    }

    async function createTodo(title){
      const tempId = 'tmp-' + Date.now();
      const todo = { id: tempId, title, completed:false };
      todos.push(todo); render(); saveLocal();
      try{
        const res = await fetch(API_BASE, {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify({title})});
        if(!res.ok) throw new Error('Post failed');
        const created = await res.json();
        // replace temp id
        todos = todos.map(t => t.id===tempId ? created : t);
        online = true; setStatus('Online'); saveLocal(); render();
      }catch(e){
        online = false; setStatus('Offline — saved locally'); saveLocal(); render();
      }
    }

    async function updateTodo(id, changes){
      // optimistic update locally
      todos = todos.map(t => t.id===id ? Object.assign({}, t, changes) : t);
      render(); saveLocal();
      if(String(id).startsWith('tmp-')) return; // can't sync temp items
      try{
        const res = await fetch(`${API_BASE}/${id}`, {method:'PUT',headers:{'Content-Type':'application/json'}, body: JSON.stringify(changes)});
        if(!res.ok) throw new Error('Update failed');
        const updated = await res.json();
        todos = todos.map(t=> t.id===id ? updated : t);
        online=true; setStatus('Online'); saveLocal(); render();
      }catch(e){ online=false; setStatus('Offline — changes saved locally'); saveLocal(); }
    }

    async function removeTodo(id){
      const prev = todos.slice();
      todos = todos.filter(t=>t.id!==id); render(); saveLocal();
      if(String(id).startsWith('tmp-')) return;
      try{
        const res = await fetch(`${API_BASE}/${id}`, {method:'DELETE'});
        if(res.status===204 || res.ok){ online=true; setStatus('Online'); saveLocal(); }
        else throw new Error('Delete failed');
      }catch(e){ todos = prev; render(); saveLocal(); setStatus('Offline — could not delete on server'); }
    }

    function toggleComplete(id, checked){ updateTodo(id, {completed: !!checked}); }

    // clear completed locally + on server when possible
    async function clearCompleted(){
      const completed = todos.filter(t=>t.completed).map(t=>t.id);
      if(completed.length===0) return;
      const prev = todos.slice();
      todos = todos.filter(t=>!t.completed); render(); saveLocal();
      try{
        // attempt to delete each on server (parallel)
        await Promise.all(completed.filter(id => !String(id).startsWith('tmp-')).map(id=>fetch(`${API_BASE}/${id}`,{method:'DELETE'})) );
        setStatus('Online'); online=true; saveLocal();
      }catch(e){ todos = prev; render(); saveLocal(); setStatus('Offline — clear failed'); }
    }

    // --- event listeners ---
    addForm.addEventListener('submit', e=>{ e.preventDefault(); const v=newTodoInput.value.trim(); if(!v) return; createTodo(v); newTodoInput.value=''; });
    filterEl.addEventListener('change', ()=> render());
    clearCompletedBtn.addEventListener('click', ()=> clearCompleted());
    syncBtn.addEventListener('click', ()=> fetchTodos());

    // initial load
    fetchTodos();

    // periodically try to sync in background (graceful, every 25s)
    setInterval(()=>{ if(!online) fetchTodos(); }, 25_000);