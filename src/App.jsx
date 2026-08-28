import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* مسار لوحة تحكم الصيدلي */}
        <Route path="/" element={<AdminDashboard />} />
        
        {/* مسار صفحة المريض باستخدام الـ UUID الخاص به */}
        <Route path="/patient/:qrUuid" element={<PatientOrderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// ==========================================
// 1. لوحة تحكم الصيدلي (Admin Dashboard)
// ==========================================
function AdminDashboard() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // نظام الأدوية الديناميكي
  const [medicationsList, setMedicationsList] = useState([]);
  const [currentMedName, setCurrentMedName] = useState('');
  const [currentMedDosage, setCurrentMedDosage] = useState('');
  
  const [generatedData, setGeneratedData] = useState(null);
  const [loading, setLoading] = useState(false);

  // دالة تنظيف ومراقبة إدخال الاسم (حروف فقط)
  const handleNameChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '');
    setFullName(value);

    if (value.length > 0 && value.length < 3) {
      setErrorMsg('الاسم يجب أن يكون 3 أحرف على الأقل');
    } else {
      setErrorMsg('');
    }
  };

  // دالة تنظيف رقم الهاتف (أرقام فقط)
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    setPhoneNumber(value);
  };

  // دالة إضافة دواء للقائمة المؤقتة
  const handleAddMedication = () => {
    if (currentMedName.trim() === '') return;
    
    const newMed = {
      id: Date.now(),
      name: currentMedName.trim(),
      dosage: currentMedDosage.trim() || 'الجرعة الاعتيادية',
      price: 0
    };

    setMedicationsList([...medicationsList, newMed]);
    setCurrentMedName('');
    setCurrentMedDosage('');
  };

  // دالة إزالة دواء من القائمة
  const handleRemoveMedication = (id) => {
    setMedicationsList(medicationsList.filter(med => med.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = fullName.trim();

    if (cleanName.length < 3) {
      setErrorMsg('يرجى إدخال اسم صحيح قبل الحفظ');
      return;
    }

    setLoading(true);
    const newUuid = uuidv4();

    try {
      await axios.post('https://pharmacy-api-63y1.vercel.app/api/patients', {
        qr_uuid: newUuid,
        full_name: cleanName,
        phone_number: phoneNumber, 
        medications: medicationsList
      });

      const patientUrl = `${window.location.origin}/patient/${newUuid}`;
      // تمرير قائمة الأدوية لقسم الطباعة
      setGeneratedData({ name: cleanName, url: patientUrl, medications: [...medicationsList] });
      
      setFullName('');
      setPhoneNumber('');
      setMedicationsList([]);
      setErrorMsg('');
    } catch (error) {
      console.error("خطأ في الحفظ:", error);
      alert("حدث خطأ أثناء الحفظ. تأكد أن السيرفر يعمل.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {/* CSS الطباعة الحرارية المطور - يدعم تعدد الملصقات */}
    <style type="text/css">
      {`
        @media print {
          @page {
            size: 4cm 7cm;
            margin: 0;
          }
          html, body {
            width: 4cm;
            margin: 0 !important;
            padding: 0 !important;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          /* تنسيق صفحة الملصق الواحد - 3cm عرض × 5cm طول */
          .sticker-print-page {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            width: 4cm;
            height: 7cm;
            padding: 1.5mm 1mm 1mm 1mm;
            box-sizing: border-box;
              /* السطر السحري لفصل كل دواء في ملصق لوحده */
            page-break-after: always;
            break-after: page;
            font-family: Arial, sans-serif;
            text-align: center;
            overflow: hidden;
          }
          
          /* أحجام الخطوط المضبوطة لمقاس 4×7 سم */
          .p-title  { font-size: 6pt;   font-weight: bold; margin: 0 0 1mm 0;   line-height: 1.2; }
          .p-name   { font-size: 7pt;   font-weight: bold; margin: 0 0 0.8mm 0; line-height: 1.2; }
          .p-med    { font-size: 6.5pt; font-weight: 900; margin: 0 0 0.5mm 0; line-height: 1.2; }
          .p-dos    { font-size: 6pt;   font-weight: 600; margin: 0 0 1mm 0;   line-height: 1.2; }
          .p-scan   { font-size: 5.5pt; margin: 1mm 0 0 0;   line-height: 1.2; }
          .qr-img   { width: 3.2cm !important; height: 3.2cm !important; display: block; margin: 1.5mm auto; }
        }
      `}
    </style>

    <div className="no-print min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
          💊 إضافة مريض جديد
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">اسم المريض (حروف فقط)</label>
            <input 
              type="text" required maxLength={40} value={fullName} onChange={handleNameChange}
              className={`w-full border rounded-xl p-3 outline-none transition-all ${errorMsg ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'}`}
              placeholder="مثال: أحمد محمود" autoComplete="off"
            />
            {errorMsg && <p className="text-red-500 text-sm mt-1 font-semibold">{errorMsg}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">رقم الهاتف (واتساب)</label>
            <input 
              type="tel" required maxLength={15} value={phoneNumber} onChange={handlePhoneChange}
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="مثال: 010xxxxxxxx" autoComplete="off"
            />
          </div>

          <div className="border-t pt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-gray-800 font-bold mb-3">إضافة أدوية المريض (الروشتة):</label>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input 
                type="text" value={currentMedName} onChange={(e) => setCurrentMedName(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="اسم الدواء (مثال: كونكور 5)" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMedication(); } }}
              />
              <input 
                type="text" value={currentMedDosage} onChange={(e) => setCurrentMedDosage(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="الجرعة (اختياري)" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMedication(); } }}
              />
              <button 
                type="button" onClick={handleAddMedication} disabled={currentMedName.trim() === ''}
                className="bg-gray-800 hover:bg-black text-white font-bold px-4 py-2.5 rounded-lg transition-all disabled:bg-gray-400"
              >
                إضافة
              </button>
            </div>
            {medicationsList.length > 0 ? (
              <div className="space-y-2 mt-4">
                {medicationsList.map((med, index) => (
                  <div key={med.id} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm">{index + 1}</span>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{med.name}</p>
                        <p className="text-xs text-gray-500">{med.dosage}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleRemoveMedication(med.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all">
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm mt-4">لم يتم إضافة أدوية حتى الآن.</p>
            )}
          </div>

          <button 
            type="submit" disabled={loading || errorMsg.length > 0 || fullName.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:bg-gray-400 mt-4"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ البيانات وتوليد الـ QR Code'}
          </button>
        </form>

        {generatedData && (
          <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col items-center">
            <h2 className="text-lg font-bold text-emerald-700 mb-3">✅ تم ربط المريض والأدوية بنجاح!</h2>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 mb-4" style={{display:'inline-block'}}>
              <QRCodeCanvas value={generatedData.url} size={300} level={"H"} style={{width:'113px',height:'113px'}} />
            </div>
            <button 
              onClick={() => window.print()}
              className="bg-gray-900 hover:bg-black text-white font-bold py-2 px-6 rounded-xl transition-all flex items-center gap-2"
            >
              طباعة الملصقات
            </button>
          </div>
        )}
      </div>
    </div>

    {/* قسم الطباعة الديناميكي المخفي عن الشاشة */}
    {generatedData && (
      <div className="hidden print:block">
        {generatedData.medications && generatedData.medications.length > 0 ? (
          // عمل حلقة تكرار لطباعة ملصق منفصل لكل دواء
          generatedData.medications.map((med, index) => (
            <div key={index} className="sticker-print-page">
              {/* ترتيب مطابق للصورة: لوجو → اسم مريض → دواء → استخدام → QR → فوتر */}
              <p className="p-title">صيدلية الطيب</p>
              <p className="p-name">اسم المريض: {generatedData.name}</p>
              <p className="p-med">اسم الدواء: {med.name}</p>
              <p className="p-dos">الاستخدام: {med.dosage}</p>
              {/* QR Code كبير يملأ المساحة */}
              <QRCodeCanvas value={generatedData.url} size={300} level="H" className="qr-img" />
              <p className="p-scan">دايم طيب ♥</p>
            </div>
          ))
        ) : (
          // ملصق افتراضي في حالة عدم وجود أدوية
          <div className="sticker-print-page">
            <p className="p-title">صيدلية الطيب</p>
            <p className="p-name">اسم المريض: {generatedData.name}</p>
            <QRCodeCanvas value={generatedData.url} size={300} level="H" className="qr-img" />
            <p className="p-scan">دايم طيب ♥</p>
          </div>
        )}
      </div>
    )}
    </>
  );
}

// ==========================================
// 2. صفحة المريض (Patient Order Page)
// ==========================================
function PatientOrderPage() {
  const { qrUuid } = useParams(); // التقاط الكود المشفر من الرابط
  const [patientData, setPatientData] = useState(null);
  const [selectedMeds, setSelectedMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // جلب بيانات المريض وأدويته من الـ Backend
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await axios.get(`https://pharmacy-api-63y1.vercel.app/api/patient/${qrUuid}`);
        if (response.data.success) {
          setPatientData(response.data.data);
          // تحديد كل الأدوية تلقائياً كمبدأ افتراضي لتسهيل الطلب
          setSelectedMeds(response.data.data.medications.map(med => med.id));
        }
      } catch (err) {
        console.error("خطأ في جلب البيانات:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [qrUuid]);

  // إدارة اختيار الأدوية
  const toggleMedication = (id) => {
    setSelectedMeds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // إرسال الطلب عبر الواتساب
  const handleWhatsAppOrder = () => {
    const pharmacyPhone = "+966595643148"; // ضع رقم واتساب الصيدلية هنا
    const orderedMeds = patientData.medications.filter(med => selectedMeds.includes(med.id));

    let message = `مرحباً، أنا المريض: *${patientData.patientInfo.name}*\n`;
    message += `أريد طلب الأدوية التالية:\n\n`;

    orderedMeds.forEach((med, index) => {
      message += `${index + 1}. *${med.name}\n`;
    });

    message += `\nيرجى تجهيز الطلب في أسرع وقت. شكراً!`;

    const encodedMessage = encodeURIComponent(message);
    window.location.href = `https://wa.me/${pharmacyPhone}?text=${encodedMessage}`;
  };

  if (loading) return <div className="text-center p-20 text-blue-600 font-bold text-lg">جاري تحميل أدويتك...</div>;
  if (error || !patientData) return <div className="text-center p-20 text-red-500 font-bold text-lg">عذراً، الرابط غير صالح أو انتهت صلاحيته.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans flex justify-center items-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-gray-800">أهلاً بك، {patientData.patientInfo.name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">حدد الأدوية التي ترغب في تجديدها هذا الشهر:</p>
        </div>

        <div className="space-y-3 mb-6">
          {patientData.medications.length === 0 ? (
            <p className="text-center text-gray-400 py-4">لا توجد أدوية مسجلة حالياً.</p>
          ) : (
            patientData.medications.map((med) => {
              const isSelected = selectedMeds.includes(med.id);
              return (
                <div 
                  key={med.id}
                  onClick={() => toggleMedication(med.id)}
                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => {}} // يتم التحكم بها عبر الـ Div الأب
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="mr-4 flex-1">
                    <h3 className="font-bold text-gray-800">{med.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{med.dosage || 'الجرعة الاعتيادية'}</p>
                  </div>
                  <div className="text-sm font-bold text-blue-600">{med.price} ج.م</div>
                </div>
              );
            })
          )}
        </div>

        <button 
          onClick={handleWhatsAppOrder}
          disabled={selectedMeds.length === 0}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-emerald-200 disabled:bg-gray-300 disabled:shadow-none flex items-center justify-center gap-2"
        >
          <span>إرسال الطلب عبر واتساب</span>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
        </button>

      </div>
    </div>
  );
}

export default App;