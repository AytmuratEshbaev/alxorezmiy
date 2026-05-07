// ============================================
// SEED — Vaqtinchalik placeholder ma'lumotlarni qo'shish
// ============================================

import { addDocument, getDocuments } from '../../js/firestore-helpers.js';

const $ = (sel) => document.querySelector(sel);

const SEED_DATA = {
  news: [
    {
      title_uz: "Respublika matematika olimpiadasida 5 ta oltin medal",
      title_ru: "Пять золотых медалей на республиканской олимпиаде по математике",
      title_kk: "Respublika matematika olimpiadasinda 5 altın medal",
      title_en: "5 Gold Medals at the National Mathematics Olympiad",
      content_uz: "Maktabimiz o'quvchilari 2026-yil respublika matematika olimpiadasida ajoyib natijalar ko'rsatdi. Beshta o'quvchi oltin medal bilan taqdirlandi va ular xalqaro olimpiadaga ham yo'llanma oldilar.\n\nUstoz Karimov Alisher boshchiligida tayyorgarlik ko'rib, o'quvchilar yuqori natijalarga erishishdi. Bu maktabimiz tarixidagi eng yaxshi natijalardan biri hisoblanadi.",
      content_ru: "Ученики нашей школы показали отличные результаты на республиканской олимпиаде по математике 2026 года. Пять учеников были награждены золотыми медалями и получили путёвки на международную олимпиаду.\n\nПод руководством учителя Каримова Алишера ученики добились высоких результатов. Это один из лучших результатов в истории нашей школы.",
      content_kk: "Mektebimiz oqıwshıları 2026-jıl respublika matematika olimpiadasında ájayıp nátiyjeler kórsetti. Bes oqıwshı altın medal menen sıylıqlandı.",
      content_en: "Our school students showed excellent results at the 2026 National Mathematics Olympiad. Five students were awarded gold medals and received qualifications for the international olympiad.",
      image: "https://picsum.photos/seed/news1/800/500",
      category: "events",
      status: "published"
    },
    {
      title_uz: "2026-2027 o'quv yili uchun qabul boshlandi",
      title_ru: "Начался приём на 2026-2027 учебный год",
      title_kk: "2026-2027 oqıw jılı ushın qabıl baslandı",
      title_en: "Admissions Open for the 2026-2027 Academic Year",
      content_uz: "Hurmatli ota-onalar! 2026-2027 o'quv yili uchun 8-sinfga qabul jarayoni rasman boshlandi. Onlayn ariza topshirish mumkin.\n\nQabul shartlari:\n- 7-sinfni a'lo baholarga bitirgan\n- Matematika va mantiqiy fikrlash testlaridan o'tish\n- Suhbat bosqichidan o'tish\n\nBatafsil ma'lumot uchun Qabul sahifasini ko'rib chiqing.",
      content_ru: "Уважаемые родители! Приём в 8 класс на 2026-2027 учебный год официально начался. Подача заявок осуществляется онлайн.",
      content_kk: "Húrmetli ata-analar! 2026-2027 oqıw jılı ushın 8-sınıpqa qabıl jarayını rásmiy túrde baslandı.",
      content_en: "Dear parents! Admission to the 8th grade for the 2026-2027 academic year has officially begun. Applications are accepted online.",
      image: "https://picsum.photos/seed/news2/800/500",
      category: "announcements",
      status: "published"
    },
    {
      title_uz: "Xalqaro IOI 2025 informatika olimpiadasida 3-o'rin",
      title_ru: "3-е место на международной олимпиаде по информатике IOI 2025",
      title_kk: "Xalıqaralıq IOI 2025 informatika olimpiadasında 3-orın",
      title_en: "3rd Place at the International Olympiad in Informatics IOI 2025",
      content_uz: "11-sinf o'quvchisi Ruziyev Azizbek IOI 2025 da O'zbekiston nomidan ishtirok etib, bronza medali bilan taqdirlandi. Bu maktabimiz tarixida xalqaro darajada erishilgan eng yuqori natijalardan biri.",
      content_ru: "Ученик 11 класса Рузиев Азизбек на IOI 2025 от имени Узбекистана был награждён бронзовой медалью.",
      content_kk: "11-sınıp oqıwshısı Ruziyev Azizbek IOI 2025-de Ózbekstan atınan qatnasıp, qola medali menen sıylıqlandı.",
      content_en: "11th grade student Azizbek Ruziyev participated in IOI 2025 representing Uzbekistan and was awarded a bronze medal.",
      image: "https://picsum.photos/seed/news3/800/500",
      category: "events",
      status: "published"
    },
    {
      title_uz: "Ochiq eshiklar kuni — 15-aprel",
      title_ru: "День открытых дверей — 15 апреля",
      title_kk: "Ashıq eshikler kúni — 15-aprel",
      title_en: "Open Doors Day — April 15",
      content_uz: "Hurmatli ota-onalar va o'quvchilar! 15-aprel kuni soat 10:00 da maktabimizda Ochiq eshiklar kuni bo'lib o'tadi. Bu kuni siz:\n\n- Maktab binosi va o'quv xonalarini ko'rishingiz\n- Direktor va o'qituvchilar bilan suhbatlashishingiz\n- Qabul shartlari haqida to'liq ma'lumot olishingiz mumkin\n\nIshtirok etishingizni kutib qolamiz!",
      content_ru: "Уважаемые родители и ученики! 15 апреля в 10:00 в нашей школе пройдёт День открытых дверей.",
      content_kk: "Húrmetli ata-analar hám oqıwshılar! 15-aprel kúni saat 10:00-de mektebimizde Ashıq eshikler kúni bolıp ótedi.",
      content_en: "Dear parents and students! On April 15 at 10:00 our school will host an Open Doors Day.",
      image: "https://picsum.photos/seed/news4/800/500",
      category: "announcements",
      status: "published"
    },
    {
      title_uz: "Yangi STEM laboratoriyasi ochildi",
      title_ru: "Открылась новая STEM-лаборатория",
      title_kk: "Jańa STEM laboratoriyası ashıldı",
      title_en: "New STEM Laboratory Opened",
      content_uz: "Maktabimizda zamonaviy uskunalar bilan jihozlangan yangi STEM laboratoriyasi ochildi. Laboratoriyada robototexnika, 3D-printerlar, mikroskoplar va boshqa zamonaviy texnik vositalar mavjud. O'quvchilar bu yerda fizika, kimyo va informatika bo'yicha amaliy mashg'ulotlar o'tkazadilar.",
      content_ru: "В нашей школе открылась новая STEM-лаборатория, оснащённая современным оборудованием.",
      content_kk: "Mektebimizde zamanagóy úskeneler menen jabdıqlanǵan jańa STEM laboratoriyası ashıldı.",
      content_en: "Our school has opened a new STEM laboratory equipped with modern equipment.",
      image: "https://picsum.photos/seed/news5/800/500",
      category: "events",
      status: "published"
    }
  ],

  teachers: [
    {
      name_uz: "Karimov Alisher Baxtiyorovich",
      name_ru: "Каримов Алишер Бахтиёрович",
      name_kk: "Karimov Alisher Baxtiyoroviç",
      name_en: "Alisher Karimov",
      subject: "Matematika",
      category: "Oliy",
      experience: 18,
      photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alisher&backgroundColor=b6e3f4",
      achievements: [
        { type: "diploma", title: "Toshkent davlat universiteti matematika fakulteti", year: 2007 },
        { type: "olympiad", title: "Respublika matematika olimpiadasida 5 ta o'quvchini g'olib qildi", year: 2024 },
        { type: "certificate", title: "Yilning eng yaxshi o'qituvchisi", year: 2023 }
      ]
    },
    {
      name_uz: "Rahimova Nodira Saidovna",
      name_ru: "Рахимова Нодира Саидовна",
      name_kk: "Rahimova Nodira Saidovna",
      name_en: "Nodira Rahimova",
      subject: "Fizika",
      category: "Oliy",
      experience: 15,
      photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nodira&backgroundColor=ffd5dc",
      achievements: [
        { type: "diploma", title: "Toshkent davlat pedagogika universiteti", year: 2010 },
        { type: "olympiad", title: "Xalqaro fizika olimpiadasi (IPhO) trener", year: 2025 }
      ]
    },
    {
      name_uz: "Yusupov Sardor Maxmudovich",
      name_ru: "Юсупов Сардор Махмудович",
      name_kk: "Yusupov Sardor Maxmudoviç",
      name_en: "Sardor Yusupov",
      subject: "Informatika",
      category: "1-toifa",
      experience: 10,
      photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sardor&backgroundColor=c0aede",
      achievements: [
        { type: "diploma", title: "INHA universiteti, dasturlash mutaxassisi", year: 2015 },
        { type: "competition", title: "ACM ICPC mintaqaviy bosqich, 2-o'rin", year: 2023 },
        { type: "certificate", title: "Google Certified Educator", year: 2024 }
      ]
    },
    {
      name_uz: "Abdullayeva Malika Rashidovna",
      name_ru: "Абдуллаева Малика Рашидовна",
      name_kk: "Abdullayeva Malika Rashidovna",
      name_en: "Malika Abdullayeva",
      subject: "Kimyo",
      category: "Oliy",
      experience: 20,
      photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Malika&backgroundColor=d1d4f9",
      achievements: [
        { type: "diploma", title: "O'zMU kimyo fakulteti", year: 2005 },
        { type: "olympiad", title: "Respublika kimyo olimpiadasi mukofoti", year: 2024 }
      ]
    },
    {
      name_uz: "Toshmatov Bekzod Erkinovich",
      name_ru: "Тошматов Бекзод Эркинович",
      name_kk: "Toshmatov Bekzod Erkinoviç",
      name_en: "Bekzod Toshmatov",
      subject: "Biologiya",
      category: "1-toifa",
      experience: 12,
      photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bekzod&backgroundColor=ffdfbf",
      achievements: [
        { type: "diploma", title: "Toshkent davlat universiteti biologiya fakulteti", year: 2013 }
      ]
    },
    {
      name_uz: "Nazarova Dilnoza Anvarovna",
      name_ru: "Назарова Дилноза Анваровна",
      name_kk: "Nazarova Dilnoza Anvarovna",
      name_en: "Dilnoza Nazarova",
      subject: "Ingliz tili",
      category: "Oliy",
      experience: 14,
      photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dilnoza&backgroundColor=ffd5dc",
      achievements: [
        { type: "certificate", title: "IELTS 8.5 (Academic)", year: 2022 },
        { type: "certificate", title: "CELTA — Cambridge teaching certificate", year: 2018 },
        { type: "diploma", title: "O'zbekiston davlat jahon tillari universiteti", year: 2011 }
      ]
    },
    {
      name_uz: "Ismoilov Otabek Anvarovich",
      name_ru: "Исмоилов Отабек Анварович",
      name_kk: "Ismoilov Otabek Anvaroviç",
      name_en: "Otabek Ismoilov",
      subject: "Matematika",
      category: "1-toifa",
      experience: 8,
      photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Otabek&backgroundColor=b6e3f4",
      achievements: [
        { type: "diploma", title: "Milliy universiteti, magistr darajasi", year: 2017 },
        { type: "competition", title: "Yilning yosh o'qituvchisi tanlovi g'olibi", year: 2024 }
      ]
    },
    {
      name_uz: "Saidova Gulnora Ravshanovna",
      name_ru: "Саидова Гульнора Равшановна",
      name_kk: "Saidova Gulnora Ravshanovna",
      name_en: "Gulnora Saidova",
      subject: "Fizika",
      category: "2-toifa",
      experience: 5,
      photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Gulnora&backgroundColor=c0aede",
      achievements: [
        { type: "diploma", title: "Nukus davlat pedagogika instituti", year: 2020 }
      ]
    }
  ],

  olympiad: [
    { student: "Ismoilov Jasur", subject: "Matematika", level: "respublika", place: 1, olympiad_name: "Respublika olimpiadasi", year: 2026 },
    { student: "Turgunova Zilola", subject: "Fizika", level: "respublika", place: 2, olympiad_name: "Respublika olimpiadasi", year: 2026 },
    { student: "Ruziyev Azizbek", subject: "Informatika", level: "xalqaro", place: 3, olympiad_name: "IOI 2025", year: 2025 },
    { student: "Kamalova Madina", subject: "Kimyo", level: "respublika", place: 1, olympiad_name: "Respublika olimpiadasi", year: 2025 },
    { student: "Ubaydullayev Sherzod", subject: "Matematika", level: "xalqaro", place: 2, olympiad_name: "IMO 2025", year: 2025 },
    { student: "Yusupov Bekzod", subject: "Biologiya", level: "respublika", place: 3, olympiad_name: "Respublika olimpiadasi", year: 2025 },
    { student: "Karimova Sevinch", subject: "Ingliz tili", level: "xalqaro", place: 1, olympiad_name: "Cambridge English Challenge", year: 2024 },
    { student: "Otajonov Sanjar", subject: "Fizika", level: "shahar", place: 1, olympiad_name: "Nukus shahar olimpiadasi", year: 2024 },
    { student: "Aliyeva Mohira", subject: "Matematika", level: "respublika", place: 2, olympiad_name: "Respublika olimpiadasi", year: 2024 },
    { student: "Eshmatov Doniyor", subject: "Informatika", level: "respublika", place: 1, olympiad_name: "DTM olimpiadasi", year: 2024 }
  ],

  gallery: [
    { url: "https://picsum.photos/seed/gallery1/800/600", caption_uz: "Maktab binosi", caption_ru: "Здание школы", caption_kk: "Mektep binası", caption_en: "School Building", category: "building" },
    { url: "https://picsum.photos/seed/gallery2/800/600", caption_uz: "Bosh kirish eshigi", caption_ru: "Главный вход", caption_kk: "Bas kirew esigi", caption_en: "Main Entrance", category: "building" },
    { url: "https://picsum.photos/seed/gallery3/800/600", caption_uz: "Matematika darsi", caption_ru: "Урок математики", caption_kk: "Matematika sabaǵı", caption_en: "Math Lesson", category: "lessons" },
    { url: "https://picsum.photos/seed/gallery4/800/600", caption_uz: "Fizika laboratoriyasi", caption_ru: "Лаборатория физики", caption_kk: "Fizika laboratoriyası", caption_en: "Physics Lab", category: "lessons" },
    { url: "https://picsum.photos/seed/gallery5/800/600", caption_uz: "Kompyuter sinfi", caption_ru: "Компьютерный класс", caption_kk: "Kompyuter sınıbı", caption_en: "Computer Lab", category: "lessons" },
    { url: "https://picsum.photos/seed/gallery6/800/600", caption_uz: "Sport zali", caption_ru: "Спортивный зал", caption_kk: "Sport zalı", caption_en: "Sports Hall", category: "sports" },
    { url: "https://picsum.photos/seed/gallery7/800/600", caption_uz: "Futbol musobaqasi", caption_ru: "Футбольное соревнование", caption_kk: "Futbol musabaqası", caption_en: "Football Competition", category: "sports" },
    { url: "https://picsum.photos/seed/gallery8/800/600", caption_uz: "Bilimlar kuni tadbiri", caption_ru: "Праздник Дня знаний", caption_kk: "Bilim kúni iláji", caption_en: "Knowledge Day Event", category: "events" },
    { url: "https://picsum.photos/seed/gallery9/800/600", caption_uz: "Mustaqillik bayrami", caption_ru: "День независимости", caption_kk: "Ǵárezsizlik bayramı", caption_en: "Independence Day", category: "events" },
    { url: "https://picsum.photos/seed/gallery10/800/600", caption_uz: "Bitiruv marosimi", caption_ru: "Выпускной", caption_kk: "Bitiriw rasmiyatı", caption_en: "Graduation Ceremony", category: "events" },
    { url: "https://picsum.photos/seed/gallery11/800/600", caption_uz: "Kutubxona", caption_ru: "Библиотека", caption_kk: "Kitapxana", caption_en: "Library", category: "building" },
    { url: "https://picsum.photos/seed/gallery12/800/600", caption_uz: "Ingliz tili darsi", caption_ru: "Урок английского", caption_kk: "Ingliz tili sabaǵı", caption_en: "English Lesson", category: "lessons" }
  ],

  faq: [
    {
      question_uz: "Maktabga qabul qanday amalga oshiriladi?",
      question_ru: "Как осуществляется приём в школу?",
      question_kk: "Mektepke qabıl qalay ámelge asıladı?",
      question_en: "How is admission to the school carried out?",
      answer_uz: "Qabul 3 bosqichda amalga oshiriladi:\n\n1. Onlayn ariza topshirish va hujjatlarni taqdim etish\n2. Matematika va mantiqiy fikrlash bo'yicha test imtihoni\n3. Direktor va psixolog bilan suhbat\n\nBatafsil ma'lumot Qabul sahifasida mavjud.",
      answer_ru: "Приём осуществляется в 3 этапа: онлайн-заявка, тестирование по математике и логике, собеседование с директором.",
      answer_kk: "Qabıl 3 basqışda ámelge asıladı: onlayn arza, matematika hám logika boyınsha test, intervyu.",
      answer_en: "Admission is in 3 stages: online application, math and logic test, interview with the director.",
      category: "admission",
      order: 1
    },
    {
      question_uz: "O'qish pullikmi?",
      question_ru: "Обучение платное?",
      question_kk: "Oqıw pullıkpa?",
      question_en: "Is education paid?",
      answer_uz: "Yo'q, maktabda ta'lim to'liq davlat hisobidan bepul. Hech qanday qo'shimcha to'lov yoki badallar talab qilinmaydi.",
      answer_ru: "Нет, обучение в школе полностью бесплатное за счёт государства.",
      answer_kk: "Yaq, mektepte tálim tolıq mámleket esabınan tegin.",
      answer_en: "No, education at the school is completely free, funded by the state.",
      category: "admission",
      order: 2
    },
    {
      question_uz: "Nechanchi sinfdan qabul qilinadi?",
      question_ru: "С какого класса принимают?",
      question_kk: "Neshinshi sınıptan qabıl qılınadı?",
      question_en: "From which grade are students admitted?",
      answer_uz: "Maktabga 7-sinfni a'lo baholarga bitirgan o'quvchilar 8-sinfga qabul qilinadi. Qabul har yil aprel-may oylarida e'lon qilinadi.",
      answer_ru: "В школу принимаются ученики, окончившие 7 класс, в 8 класс. Приём объявляется ежегодно в апреле-мае.",
      answer_kk: "Mektepke 7-sınıptı tamamlaǵan oqıwshılar 8-sınıpqa qabıl qılınadı.",
      answer_en: "Students who have completed 7th grade are admitted to 8th grade. Admission is announced annually in April-May.",
      category: "admission",
      order: 3
    },
    {
      question_uz: "Qaysi fanlardan chuqurlashtirilgan ta'lim beriladi?",
      question_ru: "По каким предметам даётся углублённое образование?",
      question_kk: "Qaysı pánlerden tereńlestirilgen tálim beriledi?",
      question_en: "Which subjects are taught in depth?",
      answer_uz: "Maktabimizda quyidagi fanlar bo'yicha chuqurlashtirilgan ta'lim beriladi:\n\n- Matematika\n- Fizika\n- Informatika va dasturlash\n- Kimyo\n- Biologiya\n- Ingliz tili\n\nHar bir o'quvchi o'z qiziqishiga qarab yo'nalishni tanlaydi.",
      answer_ru: "Углублённо изучаются: математика, физика, информатика, химия, биология, английский язык.",
      answer_kk: "Tereńlestirilip oqıtıladı: matematika, fizika, informatika, ximiya, biologiya, ingliz tili.",
      answer_en: "Subjects taught in depth: mathematics, physics, informatics, chemistry, biology, English.",
      category: "education",
      order: 4
    },
    {
      question_uz: "Maktabda ovqatlanish bormi?",
      question_ru: "Есть ли питание в школе?",
      question_kk: "Mektepte awqatlanıw barma?",
      question_en: "Is there food service at the school?",
      answer_uz: "Ha, maktabda zamonaviy oshxona mavjud. O'quvchilar tushlik vaqtida sog'lom va to'yimli ovqatlardan foydalanishlari mumkin. Oshxona davlat standartlariga muvofiq ishlaydi.",
      answer_ru: "Да, в школе есть современная столовая. Ученики могут получить здоровое и питательное обеденное питание.",
      answer_kk: "Awa, mektepte zamanagóy asxana bar.",
      answer_en: "Yes, the school has a modern cafeteria. Students can receive healthy and nutritious lunch meals.",
      category: "general",
      order: 5
    },
    {
      question_uz: "Maktab manzili va ish vaqti?",
      question_ru: "Адрес и часы работы школы?",
      question_kk: "Mektep mánzili hám jumıs waqtı?",
      question_en: "School address and working hours?",
      answer_uz: "Manzil: Nukus shahri, Amir Temur ko'chasi 1-uy.\n\nIsh vaqti:\n- Dushanba — Shanba: 08:00 — 17:00\n- Yakshanba: dam olish kuni\n\nDars vaqti: 08:30 dan boshlanadi.",
      answer_ru: "Адрес: г. Нукус, ул. Амира Темура, 1. Часы работы: пн-сб 08:00-17:00.",
      answer_kk: "Mánzil: Nókis qalası, Ámir Temur kóshesi 1.",
      answer_en: "Address: Nukus city, Amir Temur street 1. Working hours: Mon-Sat 08:00-17:00.",
      category: "general",
      order: 6
    }
  ]
};

