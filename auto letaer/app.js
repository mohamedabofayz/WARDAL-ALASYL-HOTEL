// Replace with your Google Apps Script URL
const API_URL = "https://script.google.com/macros/s/AKfycbwd-SVM2KkPoER7wLasGDFcui6kNAVQNHImdG-uQv0x0IOoxCYtYOn04smiLe2PMYUc/exec";

let templatesData = [];
let currentLang = 'ar';

const translations = {
    ar: {
        subtitle: "نظام أتمتة المستندات الذكية",
        tabNew: "مستند جديد",
        tabHistory: "سجل العمليات",
        labelTemplate: "اختيار قالب المستند",
        optLoading: "جاري تحميل القوالب...",
        optSelect: "-- اختر القالب --",
        logLoading: "جاري المزامنة...",
        logEmpty: "السجل فارغ",
        btnSubmit: "إنشاء وحفظ المستند",
        loadStart: "بدء المعالجة الذكية...",
        loadSub: "يرجى الانتظار، نقوم بتجهيز ملفك الآن",
        successMsg: "تم إنشاء المستند بنجاح!",
        errorMsg: "حدث خطأ غير متوقع",
        calendarG: "ميلادي",
        calendarH: "هجري",
        hijriMonths: ["المحرم", "صفر", "ربيع الأول", "ربيع الثاني", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"],
        statusSteps: [
            "جاري تجهيز البيانات...",
            "جاري مطابقة القالب...",
            "جاري إنشاء نسخة مؤقتة...",
            "جاري استبدال النصوص...",
            "جاري تحويل الملف إلى PDF...",
            "اكتملت العملية بنجاح!"
        ]
    },
    en: {
        subtitle: "Smart Document Automation System",
        tabNew: "New Document",
        tabHistory: "History Log",
        labelTemplate: "Select Document Template",
        optLoading: "Loading templates...",
        optSelect: "-- Select Template --",
        logLoading: "Syncing history...",
        logEmpty: "No history found",
        btnSubmit: "Create & Save Document",
        loadStart: "Starting automation...",
        loadSub: "Please wait, your file is being prepared",
        successMsg: "Document created successfully!",
        errorMsg: "An unexpected error occurred",
        calendarG: "Gregorian",
        calendarH: "Hijri",
        hijriMonths: ["Muharram", "Safar", "Rabi I", "Rabi II", "Jumada I", "Jumada II", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"],
        statusSteps: [
            "Preparing data...",
            "Matching template...",
            "Creating temporary copy...",
            "Replacing text...",
            "Converting to PDF...",
            "Operation completed successfully!"
        ]
    },
    ur: {
        subtitle: "سمارٹ دستاویز آٹومیشن سسٹم",
        tabNew: "نئی دستاویز",
        tabHistory: "ہسٹری لاگ",
        labelTemplate: "دستاویز ٹیمپلیٹ منتخب کریں",
        optLoading: "ٹیمپلیٹس لوڈ ہو رہے ہیں...",
        optSelect: "-- ٹیمپلیٹ منتخب کریں --",
        logLoading: "ہسٹری سنک ہو رہی ہے...",
        logEmpty: "کوئی ریکارڈ نہیں ملا",
        btnSubmit: "دستاویز بنائیں اور محفوظ کریں",
        loadStart: "پروسیسنگ شروع ہو رہی ہے...",
        loadSub: "براہ کرم انتظار کریں، آپ کی فائل تیار ہو رہی ہے",
        successMsg: "دستاویز کامیابی سے بن گئی!",
        errorMsg: "غیر متوقع غلطی پیش آگئی",
        calendarG: "عیسوی",
        calendarH: "ہجری",
        hijriMonths: ["محرم", "صفر", "ربیع الاول", "ربیع الثانی", "جمادی الاول", "جمادی الثانی", "رجب", "شعبان", "رمضان", "شوال", "ذی القعدہ", "ذی الحجہ"],
        statusSteps: [
            "ڈیٹا تیار ہو رہا ہے...",
            "ٹیمپلیٹ میچ ہو رہا ہے...",
            "عارضی کاپی بن رہی ہے...",
            "متن تبدیل ہو رہا ہے...",
            "پی ڈی ایف میں تبدیل ہو رہا ہے...",
            "آپریشن کامیابی سے مکمل ہوا!"
        ]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    fetchTemplates();
    fetchHistory();
    setLanguage('ar'); // Default
});

function setLanguage(lang) {
    currentLang = lang;
    
    // Update direction
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'en') ? 'ltr' : 'rtl';
    document.body.style.direction = (lang === 'en') ? 'ltr' : 'rtl';

    // Update active button UI
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const btnIdx = lang === 'ar' ? 1 : (lang === 'en' ? 2 : 3);
    document.querySelector(`.lang-btn:nth-child(${btnIdx})`).classList.add('active');

    // Update UI text
    document.getElementById('ui-subtitle').innerText = translations[lang].subtitle;
    document.getElementById('tab-new').innerText = translations[lang].tabNew;
    document.getElementById('tab-history').innerText = translations[lang].tabHistory;
    document.getElementById('label-template').innerText = translations[lang].labelTemplate;
    document.getElementById('btn-submit').innerText = translations[lang].btnSubmit;
    document.getElementById('load-status').innerText = translations[lang].loadStart;
    document.getElementById('load-subtext').innerText = translations[lang].loadSub;

    // Update existing date toggles and Hijri pickers
    document.querySelectorAll('.date-toggle').forEach(toggle => {
        const fieldName = toggle.nextElementSibling.id.replace('container-', '');
        toggle.querySelector('.date-btn:nth-child(1)').innerText = translations[lang].calendarG;
        toggle.querySelector('.date-btn:nth-child(2)').innerText = translations[lang].calendarH;
    });

    document.querySelectorAll('.hijri-input-group').forEach(group => {
        const monthSelect = group.querySelector('.hijri-month');
        const currentIdx = monthSelect.selectedIndex;
        monthSelect.innerHTML = translations[lang].hijriMonths.map(m => `<option value="${m}">${m}</option>`).join('');
        monthSelect.selectedIndex = currentIdx;
    });

    // Refresh dynamic parts
    const select = document.getElementById('templateSelect');
    if (select.value === "") {
        select.innerHTML = `<option value="">${translations[lang].optSelect}</option>`;
        fetchTemplates(); // Re-populate with translated template names if possible
    }
}

function switchView(viewName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    
    if (viewName === 'create') {
        document.querySelector('.tab:nth-child(1)').classList.add('active');
        document.getElementById('create-view').classList.add('active');
        document.getElementById('footer-action').style.display = 'block';
    } else {
        document.querySelector('.tab:nth-child(2)').classList.add('active');
        document.getElementById('history-view').classList.add('active');
        document.getElementById('footer-action').style.display = 'none';
        fetchHistory();
    }
}

async function fetchTemplates() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        templatesData = data;
        const select = document.getElementById('templateSelect');
        const currentVal = select.value;
        
        select.innerHTML = `<option value="">${translations[currentLang].optSelect}</option>`;
        data.forEach((tpl, index) => {
            let option = document.createElement('option');
            option.value = index;
            option.text = `${tpl['نوع القالب']} - ${tpl['لغة القالب']} - ${tpl['شركة القالب']}`;
            select.appendChild(option);
        });
        select.value = currentVal;
    } catch (e) {
        console.error(e);
    }
}

