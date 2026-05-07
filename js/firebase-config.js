// ============================================
// FIREBASE CONFIG — Real Connection (ES Module)
// ============================================
// Firebase v10+ via gstatic CDN
// Bu fayl module sifatida yuklanadi: <script type="module" src="js/firebase-config.js">

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmyN8J6PeKU8k25rXdI657r0FvfXlVU0o",
  authDomain: "alxorezmiy-school.firebaseapp.com",
  projectId: "alxorezmiy-school",
  storageBucket: "alxorezmiy-school.firebasestorage.app",
  messagingSenderId: "156536938530",
  appId: "1:156536938530:web:edde5fbdef4b2deab0ea7b",
  measurementId: "G-DG11B7MRHR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Boshqa skriptlar uchun global eksport (modul emas faylllar foydalanadi)
window.firebase = { app, auth, db, storage };
window.FIREBASE_CONNECTED = true;

// ============================================
// DEMO DATA — Migratsiya tugagunicha fallback
// ============================================
const DemoData = {
  settings: {
    fullName_uz: 'O\'zbekiston Respublikasi Maktabgacha va maktab ta\'limi vazirligi (MMTV) huzuridagi Ixtisoslashtirilgan ta\'lim muassasalari agentligi (ITMA) tizimidagi Muhammad al-Xorazmiy nomidagi ixtisoslashtirilgan maktabi Nukus filiali',
    fullName_ru: 'Нукусский филиал специализированной школы имени Мухаммада аль-Хорезми при Агентства специализированных образовательных учреждений (АСОУ) Министерства дошкольного и школьного образования Республики Узбекистан (МДШО)',
    fullName_en: 'Nukus branch of the specialized school named after Muhammad al-Khorezmi under the Agency for Specialized Educational Institutions (ASEI) of the Ministry of Preschool and School Education of the Republic of Uzbekistan (MPSE)',
    fullName_kk: 'Ózbekstan Respublikası Mektepke shekemgi hám mektep bilimlendiriw ministrligi (MShMBM) qasındaǵı Qániygelestirilgen bilimlendiriw mákemeleri agentligi (QBMA) jigindegi Muxammed al-Xorezmiy atındaǵı qániygelestirilgen mektebiniń Nókis filialı',
    shortName_uz: 'Muhammad al-Xorazmiy nomidagi ixtisoslashtirilgan maktabining Nukus filiali',
    shortName_ru: 'Нукусский филиал специализированной школы имени Мухаммада аль-Хорезми',
    shortName_en: 'Nukus branch specialized school named after Muhammad al-Khorezmi',
    shortName_kk: 'Muxammed al-Xorezmiy atındaǵı qániygelestirilgen mektebiniń Nókis filialı'
  },
  news: [
    {
      id: '1',
      title_uz: 'Respublika olimpiadasida 5 ta oltin medal',
      title_ru: 'Пять золотых медалей на республиканской олимпиаде',
      title_kk: 'Respublika olimpiadasinda 5 altın medal',
      title_en: '5 Gold Medals at the National Olympiad',
      content_uz: 'Bizning o\'quvchilarimiz 2026-yil respublika olimpiadasida ajoyib natijalar ko\'rsatdi...',
      content_ru: 'Наши ученики показали отличные результаты на республиканской олимпиаде 2026 года...',
      content_kk: 'Bizin\' o\'quvshılarımız 2026-jıl respublika olimpiadasında a\'la na\'tiyjelri ko\'rsetti...',
      content_en: 'Our students showed excellent results at the 2026 National Olympiad...',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=600&h=400&fit=crop',
      category: 'events',
      status: 'published',
      createdAt: '2026-03-28'
    },
    {
      id: '2',
      title_uz: 'Yangi o\'quv yili uchun qabul boshlandi',
      title_ru: 'Начался приём на новый учебный год',
      title_kk: 'Jan\'a oqıw jılı ushın qabıl baslandı',
      title_en: 'Admissions Open for the New Academic Year',
      content_uz: '2026-2027 o\'quv yili uchun qabul jarayoni boshlandi...',
      content_ru: 'Начался процесс приёма на 2026-2027 учебный год...',
      content_kk: '2026-2027 oqıw jılı ushın qabıl jarayını baslandı...',
      content_en: 'The admission process for the 2026-2027 academic year has begun...',
      image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop',
      category: 'announcements',
      status: 'published',
      createdAt: '2026-03-20'
    },
    {
      id: '3',
      title_uz: 'Xalqaro matematika tanlovi natijalari',
      title_ru: 'Результаты международного математического конкурса',
      title_kk: 'Xalıq aralıq matematika tanlawı na\'tiyjeleri',
      title_en: 'International Mathematics Competition Results',
      content_uz: 'O\'quvchilarimiz xalqaro matematika tanlovida ishtirok etdi...',
      content_ru: 'Наши ученики приняли участие в международном математическом конкурсе...',
      content_kk: 'O\'quvshılarımız xalıq aralıq matematika tanlawına qatnastı...',
      content_en: 'Our students participated in the international mathematics competition...',
      image: 'https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=600&h=400&fit=crop',
      category: 'events',
      status: 'published',
      createdAt: '2026-03-15'
    }
  ],

  teachers: [
    { id: '1', name_uz: 'Karimov Alisher Baxtiyorovich', name_ru: 'Каримов Алишер Бахтиёрович', name_kk: 'Karimov Alisher Baxtiyoroviç', name_en: 'Alisher Karimov', subject: 'Matematika', category: 'Oliy toifa', experience: 18, photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop', order: 1 },
    { id: '2', name_uz: 'Rahimova Nodira Saidovna', name_ru: 'Рахимова Нодира Саидовна', name_kk: 'Rahimova Nodira Saidovna', name_en: 'Nodira Rahimova', subject: 'Fizika', category: 'Oliy toifa', experience: 15, photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop', order: 2 },
    { id: '3', name_uz: 'Yusupov Sardor Maxmudovich', name_ru: 'Юсупов Сардор Махмудович', name_kk: 'Yusupov Sardor Maxmudoviç', name_en: 'Sardor Yusupov', subject: 'Informatika', category: '1-toifa', experience: 10, photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop', order: 3 },
    { id: '4', name_uz: 'Abdullayeva Malika Rashidovna', name_ru: 'Абдуллаева Малика Рашидовна', name_kk: 'Abdullayeva Malika Rashidovna', name_en: 'Malika Abdullayeva', subject: 'Kimyo', category: 'Oliy toifa', experience: 20, photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop', order: 4 },
    { id: '5', name_uz: 'Toshmatov Bekzod Erkinovich', name_ru: 'Тошматов Бекзод Эркинович', name_kk: 'Toshmatov Bekzod Erkinoviç', name_en: 'Bekzod Toshmatov', subject: 'Biologiya', category: '1-toifa', experience: 12, photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop', order: 5 },
    { id: '6', name_uz: 'Nazarova Dilnoza Anvarovna', name_ru: 'Назарова Дилноза Анваровна', name_kk: 'Nazarova Dilnoza Anvarovna', name_en: 'Dilnoza Nazarova', subject: 'Ingliz tili', category: 'Oliy toifa', experience: 14, photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop', order: 6 }
  ],

  olympiad: [
    { id: '1', student: 'Ismoilov Jasur', subject: 'Matematika', level: 'respublika', place: 1, olympiad_name: 'Respublika olimpiadasi', year: 2026 },
    { id: '2', student: 'Turgunova Zilola', subject: 'Fizika', level: 'respublika', place: 2, olympiad_name: 'Respublika olimpiadasi', year: 2026 },
    { id: '3', student: 'Ruziyev Azizbek', subject: 'Informatika', level: 'xalqaro', place: 3, olympiad_name: 'IOI 2025', year: 2025 },
    { id: '4', student: 'Kamalova Madina', subject: 'Kimyo', level: 'respublika', place: 1, olympiad_name: 'Respublika olimpiadasi', year: 2025 },
    { id: '5', student: 'Ubaydullayev Sherzod', subject: 'Matematika', level: 'xalqaro', place: 2, olympiad_name: 'IMO 2025', year: 2025 }
  ],

  faq: [
    { id: '1', question_uz: 'Maktabga qabul qanday amalga oshiriladi?', question_ru: 'Как осуществляется приём в школу?', question_kk: 'Mektepke qabıl qalay a\'melge asırıladı?', question_en: 'How is admission to the school carried out?', answer_uz: 'Qabul imtihon asosida amalga oshiriladi. Matematika va mantiqiy fikrlash fanlaridan test topshiriladi.', answer_ru: 'Приём осуществляется на основе экзамена. Сдаются тесты по математике и логическому мышлению.', answer_kk: 'Qabıl imtıxan tiykарında a\'melge asırıladı. Matematika ha\'m mantıqıy pikirlewden test tapshırıladı.', answer_en: 'Admission is carried out on an exam basis. Tests in mathematics and logical thinking are taken.', category: 'admission', order: 1 },
    { id: '2', question_uz: 'O\'qish pullikmi?', question_ru: 'Обучение платное?', question_kk: 'Oqıw pullıkpa?', question_en: 'Is education paid?', answer_uz: 'Yo\'q, maktabda ta\'lim to\'liq davlat hisobidan bepul.', answer_ru: 'Нет, обучение в школе полностью бесплатное за счёт государства.', answer_kk: 'Yaq, mektepte ta\'lim tolıq ma\'mleketlik esaptan biyputlı.', answer_en: 'No, education at the school is completely free, funded by the state.', category: 'education', order: 2 },
    { id: '3', question_uz: 'Nechanchi sinfdan qabul qilinadi?', question_ru: 'С какого класса принимают?', question_kk: 'Neshinshi sınıptan qabıl qılınadı?', question_en: 'From which grade are students admitted?', answer_uz: '7-sinf bitirganlar qabul qilinadi (8-sinfga).', answer_ru: 'Принимаются учащиеся, окончившие 7 класс (в 8 класс).', answer_kk: '7-sınıptı tamaman\'lawshılar qabıl qılınadı (8-sınıpqa).', answer_en: 'Students who have completed 7th grade are admitted (to 8th grade).', category: 'admission', order: 3 }
  ],

  gallery: [
    { id: '1', url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop', caption_uz: 'Maktab binosi', caption_ru: 'Здание школы', caption_kk: 'Mektep binası', caption_en: 'School Building', category: 'building' },
    { id: '2', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop', caption_uz: 'Dars jarayoni', caption_ru: 'Учебный процесс', caption_kk: 'Sabaq jarayını', caption_en: 'Learning Process', category: 'lessons' },
    { id: '3', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop', caption_uz: 'Laboratoriya', caption_ru: 'Лаборатория', caption_kk: 'Laboratoriya', caption_en: 'Laboratory', category: 'lessons' },
    { id: '4', url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&h=400&fit=crop', caption_uz: 'Sport musobaqasi', caption_ru: 'Спортивные соревнования', caption_kk: 'Sport musabaqası', caption_en: 'Sports Competition', category: 'sports' },
    { id: '5', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop', caption_uz: 'Tadbir', caption_ru: 'Мероприятие', caption_kk: 'Ilaj', caption_en: 'Event', category: 'events' },
    { id: '6', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop', caption_uz: 'Kutubxona', caption_ru: 'Библиотека', caption_kk: 'Kitapxana', caption_en: 'Library', category: 'building' }
  ]
};

function getLocalizedField(obj, prefix) {
  const lang = localStorage.getItem('lang') || 'uz';
  return obj[`${prefix}_${lang}`] || obj[`${prefix}_uz`] || '';
}

window.DemoData = DemoData;
window.getLocalizedField = getLocalizedField;

console.log('🔥 Firebase ulandi:', firebaseConfig.projectId);