async function checkExisting(collection) {
  const items = await getDocuments(collection, { limit: 1 });
  return items.length > 0;
}

async function seedCollection(name, items, statusEl) {
  statusEl.textContent = 'Tekshirilmoqda...';
  statusEl.className = 'seed-status loading';

  const has = await checkExisting(name);
  if (has) {
    statusEl.textContent = "⚠️ Allaqachon ma'lumotlar bor — o'tkazib yuborildi";
    statusEl.className = 'seed-status warning';
    return;
  }

  let count = 0;
  try {
    for (const item of items) {
      await addDocument(name, item);
      count++;
      statusEl.textContent = `Qo'shilmoqda: ${count}/${items.length}`;
    }
    statusEl.textContent = `✅ ${count} ta ma'lumot qo'shildi`;
    statusEl.className = 'seed-status success';
  } catch (err) {
    console.error(err);
    statusEl.textContent = `❌ Xato: ${err.message}`;
    statusEl.className = 'seed-status error';
  }
}

async function seedAll() {
  const btn = $('#seedAllBtn');
  btn.disabled = true;
  btn.textContent = 'Bajarilmoqda...';

  for (const [name, items] of Object.entries(SEED_DATA)) {
    await seedCollection(name, items, $(`#status-${name}`));
  }

  btn.disabled = false;
  btn.textContent = "Yana qo'shish";
}

document.addEventListener('DOMContentLoaded', () => {
  $('#seedAllBtn')?.addEventListener('click', seedAll);

  // Individual buttons
  Object.keys(SEED_DATA).forEach(name => {
    $(`#btn-${name}`)?.addEventListener('click', () => {
      seedCollection(name, SEED_DATA[name], $(`#status-${name}`));
    });
  });
});
