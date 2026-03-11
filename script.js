const firebaseConfig = {
  apiKey: "AIzaSyDZdX1HXdh61Mnq6nxM97ONLoUZ4p24Ke4",
  authDomain: "ficha-de-dnd.firebaseapp.com",
  projectId: "ficha-de-dnd",
  storageBucket: "ficha-de-dnd.firebasestorage.app",
  messagingSenderId: "1029118209470",
  appId: "1:1029118209470:web:4c4f80535e33bb30579def"
};

let db = null;
let isFirebaseReady = false;

let currentMesaId = '';
document.getElementById('mesa-id').value = currentMesaId;

let unlockedChars = new Set();
const MASTER_PASSWORD = "Ben10";

function initFirebase() {
  try {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      isFirebaseReady = true;
      document.getElementById('db-status').classList.add('online');
      
      loadFromCloud(); 
  } catch(e) { console.error("Erro ao inicializar Firebase:", e); }
}

function changeMesaId(newId) {
  currentMesaId = newId.trim();
  loadFromCloud();
}

async function loadFromCloud() {
  if (!isFirebaseReady || !db) return;
  
  if (currentMesaId === '') {
      party = [emptyCharData("Sem Nome")];
      activeCharId = party[0].id;
      fullUIRefresh();
      return; 
  }

  document.getElementById('db-status').classList.add('syncing');
  try {
      const doc = await db.collection("fichas").doc(currentMesaId).get();
      if (doc.exists) {
          let cloudData = doc.data().party;
          if(cloudData && Array.isArray(cloudData)) {
              party = cloudData;
              runFallbackChecks();
              activeCharId = party[0].id;
              fullUIRefresh();
          }
      } else {
          party = [emptyCharData("Sem Nome")];
          activeCharId = party[0].id;
          fullUIRefresh();
          saveData(); 
      }
  } catch(e) { console.error("Erro ao puxar da nuvem:", e); }
  setTimeout(() => document.getElementById('db-status').classList.remove('syncing'), 500);
}

const DND_ATTRIBUTES = {
  str: { name: 'FORÇA', skills: [{id: 'salva_str', name: 'Salvaguarda'}, {id: 'atletismo', name: 'Atletismo'}] },
  dex: { name: 'DESTREZA', skills: [{id: 'salva_dex', name: 'Salvaguarda'}, {id: 'acrobacia', name: 'Acrobacia'}, {id: 'furtividade', name: 'Furtividade'}, {id: 'prestidigitacao', name: 'Prestidigitação'}] },
  con: { name: 'CONSTITUIÇÃO', skills: [{id: 'salva_con', name: 'Salvaguarda'}] },
  int: { name: 'INTELIGÊNCIA', skills: [{id: 'salva_int', name: 'Salvaguarda'}, {id: 'arcanismo', name: 'Arcanismo'}, {id: 'historia', name: 'História'}, {id: 'investigacao', name: 'Investigação'}, {id: 'natureza', name: 'Natureza'}, {id: 'religiao', name: 'Religião'}] },
  wis: { name: 'SABEDORIA', skills: [{id: 'salva_wis', name: 'Salvaguarda'}, {id: 'intuicao', name: 'Intuição'}, {id: 'lidar_animais', name: 'Lidar com Animais'}, {id: 'medicina', name: 'Medicina'}, {id: 'percepcao', name: 'Percepção'}, {id: 'sobrevivencia', name: 'Sobrevivência'}] },
  cha: { name: 'CARISMA', skills: [{id: 'salva_cha', name: 'Salvaguarda'}, {id: 'atuacao', name: 'Atuação'}, {id: 'enganacao', name: 'Enganação'}, {id: 'intimidacao', name: 'Intimidação'}, {id: 'persuasao', name: 'Persuasão'}] }
};

const emptyCharData = (name) => ({
  id: Date.now(),
  name: name,
  password: "", 
  info: { classLevel: "", background: "", playerName: "", race: "", alignment: "", xp: "", image: "", factionImage: "", inspiration: "", age: "", size: "Médio", height: "", weight: "", eyes: "", skin: "", hair: "", type: "" },
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  skills: {}, 
  skillBonuses: {},
  combat: { ac: "", acBonus: "", speed: "9m", maxHp: "", currentHp: "", tempHp: "", initBonus: 0, hitDiceTotal: "", hitDiceCurrent: "", deathSaves: { successes: [false, false, false], failures: [false, false, false] } },
  textBlocks: { traits: "", ideals: "", bonds: "", flaws: "", appearanceText: "", backstory: "", allies: "", factionName: "", additionalFeatures: "", treasure: "" },
  attacks: [], equipmentList: [], armorList: [], featureList: [], languages: [], proficiencies: [],
  coins: { pl: 0, po: 0, pe: 0, pp: 0, pc: 0, fl: 0 },
  extraWeight: 0,
  spellsInfo: { class: "", ability: "" },
  spellSlots: { 1: { total: 0, exp: 0 }, 2: { total: 0, exp: 0 }, 3: { total: 0, exp: 0 }, 4: { total: 0, exp: 0 }, 5: { total: 0, exp: 0 }, 6: { total: 0, exp: 0 }, 7: { total: 0, exp: 0 }, 8: { total: 0, exp: 0 }, 9: { total: 0, exp: 0 } },
  spells: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [] }
});

let party = [];
let activeCharId = null;

