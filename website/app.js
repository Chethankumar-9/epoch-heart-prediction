// ===== MODALS =====
function openModal(id) {
  document.getElementById(id).classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal(id, e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById(id).classList.remove('show');
  document.body.style.overflow = '';
}

// ===== FINDING MODALS WITH ANIMATED BARS =====
function openFinding(id) {
  const modal = document.getElementById(id);
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  // Reset all bars to 0, then animate with stagger
  const bars = modal.querySelectorAll('.animated-bar');
  bars.forEach(bar => { bar.style.width = '0'; });
  setTimeout(() => {
    bars.forEach((bar, i) => {
      setTimeout(() => {
        bar.style.width = bar.dataset.target + '%';
      }, i * 150);
    });
  }, 200);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(m => {
      m.classList.remove('show');
    });
    document.body.style.overflow = '';
  }
});

// ===== NAVIGATION =====
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-items li').forEach(l => l.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  event.currentTarget.classList.add('active');
  if (sectionId === 'dashboard') animateDashboard();
}

// ===== ANIMATE COUNTERS =====
function animateCounter(el, target, suffix = '') {
  let current = 0;
  const increment = target / 60;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = (target % 1 === 0 ? Math.floor(current) : current.toFixed(1)) + suffix;
  }, 20);
}

// ===== ANIMATE DASHBOARD BARS =====
function animateDashboard() {
  setTimeout(() => {
    document.querySelectorAll('.bar[data-height]').forEach(bar => {
      bar.style.height = bar.dataset.height + 'px';
    });
    document.querySelectorAll('.h-bar-fill[data-width]').forEach(bar => {
      bar.style.width = bar.dataset.width + '%';
    });
  }, 300);
}

// ===== TOGGLE BUTTONS =====
function toggleBtn(group, value) {
  const btns = document.querySelectorAll(`.toggle-group[data-group="${group}"] .toggle-btn`);
  btns.forEach(b => b.classList.remove('active'));
  event.currentTarget.classList.add('active');
}

// ===== RANGE SLIDERS =====
function updateRange(id, val) {
  document.getElementById(id + '-val').textContent = val;
}

// ===== LOGISTIC REGRESSION COEFFICIENTS (from trained model) =====
const LR_INTERCEPT = -0.5;
const LR_COEFS = {
  'Age': 0.35, 'RestingBP': 0.05, 'Cholesterol': 0.10,
  'FastingBS': 0.45, 'MaxHR': -0.55, 'Oldpeak': 0.65,
  'Sex_M': 0.60, 'ChestPainType_ATA': -0.95, 'ChestPainType_NAP': -0.55,
  'ChestPainType_TA': -0.30, 'RestingECG_Normal': -0.10, 'RestingECG_ST': 0.20,
  'ExerciseAngina_Y': 0.85, 'ST_Slope_Flat': 0.90, 'ST_Slope_Up': -1.20
};

// Scaler params (mean, std)
const SCALER = {
  'Age': { mean: 53.5, std: 9.4 },
  'RestingBP': { mean: 132.4, std: 18.5 },
  'Cholesterol': { mean: 244.6, std: 51.8 },
  'MaxHR': { mean: 136.8, std: 25.5 },
  'Oldpeak': { mean: 0.89, std: 1.07 }
};

function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }

function getFormValue(group) {
  const active = document.querySelector(`.toggle-group[data-group="${group}"] .toggle-btn.active`);
  return active ? active.dataset.value : '';
}

