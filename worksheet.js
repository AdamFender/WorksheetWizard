// Worksheet Generator App
// - Generates multiple worksheet templates (math, MCQ, vocab, reading, matching, fill-in)
// - Live preview, theme switching, PDF export, save/load JSON.
// - Single-file front-end (no build step). Works by opening index.html in modern browsers.

// ------------------------- Utilities -------------------------
const $ = (sel) => document.querySelector(sel);
const id = (n) => document.getElementById(n);

function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr; }

// ------------------------- DOM refs -------------------------
const templateSelect = id('templateSelect');
const numQ = id('numQ');
const difficulty = id('difficulty');
const themeSelect = id('themeSelect');
const titleInput = id('titleInput');
const customList = id('customList');

const generateBtn = id('generateBtn');
const exportPdfBtn = id('exportPdfBtn');
const printBtn = id('printBtn');
const worksheetPreview = id('worksheetPreview');

const saveJsonBtn = id('saveJson');
const loadJsonFile = id('loadJsonFile');

// ------------------------- Core state -------------------------
let currentState = {
  template: 'math',
  title: 'Weekly Worksheet',
  theme: 'default',
  settings: { numQ: 8, difficulty: 'medium' },
  customWords: []
};

// ------------------------- Templates (generators) -------------------------
function genMathQuestion(level){
  const op = ['+','-','×','÷'][randInt(0,3)];
  let a,b;
  if(level==='easy'){ a=randInt(1,12); b=randInt(1,12); }
  else if(level==='medium'){ a=randInt(10,99); b=randInt(2,20); }
  else { a=randInt(50,500); b=randInt(10,99); }
  // ensure integer division sometimes
  if(op==='÷'){ b = randInt(2,12); a = b * randInt(1,12); }
  const expr = `${a} ${op} ${b}`;
  let answer;
  try { answer = eval(expr.replace('×','*').replace('÷','/')); }
  catch(e){ answer = ''; }
  return { type:'math', text: `Solve: ${expr}`, answer: String(answer) };
}

function genMCQQuestion(level, customWords=[]){
  // either vocabulary meaning or general knowledge placeholder
  const word = customWords.length ? customWords[randInt(0, customWords.length -1)].trim() : ['planet','river','triangle','democracy','metamorphosis'][randInt(0,4)];
  const correct = `Definition of ${word}`;
  const distractors = [
    `Not related to ${word}`,
    `Opposite of ${word}`,
    `A common misconception about ${word}`,
    `Another meaning for ${word}`
  ];
  const opts = shuffle([correct, ...distractors.slice(0,3)]);
  return { type:'mcq', text:`Choose the correct definition of "${word}"`, options: opts, answer: correct };
}

function genVocabQuestion(level, customWords=[]){
  const word = customWords.length ? customWords[randInt(0, customWords.length -1)].trim() : ['apple','ocean','gravity','freedom'][randInt(0,3)];
  return { type:'vocab', text:`Write the Indonesian meaning of "${word}" and use it in a sentence.`, answer: '' };
}

function genReadingQuestion(level){
  // small sample paragraph + questions
  const passage = `One morning, a young explorer set out to study the valley. She recorded the trees, the river, and the sound of birds. The data helped her class learn about the local ecosystem.`;
  const q1 = { type:'reading', text: 'According to the passage, what did the explorer record?', answer: 'trees, river, birds' };
  const q2 = { type:'reading', text: 'Why was the data important?', answer: 'to learn about the local ecosystem' };
  return { passage, questions:[q1,q2] };
}

function genMatchingQuestion(level){
  const left = ['Cat','Dog','Cow','Bird'];
  const right = ['Meow','Bark','Moo','Chirp'];
  const pairs = shuffle(right).map((r,i)=> ({ left: left[i], right: r }));
  return { type:'matching', pairs };
}

function genFillBlankQuestion(level){
  const sentence = "The quick brown ___ jumps over the lazy ___.";
  const answers = ['fox','dog'];
  return { type:'fillblank', text:sentence, answers };
}

// ------------------------- Render functions -------------------------
function renderSheet(state, container){
  container.innerHTML = '';
  container.className = 'worksheet theme-'+state.theme;

  // Header
  const header = document.createElement('div');
  header.className = 'sheet-header';
  const left = document.createElement('div'); left.className = 'left';
  left.innerHTML = `<h2 class="sheet-title" contenteditable="true">${state.title}</h2>
                    <div class="sheet-meta">Name: ___________________   Class: _______   Date: _______</div>`;
  const right = document.createElement('div');
  right.innerHTML = `<div style="text-align:right"><strong>Grade:</strong> _____<br/><small class="muted">Auto-generated</small></div>`;
  header.appendChild(left); header.appendChild(right);
  container.appendChild(header);

  // Generate questions based on template
  const sectionTitle = document.createElement('div'); sectionTitle.className='section-title';
  sectionTitle.innerHTML = `<h3>Section: ${capitalize(state.template)}</h3>`;
  container.appendChild(sectionTitle);

  const qcount = state.settings.numQ;
  if(state.template === 'reading'){
    // render sample passage and two questions
    const data = genReadingQuestion(state.settings.difficulty);
    const pass = document.createElement('div'); pass.className='question';
    pass.innerHTML = `<strong>Passage</strong><p>${data.passage}</p>`;
    container.appendChild(pass);
    data.questions.forEach((q,i)=>{
      const qdiv = mkQuestionDiv(q, i+1);
      container.appendChild(qdiv);
    });
    return;
  }

  if(state.template === 'matching'){
    const m = genMatchingQuestion(state.settings.difficulty);
    const wrap = document.createElement('div'); wrap.className='question';
    wrap.innerHTML = `<div class="section-title"><h3>Match the columns</h3></div>`;
    const grid = document.createElement('div'); grid.className='match-grid';
    m.pairs.forEach((p, i)=>{
      const leftCell = document.createElement('div'); leftCell.className='match-cell';
      leftCell.innerHTML = `<strong>${String.fromCharCode(65+i)}.</strong> ${p.left}`;
      const rightCell = document.createElement('div'); rightCell.className='match-cell';
      rightCell.innerHTML = `<span>${i+1}.</span> ${p.right}`;
      grid.appendChild(leftCell); grid.appendChild(rightCell);
    });
    wrap.appendChild(grid);
    container.appendChild(wrap);
    return;
  }

  // Generic question templates
  for(let i=0;i<qcount;i++){
    let q;
    switch(state.template){
      case 'math': q = genMathQuestion(state.settings.difficulty); break;
      case 'mcq': q = genMCQQuestion(state.settings.difficulty, state.customWords); break;
      case 'vocab': q = genVocabQuestion(state.settings.difficulty, state.customWords); break;
      case 'fillblank': q = genFillBlankQuestion(state.settings.difficulty); break;
      default: q = genMathQuestion(state.settings.difficulty);
    }
    const qDiv = mkQuestionDiv(q, i+1);
    container.appendChild(qDiv);
  }
}