function runFallbackChecks() {
  party.forEach(char => {
      if (typeof char.password === 'undefined') char.password = "";
      if (!char.info) char.info = {}; const defInfo = emptyCharData().info; for(let k in defInfo) if (typeof char.info[k] === 'undefined') char.info[k] = defInfo[k];
      if (!char.combat) char.combat = {}; const defCombat = emptyCharData().combat; for(let k in defCombat) if (typeof char.combat[k] === 'undefined') char.combat[k] = defCombat[k];
      if (!char.textBlocks) char.textBlocks = {}; const defTexts = emptyCharData().textBlocks; for(let k in defTexts) if (typeof char.textBlocks[k] === 'undefined') char.textBlocks[k] = defTexts[k];
      if (!char.stats) char.stats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      if (!char.skills) char.skills = {}; if (!char.skillBonuses) char.skillBonuses = {};
      if (!char.coins) char.coins = { pl: 0, po: 0, pe: 0, pp: 0, pc: 0, fl: 0 };
      if (typeof char.extraWeight === 'undefined') char.extraWeight = 0; if (!char.attacks) char.attacks = []; if (!char.equipmentList) char.equipmentList = []; if (!char.armorList) char.armorList = []; if (!char.featureList) char.featureList = [];
      if (!char.languages) char.languages = []; if (!char.proficiencies) char.proficiencies = [];
      if (!char.spellsInfo) char.spellsInfo = { class: "", ability: "" };
      if (!char.spellSlots) char.spellSlots = { 1:{total:0,exp:0}, 2:{total:0,exp:0}, 3:{total:0,exp:0}, 4:{total:0,exp:0}, 5:{total:0,exp:0}, 6:{total:0,exp:0}, 7:{total:0,exp:0}, 8:{total:0,exp:0}, 9:{total:0,exp:0} };
      if (!char.spells) char.spells = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[], 9:[] };
      if (!char.combat.acBonus) char.combat.acBonus = "";
      char.armorList.forEach(a => { if(typeof a.acBase === 'undefined') { a.acBase = a.isShield ? 2 : 10; a.acType = a.isShield ? 'escudo' : 'leve'; } });
  });
}

function fullUIRefresh() {
  renderTabs();
  renderAttributesHTML();
  updateUI();
  renderDynamicLists();
  renderSpellsHTML();
  applyLockState(); 
}

function init() {
  party = [emptyCharData("Sem Nome")];
  activeCharId = party[0].id;
  
  fullUIRefresh();
  initFirebase(); 
}

function saveData() {
  try { localStorage.setItem('dnd_sheet_coins_v1', JSON.stringify(party)); } catch(e) {}
  
  if (isFirebaseReady && db && currentMesaId !== '') {
      document.getElementById('db-status').classList.add('syncing');
      db.collection('fichas').doc(currentMesaId).set({ party: party })
        .then(() => { setTimeout(() => document.getElementById('db-status').classList.remove('syncing'), 300); })
        .catch(error => { document.getElementById('db-status').classList.remove('syncing'); document.getElementById('db-status').classList.remove('online'); });
  }
}

function getActiveChar() { return party.find(c => c.id === activeCharId); }

function switchPage(pageNumber) {
    document.getElementById('page-1').style.display = pageNumber === 1 ? 'grid' : 'none';
    document.getElementById('page-2').style.display = pageNumber === 2 ? 'flex' : 'none';
    document.getElementById('page-3').style.display = pageNumber === 3 ? 'flex' : 'none';
    document.getElementById('nav-btn-1').classList.toggle('active', pageNumber === 1);
    document.getElementById('nav-btn-2').classList.toggle('active', pageNumber === 2);
    document.getElementById('nav-btn-3').classList.toggle('active', pageNumber === 3);
}