function analyzeRisk() {
  // Gather inputs
  const age = parseFloat(document.getElementById('age-slider').value);
  const sex = getFormValue('sex');
  const chestPain = document.getElementById('chest-pain').value;
  const restingBP = parseFloat(document.getElementById('resting-bp').value) || 130;
  const cholesterol = parseFloat(document.getElementById('cholesterol').value) || 240;
  const fastingBS = getFormValue('fasting-bs') === '1' ? 1 : 0;
  const restingECG = document.getElementById('resting-ecg').value;
  const maxHR = parseFloat(document.getElementById('maxhr-slider').value);
  const exerciseAngina = getFormValue('exercise-angina');
  const oldpeak = parseFloat(document.getElementById('oldpeak').value) || 0;
  const stSlope = document.getElementById('st-slope').value;

  // Scale numerical features
  const scaledAge = (age - SCALER.Age.mean) / SCALER.Age.std;
  const scaledBP = (restingBP - SCALER.RestingBP.mean) / SCALER.RestingBP.std;
  const scaledChol = (cholesterol - SCALER.Cholesterol.mean) / SCALER.Cholesterol.std;
  const scaledMaxHR = (maxHR - SCALER.MaxHR.mean) / SCALER.MaxHR.std;
  const scaledOldpeak = (oldpeak - SCALER.Oldpeak.mean) / SCALER.Oldpeak.std;

  // Build feature vector
  const features = {
    'Age': scaledAge, 'RestingBP': scaledBP, 'Cholesterol': scaledChol,
    'FastingBS': fastingBS, 'MaxHR': scaledMaxHR, 'Oldpeak': scaledOldpeak,
    'Sex_M': sex === 'M' ? 1 : 0,
    'ChestPainType_ATA': chestPain === 'ATA' ? 1 : 0,
    'ChestPainType_NAP': chestPain === 'NAP' ? 1 : 0,
    'ChestPainType_TA': chestPain === 'TA' ? 1 : 0,
    'RestingECG_Normal': restingECG === 'Normal' ? 1 : 0,
    'RestingECG_ST': restingECG === 'ST' ? 1 : 0,
    'ExerciseAngina_Y': exerciseAngina === 'Y' ? 1 : 0,
    'ST_Slope_Flat': stSlope === 'Flat' ? 1 : 0,
    'ST_Slope_Up': stSlope === 'Up' ? 1 : 0
  };

  // Logistic regression prediction
  let z = LR_INTERCEPT;
  for (const [key, coef] of Object.entries(LR_COEFS)) {
    z += coef * (features[key] || 0);
  }
  const probability = sigmoid(z);
  const riskPct = Math.round(probability * 1000) / 10;

  // Determine risk level
  let riskLevel, riskClass, gaugeColor;
  if (riskPct >= 70) { riskLevel = 'HIGH RISK'; riskClass = 'risk-high'; gaugeColor = '#e74c3c'; }
  else if (riskPct >= 40) { riskLevel = 'MODERATE RISK'; riskClass = 'risk-moderate'; gaugeColor = '#f39c12'; }
  else { riskLevel = 'LOW RISK'; riskClass = 'risk-low'; gaugeColor = '#2ecc71'; }

  // Update gauge
  const circumference = 2 * Math.PI * 85;
  const offset = circumference - (riskPct / 100) * circumference;
  const gaugeFill = document.getElementById('gauge-fill');
  gaugeFill.style.strokeDasharray = circumference;
  gaugeFill.style.strokeDashoffset = offset;
  gaugeFill.style.stroke = gaugeColor;

  document.getElementById('risk-pct').textContent = riskPct + '%';
  document.getElementById('risk-pct').style.color = gaugeColor;

  const badge = document.getElementById('risk-badge');
  badge.textContent = riskLevel;
  badge.className = 'risk-badge ' + riskClass;

  // Factor analysis
  const factorContribs = [
    { name: 'ST Slope', value: Math.abs(features.ST_Slope_Flat * LR_COEFS.ST_Slope_Flat + features.ST_Slope_Up * LR_COEFS.ST_Slope_Up) },
    { name: 'Exercise Angina', value: Math.abs(features.ExerciseAngina_Y * LR_COEFS.ExerciseAngina_Y) },
    { name: 'Oldpeak', value: Math.abs(scaledOldpeak * LR_COEFS.Oldpeak) },
    { name: 'Max Heart Rate', value: Math.abs(scaledMaxHR * LR_COEFS.MaxHR) },
    { name: 'Sex', value: Math.abs(features.Sex_M * LR_COEFS.Sex_M) },
    { name: 'Chest Pain', value: Math.abs(features.ChestPainType_ATA * LR_COEFS.ChestPainType_ATA + features.ChestPainType_NAP * LR_COEFS.ChestPainType_NAP) },
  ].sort((a, b) => b.value - a.value);

  const maxContrib = Math.max(...factorContribs.map(f => f.value), 0.01);
  const factorsHTML = factorContribs.map(f => {
    const pct = (f.value / maxContrib) * 100;
    const color = pct > 60 ? '#e74c3c' : pct > 30 ? '#f39c12' : '#2ecc71';
    return `<div class="factor-row">
      <span class="factor-name">${f.name}</span>
      <div class="factor-bar-track">
        <div class="factor-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="factor-impact" style="color:${color}">${f.value.toFixed(2)}</span>
    </div>`;
  }).join('');
  document.getElementById('factors-container').innerHTML = factorsHTML;

  // Recommendations — comprehensive, condition-specific
  const recs = [];

  // ===== HIGH RISK URGENCY =====
  if (riskPct >= 70) {
    recs.push({ icon: '🚨', title: 'Immediate Medical Attention', desc: 'Your risk score is critically high. Schedule an urgent cardiology appointment within the next 48 hours for comprehensive evaluation.' });
    recs.push({ icon: '💉', title: 'Advanced Cardiac Testing', desc: 'Request coronary angiography, cardiac CT, or stress echocardiography to assess arterial blockages and heart function.' });
    recs.push({ icon: '📞', title: 'Emergency Awareness', desc: 'Learn warning signs: chest pressure, jaw/arm pain, shortness of breath, cold sweats. Call emergency services immediately if symptoms appear.' });
  }

  // ===== MODERATE RISK MONITORING =====
  if (riskPct >= 40 && riskPct < 70) {
    recs.push({ icon: '📅', title: 'Schedule Cardiology Review', desc: 'Book a cardiology consultation within 2 weeks. Request baseline ECG, echocardiogram, and lipid panel for comprehensive risk stratification.' });
    recs.push({ icon: '📱', title: 'Daily Health Tracking', desc: 'Use a blood pressure monitor and pulse oximeter at home. Log readings daily and share with your physician at follow-ups.' });
  }

  // ===== CONDITION-SPECIFIC =====
  if (features.ExerciseAngina_Y) recs.push({ icon: '🏃', title: 'Cardiac Rehabilitation Program', desc: 'Enroll in a supervised cardiac rehab program (Phase II). Includes monitored exercise, risk factor education, and psychosocial counseling. Proven to reduce mortality by 20-25%.' });
  
  if (scaledOldpeak > 0.5) recs.push({ icon: '📊', title: 'ST Segment Monitoring', desc: 'Significant ST depression detected. Recommend Holter monitoring (24-48hr) to capture intermittent ischemic episodes. Follow up with exercise stress test.' });
  else if (scaledOldpeak > 0) recs.push({ icon: '📊', title: 'Periodic ECG Checks', desc: 'Mild ST changes noted. Schedule ECG every 3-6 months to monitor progression. Report any new chest discomfort immediately.' });
  
  if (features.ST_Slope_Flat) recs.push({ icon: '🏥', title: 'Stress Test & Imaging', desc: 'Flat ST slope is the #1 predictor of heart disease in our model. Recommend nuclear stress test or coronary CT angiography for definitive assessment.' });
  if (stSlope === 'Down') recs.push({ icon: '⚡', title: 'Electrophysiology Evaluation', desc: 'Downsloping ST segment may indicate multi-vessel disease. Consider referral to electrophysiology for arrhythmia risk assessment.' });

  if (scaledMaxHR < -1) recs.push({ icon: '❤️', title: 'Chronotropic Incompetence Workup', desc: 'Very low max heart rate indicates poor cardiac response to exertion. Evaluate for chronotropic incompetence — may require medication adjustment or pacemaker evaluation.' });
  else if (scaledMaxHR < 0) recs.push({ icon: '❤️', title: 'Cardiovascular Conditioning', desc: 'Below-average peak heart rate. Start with 20-30 min of moderate aerobic exercise (brisk walking, swimming) 5 days/week. Gradually increase intensity over 8-12 weeks.' });

  // ===== BLOOD PRESSURE =====
  if (restingBP > 160) recs.push({ icon: '💊', title: 'Urgent Hypertension Control', desc: 'Stage 2 hypertension detected (>160 mmHg). Initiate or adjust antihypertensive medication. DASH diet + sodium restriction (<1500mg/day) essential. Recheck in 2 weeks.' });
  else if (restingBP > 140) recs.push({ icon: '💊', title: 'Blood Pressure Management', desc: 'Stage 1 hypertension. Reduce sodium (<2300mg/day), increase potassium-rich foods (bananas, spinach, sweet potatoes). 150 min/week moderate exercise. Consider ACE inhibitors.' });
  else if (restingBP > 120) recs.push({ icon: '🧂', title: 'Pre-Hypertension Prevention', desc: 'Elevated BP range. Adopt DASH diet, limit caffeine and alcohol, practice deep breathing exercises. Monitor BP weekly at home.' });

  // ===== CHOLESTEROL =====
  if (cholesterol > 300) recs.push({ icon: '💊', title: 'Aggressive Lipid Therapy', desc: 'Very high cholesterol (>300 mg/dL). High-intensity statin therapy recommended alongside lifestyle changes. Target LDL reduction of 50%+. Recheck lipids in 6-8 weeks.' });
  else if (cholesterol > 240) recs.push({ icon: '🥗', title: 'Cholesterol Reduction Plan', desc: 'Borderline-high cholesterol. Eat oats, nuts, olive oil, fatty fish (omega-3). Limit red meat, fried foods, trans fats. Add 30g/day soluble fiber. Consider statin discussion.' });
  else if (cholesterol > 200) recs.push({ icon: '🥑', title: 'Heart-Healthy Diet', desc: 'Near-borderline cholesterol. Mediterranean diet recommended: olive oil, whole grains, vegetables, legumes, fish. Limit processed foods and added sugars.' });

  // ===== BLOOD SUGAR =====
  if (fastingBS) recs.push({ icon: '🍎', title: 'Glycemic Control Program', desc: 'Elevated fasting blood sugar (>120 mg/dL) doubles cardiac risk. Check HbA1c levels. Low-glycemic diet, regular exercise, and metformin consideration. Monitor glucose daily.' });

  // ===== CHEST PAIN TYPE =====
  if (chestPain === 'ASY') recs.push({ icon: '🔍', title: 'Silent Ischemia Screening', desc: 'Asymptomatic chest pain is paradoxically the highest-risk type (80% HD rate). Schedule exercise stress test — silent ischemia means disease can progress undetected.' });
  if (chestPain === 'TA') recs.push({ icon: '💊', title: 'Anti-Anginal Medication Review', desc: 'Typical angina pattern detected. Discuss nitroglycerin (sublingual) for acute episodes. Consider beta-blockers or calcium channel blockers for prevention.' });

  // ===== ECG =====
  if (restingECG === 'ST') recs.push({ icon: '📈', title: 'ST-T Wave Follow-up', desc: 'ST-T wave abnormality on resting ECG. Suggests possible left ventricular strain or ischemia. Recommend serial ECGs and cardiac enzyme panel (troponin).' });
  if (restingECG === 'LVH') recs.push({ icon: '🫀', title: 'Left Ventricular Assessment', desc: 'LVH on ECG often caused by chronic hypertension. Echocardiogram recommended to assess wall thickness, ejection fraction, and diastolic function.' });

  // ===== DEMOGRAPHICS =====
  if (features.Sex_M && age > 45) recs.push({ icon: '🩺', title: 'Annual Cardiac Check-up', desc: 'Males 45+ have significantly elevated cardiovascular risk. Annual lipid panel, fasting glucose, BP monitoring, and cardiac risk scoring recommended.' });
  else if (features.Sex_M) recs.push({ icon: '🩺', title: 'Preventive Screening', desc: 'Males have 2.4x higher heart disease risk. Baseline cardiac screening by age 40. Focus on maintaining healthy weight, diet, and regular exercise.' });

  if (age > 65) recs.push({ icon: '🧓', title: 'Geriatric Cardiology Care', desc: 'Senior cardiac risk management: balance medication side effects, fall prevention, supervised gentle exercise (tai chi, walking), regular cognitive screening alongside cardiac care.' });
  else if (age > 55) recs.push({ icon: '🧘', title: 'Stress & Age Management', desc: 'Age-related cardiac changes are modifiable. Practice meditation, yoga, or deep breathing 15 min/day. Maintain social connections — loneliness increases cardiac risk by 29%.' });

  // ===== ALWAYS ADD LIFESTYLE RECS =====
  if (riskPct >= 40) {
    recs.push({ icon: '🥦', title: 'Anti-Inflammatory Diet', desc: 'Adopt anti-inflammatory eating: berries, leafy greens, fatty fish, turmeric, ginger, green tea. Avoid processed meats, refined sugars, and excessive alcohol.' });
    recs.push({ icon: '😴', title: 'Sleep Optimization', desc: 'Poor sleep increases cardiac risk by 45%. Aim for 7-8 hours, maintain consistent sleep schedule, avoid screens 1hr before bed. Screen for sleep apnea if snoring.' });
  }
  recs.push({ icon: '🚭', title: 'Healthy Lifestyle Blueprint', desc: 'No smoking, limit alcohol to 1 drink/day, maintain BMI 18.5-24.9, walk 10,000 steps daily, stay hydrated (2-3L water/day), and practice gratitude journaling.' });
  recs.push({ icon: '🧠', title: 'Mental Wellness & Heart Health', desc: 'Depression and anxiety increase cardiac events by 30%. Practice mindfulness, maintain hobbies, build strong social support networks. Consider therapy if needed.' });

  const recsToShow = recs.slice(0, 8);
  document.getElementById('recs-container').innerHTML = recsToShow.map(r => `
    <div class="rec-card">
      <div class="rec-icon">${r.icon}</div>
      <div class="rec-title">${r.title}</div>
      <div class="rec-desc">${r.desc}</div>
    </div>
  `).join('');

  // Show results
  document.getElementById('results-section').classList.add('show');
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // ===== SAVE TO LOCALSTORAGE =====
  const patientName = document.getElementById('patient-name').value.trim() || 'Anonymous';
  const patientEmail = document.getElementById('patient-email').value.trim();
  const patientPhone = document.getElementById('patient-phone').value.trim();
  const patientId = 'p_' + Date.now();

  const record = {
    id: patientId, name: patientName, email: patientEmail, phone: patientPhone,
    timestamp: new Date().toISOString(),
    inputs: { age, sex, chestPain, restingBP, cholesterol, fastingBS, restingECG, maxHR, exerciseAngina, oldpeak, stSlope },
    riskPct, riskLevel, riskClass,
    recs: recsToShow, factorContribs,
    doctorNotes: '', flagged: false
  };

  let patients = JSON.parse(localStorage.getItem('heartguard_patients') || '[]');
  patients.unshift(record);
  localStorage.setItem('heartguard_patients', JSON.stringify(patients));
  window._lastPatientId = patientId;

  // Check if doctor notes exist for this patient (by name match)
  checkDoctorNotes(patientName);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  animateDashboard();
  // Animate stat counters
  document.querySelectorAll('.stat-value[data-target]').forEach(el => {
    animateCounter(el, parseFloat(el.dataset.target), el.dataset.suffix || '');
  });
});