async function fetchHistory() {
    const log = document.getElementById('activityLog');
    try {
        const response = await fetch(`${API_URL}?action=getHistory`);
        const data = await response.json();
        if (data.length === 0) {
            log.innerHTML = `<p style="text-align: center; color: var(--text-low); padding: 3rem;">${translations[currentLang].logEmpty}</p>`;
            return;
        }
        log.innerHTML = data.map(item => `
            <div class="log-item">
                <div class="log-info">
                    <h4>${item.clientName}</h4>
                    <p>${new Date(item.date).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'ar-EG')}</p>
                </div>
                <a href="${item.pdfUrl}" target="_blank" class="log-action">
                    <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                </a>
            </div>
        `).join('');
    } catch (e) {
        log.innerHTML = `<p style="text-align: center; color: var(--text-low);">${translations[currentLang].errorMsg}</p>`;
    }
}

document.getElementById('templateSelect').addEventListener('change', function() {
    const container = document.getElementById('dynamicFields');
    container.innerHTML = '';
    if (this.value === "") return;
    
    const tpl = templatesData[this.value];
    document.getElementById('templateId').value = tpl['معرف القالب'];
    document.getElementById('templateType').value = tpl['نوع القالب'];
    document.getElementById('templateLang').value = tpl['لغة القالب'];
    document.getElementById('templateCompany').value = tpl['شركة القالب'];

    // Metadata fields to exclude
    const exclude = ['معرف القالب', 'نوع القالب', 'لغة القالب', 'شركة القالب'];
    
    Object.keys(tpl).forEach(field => {
        if (exclude.includes(field)) return; // Skip metadata
        
        if (tpl[field] === true || tpl[field] === "TRUE" || tpl[field] === "true") {
            const isDate = field.includes('تاريخ');
            let div = document.createElement('div');
            div.className = 'form-group';

            if (isDate) {
                div.innerHTML = `
                    <label>${field}</label>
                    <div class="date-toggle">
                        <button type="button" class="date-btn active" onclick="toggleCalendar(this, 'gregorian', '${field}')">${translations[currentLang].calendarG}</button>
                        <button type="button" class="date-btn" onclick="toggleCalendar(this, 'hijri', '${field}')">${translations[currentLang].calendarH}</button>
                    </div>
                    <div id="container-${field}">
                        <input type="date" name="${field}" required>
                    </div>
                `;
            } else {
                div.innerHTML = `<label>${field}</label>
                                 <input type="text" name="${field}" required>`;
            }
            container.appendChild(div);
        }
    });
});