function renderTabs() {
  const container = document.getElementById('tabs-container');
  container.innerHTML = '';
  party.forEach(char => {
    const btn = document.createElement('button');
    btn.className = `char-tab ${char.id === activeCharId ? 'active' : ''}`;
    btn.innerText = char.name;
    btn.onclick = () => { activeCharId = char.id; fullUIRefresh(); };
    container.appendChild(btn);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'char-tab char-tab-add';
  addBtn.innerText = '➕ Novo';
  addBtn.onclick = () => createCharacter();
  container.appendChild(addBtn);
}

function handlePasswordAction() {
    const char = getActiveChar();
    if (!char.password) {
        let newPass = prompt("Defina uma senha para proteger esta ficha de edições acidentais:");
        if (newPass && newPass.trim() !== "") {
            char.password = newPass.trim();
            unlockedChars.add(char.id);
            saveData();
            applyLockState();
            alert("Senha definida! Sua ficha está segura (feche ou recarregue a aba para trancá-la).");
        }
    } else if (!unlockedChars.has(char.id)) {
        let pass = prompt("Ficha trancada. Digite a senha para editar:");
        if (pass === char.password || pass === MASTER_PASSWORD) {
            unlockedChars.add(char.id);
            applyLockState();
        } else if (pass !== null) {
            alert("Senha Incorreta!");
        }
    }
}

function changePassword() {
    const char = getActiveChar();
    if (!char.password) return;

    let pass = prompt("Para redefinir, digite a senha ATUAL (ou a Senha Mestre):");
    if (pass === char.password || pass === MASTER_PASSWORD) {
        let newPass = prompt("Digite a NOVA senha (ou deixe em branco para remover a proteção):");
        if (newPass !== null) {
            char.password = newPass.trim();
            saveData();
            applyLockState();
            alert("Sua senha foi atualizada com sucesso!");
        }
    } else if (pass !== null) {
        alert("Senha Incorreta!");
    }
}

function lockCurrentChar() {
    const char = getActiveChar();
    unlockedChars.delete(char.id);
    applyLockState();
}

function applyLockState() {
    const char = getActiveChar();
    if (!char) return;

    const isLocked = char.password && !unlockedChars.has(char.id);
    const actionContainer = document.getElementById('char-action-buttons');
    
    let lockHtml = "";
    if (!char.password) {
        lockHtml = `<button class="btn btn-outline" style="color:var(--info); border-color:var(--info); font-size:11px; padding: 4px 8px;" onclick="handlePasswordAction()">🔑 Definir Senha</button>`;
    } else if (isLocked) {
        lockHtml = `<button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger); font-size:11px; padding: 4px 8px;" onclick="handlePasswordAction()">🔒 Desbloquear</button>`;
    } else {
        lockHtml = `
            <button class="btn btn-outline" style="color:var(--warning); border-color:var(--warning); font-size:11px; padding: 4px 8px;" onclick="changePassword()">🔑 Mudar Senha</button>
            <button class="btn btn-outline" style="color:var(--success); border-color:var(--success); font-size:11px; padding: 4px 8px;" onclick="lockCurrentChar()">🔓 Trancar Ficha</button>`;
    }
    
    actionContainer.innerHTML = lockHtml + `<button class="btn btn-danger" id="btn-delete-char" style="font-size:11px; padding: 4px 8px;" onclick="deleteCharacter()">Excluir</button>`;

    const editableElements = document.querySelectorAll('.header-grid input, .header-grid select, #page-1 input, #page-1 select, #page-1 textarea, #page-1 button, #page-2 input, #page-2 select, #page-2 textarea, #page-2 button, #page-3 input, #page-3 select, #page-3 textarea, #page-3 button, #btn-delete-char');

    editableElements.forEach(el => {
        el.disabled = isLocked;
        if (isLocked) { el.classList.add('locked-el'); } 
        else { el.classList.remove('locked-el'); }
    });
}

function renderAttributesHTML() {
    const container = document.getElementById('attributes-wrapper');
    container.innerHTML = '';
    const char = getActiveChar();
    for (const [key, attr] of Object.entries(DND_ATTRIBUTES)) {
        let skillHtml = '';
        attr.skills.forEach(skill => {
            skillHtml += `<div class="skill-item">
                <input type="checkbox" id="prof-${skill.id}" onchange="toggleSkill('${skill.id}', this.checked)">
                <label for="prof-${skill.id}" style="flex-grow:1; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${skill.name}</label>
                <input type="number" id="extra-skill-${skill.id}" placeholder="+0" oninput="updateSkillBonus('${skill.id}', this.value)" style="width: 28px; padding: 2px; text-align: center; font-size: 10px; background: rgba(0,0,0,0.5); border: 1px solid #444; color: white; border-radius: 3px; margin-right: 5px;" title="Bônus Adicional">
                <span class="bonus" id="bonus-${skill.id}">+0</span>
            </div>`;
        });
        container.innerHTML += `<div class="attribute-block"><div class="attr-header">${attr.name}</div><div class="attr-inputs"><input type="number" class="attr-score" id="stat-${key}" min="1" max="30" onchange="updateStat('${key}', this.value)"><div class="attr-mod" id="mod-${key}">+0</div></div><div class="skill-list">${skillHtml}</div></div>`;
    }
    container.innerHTML += `<div class="passive-box"><label style="font-size: 11px;">PERCEPÇÃO PASSIVA</label><span id="pass-perception">10</span></div><div class="passive-box"><label style="font-size: 11px;">INSPIRAÇÃO</label><input type="text" id="info-inspiration" value="${char.info.inspiration || ''}" oninput="this.value = this.value.replace(/\\D/g, ''); updateField('info', 'inspiration', this.value)"></div>`;
}

function toggleSkill(skillId, isChecked) { const char = getActiveChar(); char.skills[skillId] = isChecked; saveData(); updateUI(); applyLockState(); }
function updateSkillBonus(skillId, val) { const char = getActiveChar(); char.skillBonuses[skillId] = val === '' ? 0 : parseInt(val); saveData(); updateUI(); applyLockState(); }
function calcMod(score) { let num = parseInt(score) || 10; let mod = Math.floor((num - 10) / 2); return mod >= 0 ? '+' + mod : mod; }
function formatBonusString(val) { if (val === "" || val === "-") return val; let num = parseInt(val, 10); if (isNaN(num)) return ""; return num >= 0 ? "+" + num : num.toString(); }
function mathHP(field) { const char = getActiveChar(); let currentVal = parseInt(char.combat[field]) || 0; let input = prompt(`Somar valor (use o sinal de menos "-" para subtrair):`, "0"); if (input !== null && input.trim() !== "") { let addVal = parseInt(input) || 0; let newVal = currentVal + addVal; if (newVal < 0) newVal = 0; char.combat[field] = newVal; document.getElementById(`combat-${field}`).value = newVal; saveData(); } }

function longRest() {
    const char = getActiveChar();
    if(!char) return;
    if(!confirm("Realizar Descanso Longo?\nIsso irá curar seus PVs para o máximo, zerar seus PVs Temporários, recuperar metade do seu total de Dados de Vida, recarregar seus espaços de magia e limpar suas salvaguardas contra a morte.")) return;

    char.combat.currentHp = char.combat.maxHp;
    char.combat.tempHp = 0;
    char.combat.deathSaves = { successes: [false, false, false], failures: [false, false, false] };

    let totalStr = char.combat.hitDiceTotal || "";
    let match = totalStr.match(/\d+/);
    if (match) {
        let totalDice = parseInt(match[0]);
        let recoverAmount = Math.max(1, Math.floor(totalDice / 2));
        
        let currentStr = char.combat.hitDiceCurrent || "0";
        let currentMatch = currentStr.match(/\d+/);
        let currentDice = currentMatch ? parseInt(currentMatch[0]) : 0;
        let newCurrent = Math.min(totalDice, currentDice + recoverAmount);
        
        if (currentMatch) { char.combat.hitDiceCurrent = currentStr.replace(/\d+/, newCurrent); } 
        else { let diceType = totalStr.replace(/\d+/, '').trim(); char.combat.hitDiceCurrent = newCurrent + diceType; }
    }

    for (let lvl = 1; lvl <= 9; lvl++) { char.spellSlots[lvl].exp = 0; }
    saveData(); updateUI(); renderSpellsHTML(); applyLockState();
}

function getSpeedNum(val) { if (!val || val === '') return 0; let num = parseFloat(String(val).replace(/,/g, '.').replace(/[^\d.-]/g, '')); return isNaN(num) ? 0 : num; }
function formatSpeedVal(num) { let rounded = Math.round(num / 1.5) * 1.5; if (rounded < 0) rounded = 0; return String(rounded).replace('.', ',') + 'm'; }
function adjustSpeed(amount) { let char = getActiveChar(); let current = getSpeedNum(char.combat.speed || '9m'); let newVal = formatSpeedVal(current + amount); updateField('combat', 'speed', newVal); updateUI(); }
function formatSpeedInput(val) { let num = getSpeedNum(val); let newVal = formatSpeedVal(num); updateField('combat', 'speed', newVal); updateUI(); }
function updateDeathSave(type, index, isChecked) { const char = getActiveChar(); char.combat.deathSaves[type][index] = isChecked; saveData(); }

function handleImageUpload(event) {
    const file = event.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = function(e) {
        if (file.type === 'image/gif') { updateImage(e.target.result); return; }
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 600; const MAX_HEIGHT = 1000; 
            let width = img.width; let height = img.height;
            if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
            canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); updateImage(canvas.toDataURL('image/webp', 0.75));
        }; img.src = e.target.result;
    }; reader.readAsDataURL(file);
}
function updateImage(dataUrl) { try { updateField('info', 'image', dataUrl); updateUI(); } catch (err) { alert("Imagem muito grande para salvar."); } }
function removeImage() { updateField('info', 'image', ''); updateUI(); }