function mkQuestionDiv(q, qnum){
  const el = document.createElement('div');
  el.className = 'question';
  el.dataset.type = q.type;
  // make content editable for teacher tweaks
  if(q.type === 'math'){
    el.innerHTML = `<div class="qrow"><div class="qnum">${qnum}.</div>
      <div contenteditable="true">${escapeHtml(q.text)}</div></div>
      <div class="muted small">Answer: <span class="blank-line" contenteditable="true">${escapeHtml(q.answer || '')}</span></div>`;
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
  } else if(q.type === 'reading'){
    el.innerHTML = `<div class="qrow"><div class="qnum">${qnum}.</div>
      <div contenteditable="true">${escapeHtml(q.text)}</div></div>
      <div class="muted small">Answer: <span class="blank-line" contenteditable="true">${escapeHtml(q.answer || '')}</span></div>`;
  } else {
    el.textContent = JSON.stringify(q);
  }

  // Allow clicking to edit (inline is enabled via contenteditable)
  el.addEventListener('click', (e)=> {
    // clicking inside contenteditable is fine; don't do anything special
  });
  return el;
}

// ------------------------- Helpers -------------------------
function capitalize(s){ return s.slice(0,1).toUpperCase()+s.slice(1); }
function escapeHtml(s=''){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

// ------------------------- Actions -------------------------
function updateStateFromUI(){
  currentState.template = templateSelect.value;
  currentState.title = titleInput.value || 'Worksheet';
  currentState.theme = themeSelect.value;
  currentState.settings.numQ = Math.max(1, Math.min(40, parseInt(numQ.value)||8));
  currentState.settings.difficulty = difficulty.value;
  currentState.customWords = customList.value.split(',').map(x=>x.trim()).filter(Boolean);
}

generateBtn.addEventListener('click', ()=>{
  updateStateFromUI();
  applyTheme(currentState.theme);
  renderSheet(currentState, worksheetPreview);
});

themeSelect.addEventListener('change', ()=>{
  currentState.theme = themeSelect.value;
  applyTheme(currentState.theme);
  // re-render so theme class applies to worksheet
  renderSheet(currentState, worksheetPreview);
});

exportPdfBtn.addEventListener('click', ()=>{
  // tidy up editor toolbars for PDF
  const element = worksheetPreview;
  // options: quality + margins
  const opt = {
    margin:       10,
    filename:     `${(titleInput.value||'worksheet').replace(/\s+/g,'_')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS:true },
    jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
});

printBtn.addEventListener('click', ()=>{ window.print(); });

// Save JSON (state + HTML content)
saveJsonBtn.addEventListener('click', ()=>{
  // capture current DOM as HTML for saving (teachers might edit)
  const payload = {
    meta: {...currentState, title: titleInput.value},
    html: worksheetPreview.innerHTML
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'worksheet.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

// Load JSON: replace preview & state
loadJsonFile.addEventListener('change', (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result);
      if(d.meta) {
        currentState = {...currentState, ...d.meta};
        // apply UI
        templateSelect.value = currentState.template;
        titleInput.value = currentState.title;
        themeSelect.value = currentState.theme;
        numQ.value = currentState.settings.numQ;
        difficulty.value = currentState.settings.difficulty;
        customList.value = (currentState.customWords || []).join(', ');
        applyTheme(currentState.theme);
      }
      if(d.html) worksheetPreview.innerHTML = d.html;
    } catch(err){
      alert('Invalid JSON file');
    }
  };
  reader.readAsText(f);
});

// Apply theme by swapping class on root worksheet element
function applyTheme(themeName){
  // available theme classes: default, chalk, pastel, mono
  worksheetPreview.classList.remove('theme-default','theme-chalk','theme-pastel','theme-mono');
  worksheetPreview.classList.add('theme-'+themeName);
  document.documentElement.classList.remove('theme-default','theme-chalk','theme-pastel','theme-mono');
  document.documentElement.classList.add('theme-'+themeName);
}

// init
(function init(){
  // set UI to defaults
  templateSelect.value = currentState.template;
  numQ.value = currentState.settings.numQ;
  difficulty.value = currentState.settings.difficulty;
  themeSelect.value = currentState.theme;
  titleInput.value = currentState.title;
  applyTheme(currentState.theme);
  renderSheet(currentState, worksheetPreview);

  // small UX: regenerate on Enter when editing custom words
  customList.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ generateBtn.click(); e.preventDefault(); }});
})();