function toggleCalendar(btn, type, fieldName) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const container = document.getElementById(`container-${fieldName}`);
    if (type === 'hijri') {
        container.innerHTML = createHijriPicker(fieldName);
    } else {
        container.innerHTML = `<input type="date" name="${fieldName}" required>`;
    }
}

function createHijriPicker(fieldName) {
    const days = Array.from({length: 30}, (_, i) => i + 1);
    const months = translations[currentLang].hijriMonths;
    const currentHijriYear = 1445; 
    const years = Array.from({length: 10}, (_, i) => currentHijriYear - 5 + i);

    return `
        <div class="hijri-input-group" data-hijri-field="${fieldName}">
            <select class="hijri-day" required>
                ${days.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
            <select class="hijri-month" required>
                ${months.map((m, i) => `<option value="${m}">${m}</option>`).join('')}
            </select>
            <select class="hijri-year" required>
                ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
            </select>
            <input type="hidden" name="${fieldName}" class="hijri-combined">
        </div>
    `;
}

async function startGamifiedLoading() {
    const overlay = document.getElementById('gamified-loading');
    const pctLabel = document.getElementById('load-pct');
    const bar = document.getElementById('load-bar');
    const status = document.getElementById('load-status');
    
    overlay.style.display = 'flex';
    
    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 90) {
            progress += Math.floor(Math.random() * 5) + 2;
            if (progress > 90) progress = 90;
            
            pctLabel.innerText = `${progress}%`;
            bar.style.width = `${progress}%`;
            
            if (progress % 15 === 0) {
                const stepIdx = Math.floor(progress / 15);
                status.innerText = translations[currentLang].statusSteps[stepIdx] || translations[currentLang].statusSteps[0];
            }
        }
    }, 400);

    return { interval, overlay, pctLabel, bar, status };
}

document.getElementById('docForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Combine Hijri dates before submission
    document.querySelectorAll('.hijri-input-group').forEach(group => {
        const d = group.querySelector('.hijri-day').value;
        const m = group.querySelector('.hijri-month').value;
        const y = group.querySelector('.hijri-year').value;
        group.querySelector('.hijri-combined').value = `${d} ${m} ${y} هـ`;
    });

    const loading = await startGamifiedLoading();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await response.json();

        clearInterval(loading.interval);
        loading.pctLabel.innerText = "100%";
        loading.bar.style.width = "100%";
        loading.status.innerText = translations[currentLang].statusSteps[5];
        
        setTimeout(() => {
            loading.overlay.style.display = 'none';
            if (result.status === 'success') {
                alert(translations[currentLang].successMsg);
                this.reset();
                document.getElementById('dynamicFields').innerHTML = '';
                switchView('history');
            } else {
                alert(result.message);
            }
        }, 1000);

    } catch (error) {
        clearInterval(loading.interval);
        loading.overlay.style.display = 'none';
        alert(translations[currentLang].errorMsg);
    }
});