function handleFactionImageUpload(event) {
    const file = event.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = function(e) {
        if (file.type === 'image/gif') { updateFactionImage(e.target.result); return; }
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 600; const MAX_HEIGHT = 600; 
            let width = img.width; let height = img.height;
            if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
            canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); updateFactionImage(canvas.toDataURL('image/webp', 0.75));
        }; img.src = e.target.result;
    }; reader.readAsDataURL(file);
}
function updateFactionImage(dataUrl) { try { updateField('info', 'factionImage', dataUrl); updateUI(); } catch (err) { alert("Imagem muito grande."); } }
function removeFactionImage() { updateField('info', 'factionImage', ''); updateUI(); }

function toggleCustomArmorShield(isChecked) {
    const typeSelect = document.getElementById('custom-armor-type'); const acInput = document.getElementById('custom-armor-ac');
    if (isChecked) { typeSelect.disabled = true; acInput.value = 2; } else { typeSelect.disabled = false; acInput.value = ''; }
}

function updateUI() {
  const char = getActiveChar(); if (!char) return;

  let classStr = char.info.classLevel || ""; let level = 1; let numbers = classStr.match(/\d+/g);
  if (numbers) level = numbers.reduce((a, b) => a + parseInt(b), 0);
  let profBonus = Math.max(2, Math.ceil(level / 4) + 1);

  document.getElementById('overall-level').innerText = level;
  document.getElementById('prof-bonus').innerText = "+" + profBonus;

  const fieldsInfo = ['classLevel', 'background', 'playerName', 'race', 'alignment', 'xp', 'age', 'size', 'height', 'weight', 'eyes', 'skin', 'hair', 'type'];
  fieldsInfo.forEach(f => { let el = document.getElementById('info-'+f); if(el) el.value = char.info[f] || ''; });
  document.getElementById('pc-name').value = char.name;

  const imgPreview = document.getElementById('char-image-preview'); const imgPlaceholder = document.getElementById('char-image-placeholder'); const imgRemoveBtn = document.getElementById('char-image-remove');
  if (char.info.image) { imgPreview.src = char.info.image; imgPreview.style.display = 'block'; imgPlaceholder.style.display = 'none'; imgRemoveBtn.style.display = 'block'; } 
  else { imgPreview.src = ''; imgPreview.style.display = 'none'; imgPlaceholder.style.display = 'block'; imgRemoveBtn.style.display = 'none'; }

  const factionImgPreview = document.getElementById('faction-image-preview'); const factionImgPlaceholder = document.getElementById('faction-image-placeholder'); const factionImgRemoveBtn = document.getElementById('faction-image-remove');
  if (char.info.factionImage) { factionImgPreview.src = char.info.factionImage; factionImgPreview.style.display = 'block'; factionImgPlaceholder.style.display = 'none'; factionImgRemoveBtn.style.display = 'block'; } 
  else { factionImgPreview.src = ''; factionImgPreview.style.display = 'none'; factionImgPlaceholder.style.display = 'block'; factionImgRemoveBtn.style.display = 'none'; }

  let perceptionBonus = 0;
  for (const [key, attr] of Object.entries(DND_ATTRIBUTES)) {
      let score = char.stats[key] || 10; let modNum = Math.floor((score - 10) / 2);
      let statEl = document.getElementById(`stat-${key}`); if(statEl) statEl.value = score;
      let modEl = document.getElementById(`mod-${key}`); if(modEl) modEl.innerText = modNum >= 0 ? '+' + modNum : modNum;
      attr.skills.forEach(skill => {
          let isProficient = char.skills[skill.id] || false; let extraBonus = parseInt(char.skillBonuses[skill.id]) || 0; 
          let profEl = document.getElementById(`prof-${skill.id}`); if(profEl) profEl.checked = isProficient;
          let extraEl = document.getElementById(`extra-skill-${skill.id}`); if (extraEl) extraEl.value = extraBonus !== 0 ? extraBonus : ''; 
          let totalBonus = modNum + (isProficient ? profBonus : 0) + extraBonus;
          let bonusEl = document.getElementById(`bonus-${skill.id}`); if(bonusEl) bonusEl.innerText = totalBonus >= 0 ? '+' + totalBonus : totalBonus;
          if (skill.id === 'percepcao') perceptionBonus = totalBonus;
      });
  }
  let passPercEl = document.getElementById('pass-perception'); if(passPercEl) passPercEl.innerText = 10 + perceptionBonus;
  let inspEl = document.getElementById('info-inspiration'); if(inspEl) inspEl.value = char.info.inspiration || '';

  const fieldsCombat = ['speed', 'maxHp', 'currentHp', 'tempHp', 'hitDiceTotal', 'hitDiceCurrent'];
  fieldsCombat.forEach(f => { let el = document.getElementById('combat-'+f); if(el) el.value = char.combat[f] || ''; });

  for(let i=0; i<3; i++) {
      document.getElementById(`ds-s${i}`).checked = char.combat.deathSaves.successes[i];
      document.getElementById(`ds-f${i}`).checked = char.combat.deathSaves.failures[i];
  }

  let dexModNum = Math.floor(((parseInt(char.stats.dex) || 10) - 10) / 2);
  let extraInit = parseInt(char.combat.initBonus) || 0;
  document.getElementById('combat-init-dex').value = calcMod(char.stats.dex);
  document.getElementById('combat-init-bonus').value = char.combat.initBonus || "";
  document.getElementById('combat-initiative-total').value = formatBonusString(dexModNum + extraInit);

  document.getElementById('combat-ac').value = char.combat.ac || ''; document.getElementById('combat-ac-bonus').value = char.combat.acBonus || '';
  let manualAc = parseInt(char.combat.ac) || 10; let bonusAc = parseInt(char.combat.acBonus) || 0;
  let shieldBonus = 0; char.armorList.forEach(a => { if (a.equipped && a.isShield) shieldBonus += (a.acBase || 2); });
  let armor = char.armorList.find(a => a.equipped && !a.isShield);
  let finalAc = 0;

  if (armor) {
      let armorBase = parseInt(armor.acBase) || 10; let dexBonus = 0;
      if (armor.acType === 'leve') dexBonus = dexModNum; else if (armor.acType === 'media') dexBonus = Math.min(dexModNum, 2); else if (armor.acType === 'pesada' || armor.acType === 'nenhum') dexBonus = 0;
      finalAc = armorBase + dexBonus + shieldBonus + bonusAc; document.getElementById('combat-ac-total').value = finalAc;
      document.getElementById('combat-ac').title = "Sua CA manual está sendo ignorada pela armadura vestida."; document.getElementById('combat-ac').style.opacity = 0.5;
  } else {
      finalAc = manualAc + shieldBonus + bonusAc; document.getElementById('combat-ac-total').value = finalAc;
      document.getElementById('combat-ac').title = "CA Base"; document.getElementById('combat-ac').style.opacity = 1;
  }

  const fieldsText = ['traits', 'ideals', 'bonds', 'flaws', 'appearanceText', 'backstory', 'allies', 'factionName', 'additionalFeatures', 'treasure'];
  fieldsText.forEach(f => { let el = document.getElementById('text-'+f); if(el) el.value = char.textBlocks[f] || ''; });

  document.getElementById('extra-weight').value = char.extraWeight;

  const coins = char.coins;
  ['pl','po','pe','pp','pc','fl'].forEach(t => document.getElementById(`${t}-total`).innerText = coins[t]);
  let totalPO = (coins.pl * 10) + coins.po + (coins.pe / 2) + (coins.pp / 10) + (coins.pc / 100); document.getElementById('total-po').innerText = totalPO.toFixed(2);
  let totalCoins = coins.pl + coins.po + coins.pe + coins.pp + coins.pc + coins.fl; let coinsWeightKg = (totalCoins * 10) / 1000;
  
  let equipWeightKg = 0; char.equipmentList.forEach(item => { let q = item.qtd !== undefined ? parseInt(item.qtd) : 1; if(isNaN(q)) q = 1; equipWeightKg += (parseFloat(item.weight) || 0) * q; });
  let armorWeightKg = 0; char.armorList.forEach(item => { if (item.isShield || !item.equipped) armorWeightKg += item.weight; });

  let totalWeightKg = coinsWeightKg + parseFloat(char.extraWeight || 0) + equipWeightKg + armorWeightKg;
  let currentStr = parseInt(char.stats.str) || 10;

  let sizeMultiplier = 1;
  switch(char.info.size) {
      case 'Miúdo': sizeMultiplier = 0.5; break;
      case 'Grande': sizeMultiplier = 2; break;
      case 'Enorme': sizeMultiplier = 4; break;
      case 'Imenso': sizeMultiplier = 8; break;
      case 'Pequeno':
      case 'Médio':
      default: sizeMultiplier = 1; break;
  }

  let encumberedLevel = currentStr * 2.5 * sizeMultiplier;
  let heavyEncumberedLevel = currentStr * 5 * sizeMultiplier;
  let maxWeight = currentStr * 7.5 * sizeMultiplier;
  
  document.getElementById('weight').innerText = coinsWeightKg.toFixed(2); document.getElementById('total-weight').innerText = totalWeightKg.toFixed(2); document.getElementById('max-weight').innerText = maxWeight.toFixed(1);

  let statusElem = document.getElementById('encumbrance-status'); let descElem = document.getElementById('encumbrance-desc');
  if (totalWeightKg > maxWeight) { statusElem.innerText = "Imóvel (Ultrapassou max)"; statusElem.style.color = "var(--danger)"; descElem.innerText = "Deslocamento reduzido a 0m. Você não pode se mover."; } 
  else if (totalWeightKg > heavyEncumberedLevel) { statusElem.innerText = "Sobrecarga Pesada"; statusElem.style.color = "var(--danger)"; descElem.innerText = "Deslocamento cai em 6m. Desvantagem em testes, ataques e salvaguardas de For, Des e Con."; } 
  else if (totalWeightKg > encumberedLevel) { statusElem.innerText = "Sobrecarga"; statusElem.style.color = "var(--warning)"; descElem.innerText = "Deslocamento cai em 3m."; } 
  else { statusElem.innerText = "Normal"; statusElem.style.color = "var(--success)"; descElem.innerText = ""; }

  document.getElementById('spell-class').value = char.spellsInfo.class || ''; document.getElementById('spell-ability').value = char.spellsInfo.ability || ''; updateSpellStats();
}

