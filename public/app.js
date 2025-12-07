// Advanced Worksheet Generator — public/app.js
// No bundler required. Uses html2pdf, PapaParse, and QRious via CDN.

// ---------- Helpers ----------
const $ = (s) => document.querySelector(s);
const id = (n) => document.getElementById(n);
function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]] } return arr; }
function escapeHtml(s=''){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function capitalize(s=''){ return s.slice(0,1).toUpperCase()+s.slice(1); }

// ---------- DOM refs ----------
const templateSelect = id('templateSelect');
const numQ = id('numQ');
const difficulty = id('difficulty');
const themeSelect = id('themeSelect');
const titleInput = id('titleInput');
const customList = id('customList');
const csvFile = id('csvFile');

const generateBtn = id('generateBtn');
const exportPdfBtn = id('exportPdfBtn');
const printBtn = id('printBtn');
const worksheetPreview = id('worksheetPreview');

const saveJsonBtn = id('saveJson');
const loadBtn = id('loadBtn');
const loadId = id('loadId');

const toggleKeyBtn = id('toggleKey');
const answerKeyEl = id('answerKey');
const answerList = id('answerList');
const printKey = id('printKey');
const downloadKey = id('downloadKey');

const copyHtmlBtn = id('copyHtml');

const qrCanvas = id('qrCanvas');

// ---------- State ----------
let currentState = {
  template: 'math',
  title: 'Weekly Worksheet',
  theme: 'default',
  settings: { numQ: 10, difficulty: 'medium' },
  customWords: [],
  questions: [],
  answers: {}
};

// ---------- Generators ----------
function genMathQuestion(level){
  const ops = ['+','-','×','÷'];
  const op = ops[randInt(0, ops.length-1)];
  let a,b;
  if(level==='easy'){ a=randInt(1,12); b=randInt(1,12); }
  else if(level==='medium'){ a=randInt(10,99); b=randInt(2,20); }
  else { a=randInt(50,500); b=randInt(10,99); }
  if(op==='÷'){ b = randInt(2,12); a = b * randInt(1,12); }
  const expr = `${a} ${op} ${b}`;
  const answer = String(eval(expr.replace('×','*').replace('÷','/')));
  return { type:'math', text:`Solve: ${expr}`, answer };
}

function genMCQQuestion(level, customWords=[]){
  const word = customWords.length ? customWords[randInt(0, customWords.length-1)] : ['planet','river','triangle','democracy','metamorphosis'][randInt(0,4)];
  const correct = `Definition of ${word}`;
  const distractors = [
    `Not related to ${word}`,
    `Opposite of ${word}`,
    `A common misconception about ${word}`,
    `Another meaning for ${word}`
  ];
  const options = shuffle([correct, ...distractors.slice(0,3)]);
  return { type:'mcq', text:`Choose the correct definition of "${word}"`, options, answer: correct };
}

function genVocabQuestion(level, customWords=[]){
  const word = customWords.length ? customWords[randInt(0, customWords.length-1)] : ['apple','ocean','gravity','freedom'][randInt(0,3)];
  const prompt = `Write the meaning of "${word}" and use it in a sentence.`;
  return { type:'vocab', text: prompt, answer: '' , word };
}

function genMatchingQuestion(level){
  const left = ['Cat','Dog','Cow','Bird'];
  const right = ['Meow','Bark','Moo','Chirp'];
  const pairs = left.map((l,i)=>({left:l, right:right[i]}));
  return { type:'matching', pairs: shuffle(pairs) };
}

function genReadingQuestion(level){
  const passage = `One morning, an explorer set out to study the valley. She recorded the trees, the river, and the sound of birds. The data helped her class learn about the local ecosystem.`;
  const qs = [
    { text: 'What did the explorer record?', answer: 'trees, river, birds' },
    { text: 'Why was the data important?', answer: 'to learn about the local ecosystem' }
  ];
  return { type:'reading', passage, questions: qs };
}

function genFillBlankQuestion(level){
  const sentence = "The quick brown ___ jumps over the lazy ___.";
  const answers = ['fox','dog'];
  return { type:'fillblank', text: sentence, answers };
}

// ---------- Rendering ----------
function renderSheet(state){
  worksheetPreview.innerHTML = '';
  worksheetPreview.className = 'worksheet theme-'+state.theme;

  // header
  const header = document.createElement('div');
  header.className = 'sheet-header';
  const left = document.createElement('div'); left.className = 'left';
  left.innerHTML = `<h2 class="sheet-title" contenteditable="true">${escapeHtml(state.title)}</h2>
                    <div class="sheet-meta">Name: ___________________   Class: _______   Date: _______</div>`;
  const right = document.createElement('div');
  right.innerHTML = `<div style="text-align:right"><strong>Grade:</strong> _____<br/><small class="muted">Auto-generated</small></div>`;
  header.appendChild(left); header.appendChild(right);
  worksheetPreview.appendChild(header);

  // Section title
  const sectionTitle = document.createElement('div'); sectionTitle.className='section-title';
  sectionTitle.innerHTML = `<h3>Section: ${capitalize(state.template)}</h3>`;
  worksheetPreview.appendChild(sectionTitle);

  // If reading template
  if(state.template === 'reading'){
    const r = genReadingQuestion(state.settings.difficulty);
    const pass = document.createElement('div'); pass.className='question';
    pass.innerHTML = `<strong>Passage</strong><p>${escapeHtml(r.passage)}</p>`;
    worksheetPreview.appendChild(pass);
    r.questions.forEach((q,i) => {
      const div = mkQDiv({type:'reading', text:q.text, answer:q.answer}, i+1);
      worksheetPreview.appendChild(div);
      state.answers[`q${i+1}`] = q.answer;
    });
    updateAnswerKey();
    return;
  }

  if(state.template === 'matching'){
    const m = genMatchingQuestion(state.settings.difficulty);
    const wrap = document.createElement('div'); wrap.className='question';
    wrap.innerHTML = `<div class="section-title"><h3>Match the columns</h3></div>`;
    const grid = document.createElement('div'); grid.className='match-grid';
    // create right column labels then shuffle
    const shuffledRight = shuffle(m.pairs.map(p => p.right));
    m.pairs.forEach((p,i)=>{
      const leftCell = document.createElement('div'); leftCell.className='match-cell';
      leftCell.innerHTML = `<strong>${String.fromCharCode(65+i)}.</strong> ${escapeHtml(p.left)}`;
      const rightCell = document.createElement('div'); rightCell.className='match-cell';
      rightCell.innerHTML = `<span>${i+1}.</span> ${escapeHtml(shuffledRight[i])}`;
      grid.appendChild(leftCell); grid.appendChild(rightCell);
      state.answers[`match-${i}`] = { left: p.left, right: p.right }; // store actual pair for key
    });
    wrap.appendChild(grid);
    worksheetPreview.appendChild(wrap);
    updateAnswerKey();
    return;
  }

  // Generic templates loop
  const qcount = state.settings.numQ;
  state.questions = [];
  state.answers = {};
  for(let i=0;i<qcount;i++){
    let q;
    switch(state.template){
      case 'math': q = genMathQuestion(state.settings.difficulty); break;
      case 'mcq': q = genMCQQuestion(state.settings.difficulty, state.customWords); break;
      case 'vocab': q = genVocabQuestion(state.settings.difficulty, state.customWords); break;
      case 'fillblank': q = genFillBlankQuestion(state.settings.difficulty); break;
      default: q = genMathQuestion(state.settings.difficulty);
    }
    state.questions.push(q);
    const qDiv = mkQDiv(q, i+1);
    worksheetPreview.appendChild(qDiv);
    if(q.type === 'math' || q.type === 'mcq' || q.type === 'reading' || q.type === 'fillblank'){
      state.answers[`q${i+1}`] = q.answer || (q.answers ? q.answers : '');
    } else if(q.type === 'vocab'){
      state.answers[`q${i+1}`] = q.word || '';
    }
  }
  updateAnswerKey();
}

function mkQDiv(q, qnum){
  const el = document.createElement('div');
  el.className = 'question';
  el.dataset.type = q.type;
  if(q.type === 'math'){
    el.innerHTML = `<div class="qrow"><div class="qnum">${qnum}.</div>
      <div contenteditable="true">${escapeHtml(q.text)}</div></div>
      <div class="muted small">Answer: <span class="blank-line" contenteditable="true">${escapeHtml(q.answer)}</span></div>`;
  } else if(q.type === 'mcq'){
    const optsHtml = q.options.map((o, idx)=>`<label class="option"><input type="radio" name="q${qnum}"> <span contenteditable="true">${escapeHtml(o)}</span></label>`).join('');
    el.innerHTML = `<div class="qrow"><div class="qnum">${qnum}.</div>
      <div contenteditable="true">${escapeHtml(q.text)}</div></div>
      <div class="options">${optsHtml}</div>`;
  } else if(q.type === 'vocab'){
    el.innerHTML = `<div class="qrow"><div class="qnum">${qnum}.</div>
      <div contenteditable="true">${escapeHtml(q.text)}</div></div>
      <div style="margin-top:10px"><em>Answer area:</em><div class="blank-line" contenteditable="true"></div></div>`;
  } else if(q.type === 'fillblank'){
    el.innerHTML = `<div class="qrow"><div class="qnum">${qnum}.</div>
      <div contenteditable="true">${escapeHtml(q.text)}</div></div>
      <div class="muted small">Words: <span class="blank-line" contenteditable="true">${escapeHtml((q.answers||[]).join(', '))}</span></div>`;
  } else {
    el.textContent = JSON.stringify(q);
  }
  return el;
}

// ---------- Answer key UI ----------
function updateAnswerKey(){
  answerList.innerHTML = '';
  const keys = Object.keys(currentState.answers);
  if(keys.length === 0){
    answerList.innerHTML = `<em>No answers generated yet. Click Generate.</em>`;
    return;
  }
  for(const k of keys){
    const val = currentState.answers[k];
    const li = document.createElement('div');
    li.className = 'key-row';
    if(typeof val === 'object'){
      li.innerHTML = `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(JSON.stringify(val))}`;
    } else {
      li.innerHTML = `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(val))}`;
    }
    answerList.appendChild(li);
  }
}

// ---------- Actions ----------
function updateStateFromUI(){
  currentState.template = templateSelect.value;
  currentState.title = titleInput.value || 'Worksheet';
  currentState.theme = themeSelect.value;
  currentState.settings.numQ = Math.max(1, Math.min(50, parseInt(numQ.value) || 10));
  currentState.settings.difficulty = difficulty.value;
  currentState.customWords = customList.value.split(',').map(x=>x.trim()).filter(Boolean);
}

generateBtn.addEventListener('click', ()=>{
  updateStateFromUI();
  applyTheme(currentState.theme);
  renderSheet(currentState);
  generateQr();
});

themeSelect.addEventListener('change', ()=>{
  currentState.theme = themeSelect.value;
  applyTheme(currentState.theme);
  renderSheet(currentState);
});

// Export PDF (client-side)
exportPdfBtn.addEventListener('click', ()=>{
  // remove interactive elements for PDF (only basic approach)
  const clone = worksheetPreview.cloneNode(true);
  // hide radio inputs for a clean PDF (they draw okay, but we remove)
  clone.querySelectorAll('input[type="radio"]').forEach(i=>i.remove());
  const opt = {
    margin:       10,
    filename:     `${(titleInput.value||'worksheet').replace(/\s+/g,'_')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS:true },
    jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(clone).save();
});

printBtn.addEventListener('click', ()=> window.print());

// Save to server
saveJsonBtn.addEventListener('click', async ()=>{
  // capture current DOM for saving (teachers might edit inline)
  const payload = {
    meta: { ...currentState, title: titleInput.value },
    html: worksheetPreview.innerHTML
  };
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if(j.ok){
      alert(`Saved! ID: ${j.id}`);
      loadId.value = j.id;
      generateQr(); // update QR
    } else {
      alert('Save failed');
    }
  } catch(err){
    alert('Save failed: '+err.message);
  }
});

// Load by id
loadBtn.addEventListener('click', async ()=>{
  const idv = loadId.value.trim();
  if(!idv){ alert('Enter id to load'); return; }
  try {
    const res = await fetch(`/api/load/${encodeURIComponent(idv)}`);
    if(!res.ok){ alert('Load failed'); return; }
    const data = await res.json();
    if(data.meta){
      currentState = {...currentState, ...data.meta};
      // apply UI
      templateSelect.value = currentState.template;
      titleInput.value = currentState.title;
      themeSelect.value = currentState.theme;
      numQ.value = currentState.settings.numQ;
      difficulty.value = currentState.settings.difficulty;
      customList.value = (currentState.customWords||[]).join(', ');
      applyTheme(currentState.theme);
    }
    if(data.html){
      worksheetPreview.innerHTML = data.html;
      // Attempt to extract answers from loaded payload (if present)
      if(data.meta && data.meta.answers) currentState.answers = data.meta.answers;
      else currentState.answers = {};
      updateAnswerKey();
    }
    alert('Loaded!');
  } catch(err){
    alert('Load error: '+err.message);
  }
});

// Toggle answer key panel
toggleKeyBtn.addEventListener('click', ()=>{
  const visible = answerKeyEl.getAttribute('aria-hidden') === 'false';
  answerKeyEl.setAttribute('aria-hidden', String(visible ? 'true' : 'false'));
  answerKeyEl.style.display = visible ? 'none' : 'block';
});

// Print & download key
printKey.addEventListener('click', ()=>{
  const newWin = window.open('', '_blank');
  newWin.document.write(`<pre>${escapeHtml(JSON.stringify(currentState.answers, null, 2))}</pre>`);
  newWin.print();
});
downloadKey.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(currentState.answers, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'answer-key.json';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// Copy HTML to clipboard
copyHtmlBtn.addEventListener('click', async ()=>{
  try{
    await navigator.clipboard.writeText(worksheetPreview.innerHTML);
    alert('Preview HTML copied to clipboard');
  }catch(e){ alert('Copy failed: '+e.message); }
});

// CSV import (single-column)
csvFile.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  Papa.parse(f, {
    complete: (results) => {
      const words = results.data.flat().map(x=>String(x||'').trim()).filter(Boolean);
      customList.value = words.join(', ');
      alert('CSV imported: '+words.length+' words');
    },
    error: (err)=> alert('CSV parse error: '+err.message)
  });
});

// QR generation for current site + optional id
function generateQr(){
  const text = loadId.value.trim() ? `${location.origin}/data/${loadId.value}.json` : location.href;
  const qr = new QRious({ element: qrCanvas, value: text, size: 150 });
}

// Theme application
function applyTheme(name){
  document.documentElement.classList.remove('theme-default','theme-chalk','theme-pastel','theme-mono');
  document.documentElement.classList.add('theme-'+name);
  worksheetPreview.classList.remove('theme-default','theme-chalk','theme-pastel','theme-mono');
  worksheetPreview.classList.add('theme-'+name);
}

// init
(function init(){
  templateSelect.value = currentState.template;
  numQ.value = currentState.settings.numQ;
  difficulty.value = currentState.settings.difficulty;
  themeSelect.value = currentState.theme;
  titleInput.value = currentState.title;
  applyTheme(currentState.theme);
  renderSheet(currentState);
  answerKeyEl.style.display = 'none';
  generateQr();
})();