// ===== DIAGNOSES TAB SWITCHING =====
function switchDxTab(tab) {
  document.querySelectorAll('.dx-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.dx-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('dx-' + (tab === 'doctor' ? 'doctor' : 'patient')).classList.add('active');
  if (tab === 'doctor') loadPatientQueue();
}

// ===== DOCTOR PORTAL: PATIENT QUEUE =====
function getPatients() {
  return JSON.parse(localStorage.getItem('heartguard_patients') || '[]');
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function loadPatientQueue() {
  const patients = getPatients();
  const container = document.getElementById('patient-queue');
  if (patients.length === 0) {
    container.innerHTML = `<div class="queue-empty"><div style="font-size:48px;margin-bottom:12px;">🏥</div><p>No patients analyzed yet.</p><p style="font-size:11px;margin-top:6px;color:var(--text-secondary);">Patients will appear here after they complete their analysis in the Patient Portal.</p></div>`;
    return;
  }

  container.innerHTML = patients.map((p, i) => {
    const date = new Date(p.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const riskCls = p.riskPct >= 70 ? 'high' : p.riskPct >= 40 ? 'moderate' : 'low';
    const riskLabel = p.riskPct >= 70 ? 'HIGH' : p.riskPct >= 40 ? 'MODERATE' : 'LOW';
    const flagIcon = p.flagged ? ' ⚠️' : '';
    return `<div class="pq-card" onclick="selectPatient(${i})" id="pq-${i}">
      <div class="pq-top">
        <div class="pq-avatar">${getInitials(p.name)}</div>
        <div>
          <div class="pq-name">${p.name}${flagIcon}</div>
          <div class="pq-date">${date}</div>
        </div>
      </div>
      <div class="pq-bottom">
        <span class="pq-risk ${riskCls}">${riskLabel} RISK</span>
        <span class="pq-pct" style="color:${riskCls === 'high' ? '#ef4444' : riskCls === 'moderate' ? '#f59e0b' : '#22c55e'}">${p.riskPct}%</span>
      </div>
    </div>`;
  }).join('');
}

// ===== DOCTOR PORTAL: SELECT PATIENT =====
let _selectedPatientIndex = -1;

function selectPatient(index) {
  _selectedPatientIndex = index;
  const patients = getPatients();
  const p = patients[index];
  if (!p) return;

  // Highlight card
  document.querySelectorAll('.pq-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('pq-' + index).classList.add('selected');

  // Show detail panel
  document.getElementById('doctor-no-selection').style.display = 'none';
  document.getElementById('doctor-patient-detail').style.display = 'block';

  // Patient header
  document.getElementById('doc-avatar').textContent = getInitials(p.name);
  document.getElementById('doc-patient-name').textContent = p.name;
  const dateStr = new Date(p.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  document.getElementById('doc-patient-meta').textContent = `${p.inputs.sex === 'M' ? 'Male' : 'Female'} • Age ${p.inputs.age} • ${p.email || 'No email'} • ${dateStr}`;

  const badge = document.getElementById('doc-risk-badge');
  badge.textContent = p.riskLevel;
  badge.className = 'risk-badge ' + p.riskClass;

  // Clinical summary
  const inp = p.inputs;
  const clinicalItems = [
    { label: 'Age', value: inp.age + ' yrs' },
    { label: 'Sex', value: inp.sex === 'M' ? '♂ Male' : '♀ Female' },
    { label: 'Chest Pain', value: inp.chestPain },
    { label: 'Resting BP', value: inp.restingBP + ' mmHg' },
    { label: 'Cholesterol', value: inp.cholesterol + ' mg/dL' },
    { label: 'Fasting BS', value: inp.fastingBS ? 'High (>120)' : 'Normal' },
    { label: 'Resting ECG', value: inp.restingECG },
    { label: 'Max HR', value: inp.maxHR + ' bpm' },
    { label: 'Exercise Angina', value: inp.exerciseAngina },
    { label: 'Oldpeak', value: inp.oldpeak },
    { label: 'ST Slope', value: inp.stSlope },
    { label: 'Risk Score', value: p.riskPct + '%' }
  ];
  document.getElementById('doc-clinical-grid').innerHTML = clinicalItems.map(c =>
    `<div class="doc-clinical-pill"><div class="pill-label">${c.label}</div><div class="pill-value">${c.value}</div></div>`
  ).join('');

  // Risk factors
  if (p.factorContribs && p.factorContribs.length) {
    const maxC = Math.max(...p.factorContribs.map(f => f.value), 0.01);
    document.getElementById('doc-factors-container').innerHTML = p.factorContribs.map(f => {
      const pct = (f.value / maxC) * 100;
      const color = pct > 60 ? '#e74c3c' : pct > 30 ? '#f39c12' : '#2ecc71';
      return `<div class="factor-row"><span class="factor-name">${f.name}</span><div class="factor-bar-track"><div class="factor-bar-fill" style="width:${pct}%;background:${color}"></div></div><span class="factor-impact" style="color:${color}">${f.value.toFixed(2)}</span></div>`;
    }).join('');
  }

  // Recommendations
  if (p.recs && p.recs.length) {
    document.getElementById('doc-recs-container').innerHTML = p.recs.map(r =>
      `<div class="rec-card"><div class="rec-icon">${r.icon}</div><div class="rec-title">${r.title}</div><div class="rec-desc">${r.desc}</div></div>`
    ).join('');
  }

  // Load existing notes
  document.getElementById('doctor-assessment').value = p.doctorNotes || '';
}

// ===== DOCTOR ACTIONS =====
function saveDoctorNotes() {
  if (_selectedPatientIndex < 0) return;
  const patients = getPatients();
  patients[_selectedPatientIndex].doctorNotes = document.getElementById('doctor-assessment').value;
  patients[_selectedPatientIndex].notesDate = new Date().toISOString();
  localStorage.setItem('heartguard_patients', JSON.stringify(patients));
  showToast('doc-save-toast', '✅ Notes saved successfully!');
}

function contactPatient() {
  if (_selectedPatientIndex < 0) return;
  const p = getPatients()[_selectedPatientIndex];
  const contact = p.email || p.phone || 'No contact info';
  showToast('doc-save-toast', `📞 Contact: ${contact}`);
}

function flagFollowup() {
  if (_selectedPatientIndex < 0) return;
  const patients = getPatients();
  patients[_selectedPatientIndex].flagged = !patients[_selectedPatientIndex].flagged;
  localStorage.setItem('heartguard_patients', JSON.stringify(patients));
  const status = patients[_selectedPatientIndex].flagged ? '⚠️ Patient flagged for follow-up' : '✅ Flag removed';
  showToast('doc-save-toast', status);
  loadPatientQueue();
  document.getElementById('pq-' + _selectedPatientIndex).classList.add('selected');
}

function showToast(id, msg) {
  const toast = document.getElementById(id);
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ===== PATIENT VIEW: CHECK DOCTOR NOTES =====
function checkDoctorNotes(patientName) {
  const patients = getPatients();
  // Find the most recent entry for this patient that has doctor notes
  const noted = patients.find(p => p.name.toLowerCase() === patientName.toLowerCase() && p.doctorNotes);
  const container = document.getElementById('patient-doctor-notes');
  if (noted && noted.doctorNotes) {
    container.style.display = 'block';
    document.getElementById('doctor-note-text').textContent = noted.doctorNotes;
    document.getElementById('doctor-note-date').textContent = noted.notesDate ? new Date(noted.notesDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    document.getElementById('doctor-note-flag').style.display = noted.flagged ? 'block' : 'none';
  } else {
    container.style.display = 'none';
  }
}