function updateSpellStats() {
    const char = getActiveChar(); if (!char) return;
    let attr = char.spellsInfo.ability; let classStr = char.info.classLevel || ""; let level = 1; let numbers = classStr.match(/\d+/g);
    if (numbers) level = numbers.reduce((a, b) => a + parseInt(b), 0); let profBonus = Math.max(2, Math.ceil(level / 4) + 1);
    let dc = 8 + profBonus; let atk = profBonus;
    if (attr && char.stats[attr]) { let mod = Math.floor((char.stats[attr] - 10) / 2); dc += mod; atk += mod; }
    document.getElementById('spell-dc').value = attr ? dc : ''; document.getElementById('spell-atk').value = attr ? (atk >= 0 ? '+'+atk : atk) : '';
}

function updateSpellSlot(lvl, field, val) { getActiveChar().spellSlots[lvl][field] = parseInt(val) || 0; saveData(); }
function addSpell(lvl) { getActiveChar().spells[lvl].push({ name: '', prep: false }); saveData(); fullUIRefresh(); }
function updateSpell(lvl, idx, field, val) { getActiveChar().spells[lvl][idx][field] = val; saveData(); }
function removeSpell(lvl, idx) { getActiveChar().spells[lvl].splice(idx, 1); saveData(); fullUIRefresh(); }

function renderSpellsHTML() {
    const char = getActiveChar(); if(!char) return;
    const cols = [[0, 1, 2], [3, 4, 5], [6, 7, 8, 9]];
    cols.forEach((levels, colIdx) => {
        let html = '';
        levels.forEach(lvl => {
            html += `<div class="box" style="padding: 10px;"><div class="box-title" style="display:flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #444; padding-bottom: 8px; margin-bottom: 10px;"><span style="background: var(--warning); color: black; padding: 2px 10px; border-radius: 4px; font-size: 16px; font-weight: bold;">${lvl}</span><span style="color: #fff;">${lvl === 0 ? 'TRUQUES' : 'NÍVEL ' + lvl}</span></div>`;
            if (lvl > 0) { html += `<div style="display:flex; gap:10px; margin-bottom:15px; font-size:10px;"><div style="flex:1"><label>Total de Espaços</label><input type="number" min="0" value="${char.spellSlots[lvl].total}" oninput="updateSpellSlot(${lvl}, 'total', this.value)" style="text-align: center;"></div><div style="flex:1"><label>Espaços Utilizados</label><input type="number" min="0" value="${char.spellSlots[lvl].exp}" oninput="updateSpellSlot(${lvl}, 'exp', this.value)" style="text-align: center;"></div></div>`; }
            html += `<div class="dynamic-list">`;
            if (lvl > 0 && char.spells[lvl].length > 0) { html += `<div style="font-size: 9px; color: #888; margin-bottom: 5px; display: flex;"><span style="width: 20px; text-align: center;">PREP</span><span style="margin-left: 5px;">NOME DA MAGIA</span></div>`; }
            char.spells[lvl].forEach((spell, idx) => { html += `<div class="dynamic-row" style="align-items: center; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px;">${lvl > 0 ? `<input type="checkbox" title="Preparada" class="ds-checkbox" style="margin: 0 5px;" ${spell.prep ? 'checked' : ''} onchange="updateSpell(${lvl}, ${idx}, 'prep', this.checked)">` : ''}<input type="text" placeholder="Nome da Magia" style="flex: 1; border: none; border-bottom: 1px solid #555; border-radius: 0; padding: 2px 5px; background: transparent;" value="${spell.name.replace(/"/g, '&quot;')}" oninput="updateSpell(${lvl}, ${idx}, 'name', this.value)"><button class="btn-remove" style="padding: 2px 6px; font-size: 10px; margin-left: 5px;" onclick="removeSpell(${lvl}, ${idx})">X</button></div>`; });
            html += `</div><button class="btn-add" style="margin-top: 10px; border: 1px dashed #555;" onclick="addSpell(${lvl})">➕ Add Magia</button></div>`;
        });
        document.getElementById(`spell-col-${colIdx + 1}`).innerHTML = html;
    });
}

function addArmor() { const select = document.getElementById('armor-select'); if (!select.value) return; const [name, weight, isShieldStr, acBase, acType] = select.value.split('|'); getActiveChar().armorList.push({ id: Date.now(), name: name, weight: parseFloat(weight), isShield: isShieldStr === 'true', equipped: false, acBase: parseInt(acBase) || 0, acType: acType || 'nenhum' }); saveData(); fullUIRefresh(); }
function addCustomArmor() { const nameInput = document.getElementById('custom-armor-name'); const weightInput = document.getElementById('custom-armor-weight'); const shieldInput = document.getElementById('custom-armor-shield'); const typeInput = document.getElementById('custom-armor-type'); const acInput = document.getElementById('custom-armor-ac'); const name = nameInput.value.trim(); const weight = parseFloat(weightInput.value) || 0; const isShield = shieldInput.checked; const acBase = parseInt(acInput.value) || (isShield ? 2 : 10); const acType = typeInput.value; if (!name) { alert("Informe o nome da armadura!"); return; } getActiveChar().armorList.push({ id: Date.now(), name: name, weight: weight, isShield: isShield, equipped: false, acBase: acBase, acType: isShield ? 'escudo' : acType }); nameInput.value = ''; weightInput.value = ''; shieldInput.checked = false; acInput.value = ''; typeInput.disabled = false; saveData(); fullUIRefresh(); }
function removeArmor(index) { getActiveChar().armorList.splice(index, 1); saveData(); fullUIRefresh(); }
function toggleArmorEquip(index) { const char = getActiveChar(); const isNowEquipped = !char.armorList[index].equipped; if (!char.armorList[index].isShield && isNowEquipped) { char.armorList.forEach(item => { if (!item.isShield) item.equipped = false; }); } char.armorList[index].equipped = isNowEquipped; saveData(); fullUIRefresh(); }

function formatTextList(arr) { if (arr.length === 0) return ''; if (arr.length === 1) return arr[0]; let copy = [...arr]; const last = copy.pop(); return copy.join(', ') + ' e ' + last; }
function renderProfLangPreview() { const char = getActiveChar(); if (!char) return; let lines = []; const groupedProfs = { 'Armaduras': [], 'Armas': [], 'Ferramentas': [] }; char.proficiencies.forEach(p => { if (p.name.trim()) groupedProfs[p.cat].push(p.name.trim()); }); ['Armaduras', 'Armas', 'Ferramentas'].forEach(cat => { if (groupedProfs[cat].length > 0) { let sorted = groupedProfs[cat].sort((a,b) => a.localeCompare(b)); lines.push(`${cat}: ${formatTextList(sorted)}`); } }); let langs = char.languages.map(l => l.name.trim()).filter(l => l); if (langs.length > 0) { if (lines.length > 0) lines.push(""); let sortedLangs = langs.sort((a,b) => a.localeCompare(b)); lines.push(`Idiomas: ${formatTextList(sortedLangs)}`); } const previewEl = document.getElementById('prof-lang-preview'); if (previewEl) previewEl.innerText = lines.join('\n'); }

function renderDynamicLists() {
  const char = getActiveChar(); if (!char) return;
  const atkContainer = document.getElementById('attacks-container'); atkContainer.innerHTML = '';
  char.attacks.forEach((atk, index) => { atkContainer.innerHTML += `<div class="dynamic-row"><input type="text" placeholder="Arma/Magia" style="flex: 2;" value="${atk.name.replace(/"/g, '&quot;')}" oninput="updateArrayItem('attacks', ${index}, 'name', this.value)"><input type="text" placeholder="+0" style="flex: 1; text-align:center;" value="${atk.bonus.replace(/"/g, '&quot;')}" oninput="this.value = this.value.replace(/[^0-9\\-]/g, '')" onchange="this.value = formatBonusString(this.value); updateArrayItem('attacks', ${index}, 'bonus', this.value)"><input type="text" placeholder="1d8 Cort" style="flex: 2; text-align:center;" value="${atk.damage.replace(/"/g, '&quot;')}" oninput="updateArrayItem('attacks', ${index}, 'damage', this.value)"><input type="text" placeholder="Notas Extra" style="flex: 2; text-align:center;" value="${(atk.extra || '').replace(/"/g, '&quot;')}" oninput="updateArrayItem('attacks', ${index}, 'extra', this.value)"><button class="btn-remove" onclick="removeArrayItem('attacks', ${index})">X</button></div>`; });
  const armorContainer = document.getElementById('armor-list-container'); armorContainer.innerHTML = '';
  char.armorList.forEach((item, index) => { let acText = item.isShield ? '+' + (item.acBase || 2) + ' CA' : (item.acBase || 10) + ' CA'; armorContainer.innerHTML += `<div class="armor-item"><span><strong style="color:var(--warning)">${item.name}</strong> (${acText} | ${item.weight} kg)</span><div style="display: flex; align-items: center;"><label><input type="${item.isShield ? 'checkbox' : 'radio'}" name="${item.isShield ? 'shield_' + item.id : 'armor_group_' + char.id}" ${item.equipped ? 'checked' : ''} onclick="toggleArmorEquip(${index})"> ${item.isShield ? 'Equipar' : 'Vestir'}</label><button class="btn-remove" style="margin-left: 10px; padding: 2px 6px; font-size:10px;" onclick="removeArmor(${index})">X</button></div></div>`; });
  const equipContainer = document.getElementById('equipment-container'); equipContainer.innerHTML = '';
  char.equipmentList.forEach((item, index) => { let q = item.qtd !== undefined ? item.qtd : 1; equipContainer.innerHTML += `<div class="dynamic-row"><input type="number" placeholder="Qtd" min="1" style="width: 55px; text-align:center;" value="${q}" oninput="updateArrayItem('equipmentList', ${index}, 'qtd', this.value); updateUI();" title="Quantidade"><input type="text" placeholder="Nome do Item..." style="flex: 3;" value="${item.name.replace(/"/g, '&quot;')}" oninput="updateArrayItem('equipmentList', ${index}, 'name', this.value)"><input type="number" placeholder="Peso un. (kg)" step="0.1" min="0" style="flex: 1.2; text-align:center;" value="${item.weight !== undefined ? item.weight : ''}" oninput="updateArrayItem('equipmentList', ${index}, 'weight', this.value); updateUI();" title="Peso Unitário"><button class="btn-remove" onclick="removeArrayItem('equipmentList', ${index})">X</button></div>`; });
  const featContainer = document.getElementById('features-container'); featContainer.innerHTML = '';
  char.featureList.forEach((feat, index) => { featContainer.innerHTML += `<div class="dynamic-row" style="flex-direction: column; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; border: 1px solid #444; gap: 5px;"><div style="display: flex; width: 100%; gap: 5px;"><input type="text" placeholder="Nome da Característica" style="font-weight: bold; flex-grow: 1;" value="${feat.name.replace(/"/g, '&quot;')}" oninput="updateArrayItem('featureList', ${index}, 'name', this.value)"><button class="btn-remove" onclick="removeArrayItem('featureList', ${index})">X</button></div><textarea placeholder="Descrição..." style="min-height: 50px;" oninput="updateArrayItem('featureList', ${index}, 'desc', this.value)">${feat.desc}</textarea></div>`; });
  const profsContainer = document.getElementById('profs-container'); profsContainer.innerHTML = '';
  char.proficiencies.forEach((prof, index) => { profsContainer.innerHTML += `<div class="dynamic-row"><select style="width: 120px; padding: 5px; background: #222; color: #fff; border: 1px solid #444; border-radius: 4px;" onchange="updateArrayItem('proficiencies', ${index}, 'cat', this.value); renderProfLangPreview();"><option value="Armaduras" ${prof.cat === 'Armaduras' ? 'selected' : ''}>Armaduras</option><option value="Armas" ${prof.cat === 'Armas' ? 'selected' : ''}>Armas</option><option value="Ferramentas" ${prof.cat === 'Ferramentas' ? 'selected' : ''}>Ferramentas</option></select><input type="text" placeholder="Ex: Couro Batido" style="flex: 1;" value="${prof.name.replace(/"/g, '&quot;')}" oninput="updateArrayItem('proficiencies', ${index}, 'name', this.value); renderProfLangPreview();"><button class="btn-remove" onclick="removeArrayItem('proficiencies', ${index})">X</button></div>`; });
  const langsContainer = document.getElementById('langs-container'); langsContainer.innerHTML = '';
  char.languages.forEach((lang, index) => { langsContainer.innerHTML += `<div class="dynamic-row"><input type="text" placeholder="Ex: Dracônico" style="flex: 1;" value="${lang.name.replace(/"/g, '&quot;')}" oninput="updateArrayItem('languages', ${index}, 'name', this.value); renderProfLangPreview();"><button class="btn-remove" onclick="removeArrayItem('languages', ${index})">X</button></div>`; });
  renderProfLangPreview();
}

function updateArrayItem(listName, index, field, value) { getActiveChar()[listName][index][field] = value; saveData(); }
function addArrayItem(listName, defaultObj) { getActiveChar()[listName].push(defaultObj); saveData(); fullUIRefresh(); }
function removeArrayItem(listName, index) { getActiveChar()[listName].splice(index, 1); saveData(); fullUIRefresh(); }
function updateField(category, field, value) { const char = getActiveChar(); if (category === 'name') { char.name = value || "Sem Nome"; renderTabs(); } else { char[category][field] = value; } saveData(); }
function updateStat(stat, value) { const char = getActiveChar(); if (value !== '') { let val = parseInt(value); if (val < 1) val = 1; if (val > 30) val = 30; char.stats[stat] = val; document.getElementById(`stat-${stat}`).value = val; } else { char.stats[stat] = ''; } saveData(); updateUI(); }
function updateExtraWeight(value) { getActiveChar().extraWeight = parseFloat(value) || 0; saveData(); updateUI(); }
function updateCoin(type, isCredit) { let input = document.getElementById(`${type}-input`); let amount = parseInt(input.value) || 0; if (amount <= 0) return; const char = getActiveChar(); if (isCredit) { char.coins[type] += amount; } else { char.coins[type] = Math.max(0, char.coins[type] - amount); } input.value = ''; saveData(); updateUI(); }

function createCharacter(defaultName = null) { 
    let name = defaultName || prompt("Nome do novo personagem:"); 
    if (!name || name.trim() === '') return; 
    const newChar = emptyCharData(name.trim()); 
    party.push(newChar); 
    activeCharId = newChar.id; 
    saveData(); 
    fullUIRefresh(); 
}

function deleteCharacter() { 
    const char = getActiveChar();
    if (char.password && !unlockedChars.has(char.id)) {
        alert("Desbloqueie a ficha primeiro para poder excluí-la.");
        return;
    }
    if (party.length <= 1) { alert("Você precisa ter pelo menos um personagem!"); return; } 
    if(confirm(`Tem certeza que deseja excluir a ficha do(a) ${char.name}?`)) { 
        party = party.filter(c => c.id !== char.id); 
        activeCharId = party[0].id; 
        saveData(); 
        fullUIRefresh(); 
    } 
}

function exportData() { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(party)); const downloadAnchorNode = document.createElement('a'); downloadAnchorNode.setAttribute("href", dataStr); downloadAnchorNode.setAttribute("download", "dnd_sheet_backup.json"); document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove(); }

function importData(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedParty = JSON.parse(e.target.result);
      if (Array.isArray(importedParty) && importedParty[0].id) {
        party = importedParty; activeCharId = party[0].id; runFallbackChecks();
        saveData(); fullUIRefresh(); alert("Backup importado com sucesso!");
      } else { alert("Arquivo inválido."); }
    } catch (err) { alert("Erro ao ler o arquivo."); }
  };
  reader.readAsText(file);
}

window.onload = init;