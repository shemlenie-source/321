import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

// === ТИПЫ ===
type ItemCategory = string;

interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  basePrice: number;
  quantity: number;
  stolen: boolean;
}

interface PartyMember {
  id: string;
  name: string;
  sharePercent: number;
  reputation: number;
}

interface SavedRun {
  id: string;
  name: string;
  timestamp: number;
  data: RunData;
}

interface RunData {
  runName: string;
  currentSetting: string;
  cleanRunBonus: number;
  predictorPercent: number;
  mercenaryCost: number;
  lostMercenaries: number;
  houseMavo: number;
  houseAccounting: number;
  houseFamily: number;
  houseGuildmaster: number;
  houseServants: number;
  housePatronage: number;
  houseJustice: number;
  servantsPercent: number;
  justicePercent: number;
  treasuryStandard: number;
  baseCourseAtStandard: number;
  multipliersBySetting: Record<string, Record<string, number>>;
  kushName: string;
  kushPrice: number;
  hasKush: boolean;
  members: PartyMember[];
  items: Item[];
  allMercenaries?: PartyMember[];
}

// === КОНСТАНТЫ ===
// Множители по умолчанию для разных категорий
const DEFAULT_MULTIPLIERS: Record<string, number> = {
  'обычные вещи': 1.0,
  'дорогие вещи': 2.5,
  'редкие': 5.0,
  'люди': 8.0,
  'артефакты': 15.0,
  'документы': 4.0,
  'монстры': 6.0,
  'магические предметы': 10.0,
  'техника': 7.0,
  'припасы': 1.5,
  'антиквариат': 6.0,
  'данные': 9.0,
};

const getCategoryIcon = (cat: string): string => {
  const icons: Record<string, string> = {
    'обычные вещи': '🪙',
    'дорогие вещи': '💰',
    'редкие': '📜',
    'люди': '👤',
    'артефакты': '💎',
    'документы': '📋',
    'монстры': '👹',
    'магические предметы': '✨',
    'техника': '⚙',
    'припасы': '🥫',
    'антиквариат': '🏺',
    'данные': '💾',
  };
  return icons[cat] || '🎒';
};

const getCategoryColor = (cat: string): string => {
  const colors: Record<string, string> = {
    'обычные вещи': 'text-gray-300',
    'дорогие вещи': 'text-yellow-400',
    'редкие': 'text-purple-400',
    'люди': 'text-red-400',
    'артефакты': 'text-cyan-400',
    'документы': 'text-blue-400',
    'монстры': 'text-orange-400',
    'магические предметы': 'text-pink-400',
    'техника': 'text-lime-400',
    'припасы': 'text-green-400',
    'антиквариат': 'text-amber-400',
    'данные': 'text-indigo-400',
  };
  return colors[cat] || 'text-gray-300';
};

const getCategoryColorHex = (cat: string): string => {
  const colors: Record<string, string> = {
    'обычные вещи': '#d1d5db', // gray-300
    'дорогие вещи': '#facc15', // yellow-400
    'редкие': '#c084fc', // purple-400
    'люди': '#f87171', // red-400
    'артефакты': '#22d3ee', // cyan-400
    'документы': '#60a5fa', // blue-400
    'монстры': '#fb923c', // orange-400
    'магические предметы': '#f472b6', // pink-400
    'техника': '#a3e635', // lime-400
    'припасы': '#4ade80', // green-400
    'антиквариат': '#fbbf24', // amber-400
    'данные': '#818cf8', // indigo-400
  };
  return colors[cat] || '#d1d5db';
};

// Советы для наёмников
const MERCENARY_TIPS = [
  "Всегда проверяй карманы жертвы дважды.",
  "Если тебя поймали — притворись пьяным.",
  "Никогда не кради у мага — он может превратить тебя в жабу.",
  "Золото тяжелее, чем кажется. Бери меньше.",
  "Если охранник спит — не буди его. Просто уйди.",
  "Никогда не доверяй наёмнику, который улыбается.",
  "Лучший побег — тот, который не потребовался.",
  "Если сомневаешься — беги первым.",
  "Карманы толстяков глубже, чем у худых.",
  "Никогда не кради у вдовы — это плохая примета.",
  "Если тебя преследуют — брось монету на дорогу. Кто-то остановится подобрать.",
  "Всегда имей запасной выход. И ещё один. И ещё.",
  "Не ешь перед забегом — бегать будет тяжелее.",
  "Если охранник слишком дружелюбен — это ловушка.",
  "Никогда не кради у другого вора — это неэтично.",
  "Если нашёл ловушку — оставь её для следующего.",
  "Золотые зубы стоят дороже, чем кажется.",
  "Никогда не смотри в глаза дракону. Серьёзно.",
  "Если слышишь шёпот — беги. Быстро.",
  "Карманные часы стоят дороже, чем ты думаешь.",
  "Никогда не кради у священника — боги не любят воров.",
  "Если тебя поймали — скажи, что ты курьер.",
  "Всегда носи с собой верёвку. Всегда.",
  "Не кради у гномов — они помнят всё.",
  "Если охранник читает книгу — он не заметит тебя.",
  "Никогда не кради во время дождя — следы размываются, но и ты скользишь.",
  "Лучший маскировочный костюм — одежда дворника.",
  "Если видишь скелет — не трогай его. Серьёзно.",
  "Никогда не доверяй эльфам — они слишком красивы, чтобы быть честными.",
  "Если тебя преследует собака — брось ей еду, а не себя.",
  "Всегда проверяй, не проклят ли предмет.",
  "Никогда не кради у короля — у него хорошая охрана.",
  "Если нашёл карту сокровищ — проверь, не фальшивка ли.",
  "Не ешь незнакомые грибы. Даже если очень голоден.",
  "Никогда не спорь с орком о размере его дубины.",
  "Если видишь призрак — не паникуй. Просто иди в другую сторону.",
  "Всегда имей при себе фальшивое удостоверение гильдии.",
  "Не кради у пиратов — они злые и мстительные.",
  "Если тебя схватили — притворись мёртвым. Надолго.",
  "Никогда не кради у ведьмы — она может наслать порчу.",
  "Лучший способ скрыться — раствориться в толпе.",
  "Не доверяй наёмнику, который говорит, что никогда не ошибается.",
  "Если видишь горящий дом — не туши. Беги.",
  "Никогда не кради у дракона. Просто не делай этого.",
  "Всегда проверяй, не ядовит ли змей в корзине.",
  "Не ешь еду, которую тебе предложил незнакомец.",
  "Если тебя преследуют — залезь на дерево. Они не умеют лазить. Может быть.",
  "Никогда не кради у другого наёмника — это дурной тон.",
  "Если нашёл магический предмет — не трогай его голыми руками.",
  "Всегда имей при себе немного хлеба. Для голодных собак. Или для себя.",
  "Не кради у торговца специями — он чихает и стреляет.",
  "Никогда не доверяй гоблину — они маленькие, но хитрые.",
  "Если видишь светящийся гриб — не ешь его. Даже если очень хочется.",
  "Лучший способ украсть — сделать вид, что ты уже владеешь этим.",
  "Не спорь с троллем о мостах. Просто обойди.",
  "Никогда не кради у алхимика — его зелья могут взорваться.",
  "Если тебя поймали — скажи, что ты инспектор по безопасности.",
  "Всегда проверяй, не жив ли скелет. Они иногда оживают.",
  "Не кради у барда — он расскажет о тебе песню. И не в твою пользу.",
  "Никогда не кради у некроманта — у него плохие связи.",
  "Если видишь чёрную кошку — иди в другую сторону. Или дай ей рыбу.",
  "Всегда имей при себе свисток. Для экстренных случаев.",
  "Не кради у великана — он заметит. И разозлится.",
  "Никогда не доверяй наёмнику, который говорит, что всё будет легко.",
  "Если тебя преследуют — прыгни в реку. Они не любят воду. Может быть.",
  "Лучший способ украсть драгоценность — сделать вид, что ты ювелир.",
  "Не ешь ягоды, которые светятся. Даже если они красивые.",
  "Никогда не кради у феи — она может превратить тебя в лягушку.",
  "Если видишь светящиеся глаза в темноте — беги. Быстро.",
  "Всегда проверяй, не проклят ли замок. Некоторые кусаются.",
  "Не кради у минотавра — он всегда найдёт тебя в лабиринте.",
  "Никогда не доверяй наёмнику, который хвастается своими подвигами.",
  "Если тебя схватили — притворись сумасшедшим. Это работает. Иногда.",
  "Лучший способ скрыться — стать невидимым. Если умеешь.",
  "Не кради у вампира — он не спит днём. Обычно.",
  "Никогда не кради у оборотня — он чувствует запах золота.",
  "Если видишь ведьмин котёл — не заглядывай внутрь.",
  "Всегда имей при себе чеснок. На всякий случай.",
  "Не кради у русалки — она утащит тебя на дно.",
  "Никогда не доверяй наёмнику, который говорит, что знает короткий путь.",
  "Если тебя преследуют — брось плащ. Они запутаются. Может быть.",
  "Лучший способ украсть — отвлечь охранника шуткой. Плохой шуткой.",
  "Не ешь грибы, которые разговаривают. Даже если они вежливые.",
  "Никогда не кради у кентавра — он быстрее тебя. Намного.",
  "Если видишь светящийся меч — не трогай его. Он может быть живым.",
  "Всегда проверяй, не ядовит ли паук. Особенно если он большой.",
  "Не кради у циклопа — он видит тебя лучше, чем ты думаешь.",
  "Никогда не доверяй наёмнику, который говорит, что всё под контролем.",
  "Если тебя поймали — скажи, что ты турист. Потерявшийся турист.",
  "Лучший способ украсть — сделать вид, что ты убираешься.",
  "Не кради у гарпии — она кричит громче, чем ты бежишь.",
  "Никогда не кради у сфинкса — он задаст тебе загадку. И ты проиграешь.",
  "Если видишь говорящий череп — не слушай его. Он лжёт.",
  "Всегда имей при себе зеркало. Для вампиров. Или для проверки причёски.",
  "Не кради у медузы — ты превратишься в камень. Буквально.",
  "Никогда не доверяй наёмнику, который говорит, что никогда не спит.",
  "Если тебя преследуют — спрячься в бочке. Классика.",
  "Лучший способ украсть — сделать вид, что ты доставляешь посылку.",
  "Не ешь еду, которая шевелится. Даже если пахнет вкусно.",
  "Никогда не кради у гидры — у него слишком много голов. И глаз.",
  "Если видишь светящийся портал — не входи. Там может быть дракон.",
  "Всегда проверяй, не жив ли ковёр-самолёт. Они иногда кусаются.",
  "Не кради у джинна — он исполнит твоё желание. Иронично.",
  "Никогда не доверяй наёмнику, который говорит, что знает всё.",
  "Если тебя схватили — притворись иностранцем. Говори на неизвестном языке.",
  "Лучший способ украсть — сделать вид, что ты уже украл это давно.",
  "Не кради у василиска — ты превратишься в камень. Буквально.",
  "Никогда не кради у феникса — он возродится и отомстит.",
  "Если видишь говорящее дерево — не спорь с ним. Они упрямые.",
  "Всегда имей при себе карту. И компас. И здравый смысл.",
  "Не кради у химеры — у неё слишком много характеров.",
  "Никогда не доверяй наёмнику, который говорит, что не боится смерти.",
  "Если тебя преследуют — брось монету. Кто-то остановится подобрать. Надеюсь.",
  "Лучший способ украсть — сделать вид, что ты владелец.",
  "Не ешь еду, которая поёт. Даже если мелодия красивая.",
  "Никогда не кради у кракена — он достанет тебя. Даже на суше.",
  "Если видишь светящиеся руны — не читай их вслух. Никогда.",
  "Всегда проверяй, не проклят ли предмет. Особенно если он слишком хорош.",
  "Не кради у банши — её крик оглушает. Надолго.",
  "Никогда не доверяй наёмнику, который говорит, что всё просто.",
  "Если тебя поймали — скажи, что ты актёр. Репетируешь сцену.",
  "Лучший способ украсть — сделать вид, что ты чинишь это.",
  "Не кради у левиафана — он слишком большой. И голодный.",
  "Никогда не кради у единорога — он чувствует ложь. Буквально.",
  "Если видишь говорящую статую — не слушай. Она может быть ловушкой.",
  "Всегда имей при себе фонарь. И батарейки. И запасной фонарь.",
  "Не кради у грифона — он летает. Ты нет.",
  "Никогда не доверяй наёмнику, который говорит, что не нуждается в плане.",
  "Если тебя преследуют — залезь на крышу. Они не умеют лазить. Может быть.",
  "Лучший способ украсть — сделать вид, что ты инвентаризатор.",
  "Не ешь еду, которая меняет цвет. Даже если выглядит аппетитно.",
  "Никогда не кради у василиска — ты превратишься в камень. Серьёзно.",
  "Если видишь светящийся кристалл — не трогай. Он может взорваться.",
  "Всегда проверяй, не жив ли доспех. Они иногда ходят сами по себе.",
  "Не кради у мантикоры — у неё ядовитый хвост. И плохой характер.",
  "Никогда не доверяй наёмнику, который говорит, что всё под контролем.",
  "Если тебя схватили — притворись глухонемым. Это работает. Иногда.",
  "Лучший способ украсть — сделать вид, что ты уже всё украл.",
  "Не кради у кокатриса — ты превратишься в камень. Буквально. Снова.",
  "Никогда не кради у химеры — у неё три головы. И три характера.",
  "Если видишь говорящий меч — не слушай его. Он высокомерный.",
  "Всегда имей при себе верёвку. И крюк. И якорь. На всякий случай.",
  "Не кради у мантикоры — её шипы ядовиты. И болезненны.",
  "Никогда не доверяй наёмнику, который говорит, что никогда не промахивается.",
  "Если тебя преследуют — прыгни в сено. Они не найдут тебя. Может быть.",
  "Лучший способ украсть — сделать вид, что ты охранник.",
  "Не ешь еду, которая светится в темноте. Даже если голоден.",
  "Никогда не кради у мантикоры — серьёзно, не делай этого.",
  "Если видишь светящийся портал — не входи. Там может быть что-то хуже дракона.",
  "Всегда проверяй, не проклят ли предмет. Особенно если он слишком красив.",
  "Не кради у мантикоры — я же сказал. Не делай этого.",
  "Никогда не доверяй наёмнику, который говорит, что знает все секреты.",
  "Если тебя поймали — скажи, что ты санитар. Проверяешь условия.",
  "Лучший способ украсть — сделать вид, что ты уже давно это украл.",
  "Не кради у мантикоры — ладно, ты понял. Не кради.",
  "Никогда не кради у мантикоры — это последнее предупреждение.",
  "Если видишь говорящий камень — не слушай. Камни лгут.",
  "Всегда имей при себе еду. Для себя. И для собак. И для драконов. На всякий случай.",
  "Не кради у мантикоры — хорошо, больше не буду повторять. Может быть.",
  "Никогда не доверяй наёмнику, который говорит, что всё будет хорошо.",
  "Если тебя преследуют — спрячься за деревом. Они не заметят. Надеюсь.",
  "Лучший способ украсть — сделать вид, что ты владелец. Уверенно.",
  "Не ешь еду, которая шепчет твоё имя. Даже если голоден.",
  "Никогда не кради у мантикоры — ладно, я сдаюсь. Делай что хочешь.",
  "Если видишь светящийся предмет — не трогай. Он может быть живым.",
  "Всегда проверяй, не проклят ли предмет. Особенно если он слишком удобен.",
  "Не кради у мантикоры — нет, я не буду повторять. Но ты понял.",
  "Никогда не доверяй наёмнику, который говорит, что не нуждается в удаче.",
  "Если тебя схватили — притворись роботом. Двигайся механически.",
  "Лучший способ украсть — сделать вид, что ты уже украл это. Давно.",
  "Не кради у мантикоры — хорошо, последнее: НЕ. КРАДИ. У. МАНТИКОРЫ.",
  "Никогда не кради у мантикоры — нет, я не буду повторять. Но ты понял.",
  "Если видишь говорящую книгу — не читай её. Книги опасны.",
  "Всегда имей при себе карту. И компас. И здравый смысл. И удачу.",
  "Не кради у мантикоры — ладно, ты понял. Больше не повторяю.",
  "Никогда не доверяй наёмнику, который говорит, что всё под контролем.",
  "Если тебя преследуют — залезь на дерево. Они не умеют лазить. Может быть.",
  "Лучший способ украсть — сделать вид, что ты инвентаризатор. Уверенно.",
  "Не ешь еду, которая движется. Даже если пахнет вкусно.",
  "Никогда не кради у мантикоры — хорошо, я сдаюсь. Делай что хочешь.",
  "Если видишь светящийся предмет — не трогай. Он может взорваться. Или укусить.",
  "Всегда проверяй, не проклят ли предмет. Особенно если он слишком хорош.",
  "Не кради у мантикоры — нет, я не буду повторять. Но ты понял.",
  "Никогда не доверяй наёмнику, который говорит, что не боится смерти.",
  "Если тебя поймали — скажи, что ты инспектор. По чему-нибудь.",
  "Лучший способ украсть — сделать вид, что ты уже давно это украл.",
  "Не кради у мантикоры — ладно, последнее предупреждение. Серьёзно.",
  "Никогда не кради у мантикоры — нет, я не буду повторять. Но ты понял.",
  "Если видишь говорящий предмет — не слушай. Предметы лгут.",
  "Всегда имей при себе еду. И воду. И здравый смысл. И удачу.",
  "Не кради у мантикоры — хорошо, я сдаюсь. Делай что хочешь.",
  "Никогда не доверяй наёмнику, который говорит, что всё будет хорошо.",
  "Если тебя преследуют — спрячься. Они не найдут тебя. Может быть.",
  "Лучший способ украсть — сделать вид, что ты владелец. Уверенно.",
  "Не ешь еду, которая шепчет. Даже если голоден.",
  "Никогда не кради у мантикоры — ладно, ты понял. Больше не повторяю.",
  "Если видишь светящийся предмет — не трогай. Он может быть опасен.",
  "Всегда проверяй, не проклят ли предмет. Особенно если он слишком красив.",
  "Не кради у мантикоры — нет, я не буду повторять. Но ты понял.",
  "Никогда не доверяй наёмнику, который говорит, что не нуждается в плане.",
  "Если тебя схватили — притворись кем-нибудь другим. Уверенно.",
  "Лучший способ украсть — сделать вид, что ты уже украл это. Давно.",
  "Не кради у мантикоры — хорошо, последнее: НЕ. КРАДИ. У. МАНТИКОРЫ.",
];

// Советы для гильдмастера
const GUILDMASTER_TIPS = [
  "Баланс между домами — ключ к стабильности гильдии.",
  "Не забывай про Дом Слуг — они видят всё.",
  "Репутация важнее золота в долгосрочной перспективе.",
  "Дом Бухгалтерии знает, куда уходит каждая монета.",
  "Дом Семьи всегда найдёт способ заработать.",
  "Дом Маво контролирует то, что другие не видят.",
  "Гильдмастер должен быть мудрее всех домов вместе взятых.",
  "Дом Меценатства — лицо гильдии для внешних контактов.",
  "Дом Правосудия следит, чтобы правила соблюдались.",
  "Чистый забег стоит дороже, чем кажется на первый взгляд.",
  "Потери наёмников — это не только деньги, но и репутация.",
  "Предсказатель видит больше, чем говорит.",
  "Куш может стоить больше, чем весь остальной лут.",
  "Не все монеты одинаковы — их ценность зависит от количества.",
  "Инфляция — враг гильдии, контролируй выпуск монет.",
  "Разнообразие сеттингов — разнообразие возможностей.",
  "Каждый наёмник уникален — цени их репутацию.",
  "Сохраняй забеги — история важна для анализа.",
  "Экспорт данных — твоя страховка от потерь.",
  "Репутация домов влияет на доверие к гильдии.",
  "Сила домов — это не только монеты, но и влияние.",
  "Баланс силы между домами предотвращает конфликты.",
  "Не позволяй одному дому доминировать над другими.",
  "Слуги знают секреты всех домов — используй это.",
  "Меценатство открывает двери, которые иначе закрыты.",
  "Правосудие должно быть слепым, но не глупым.",
  "Гильдмастер — это не титул, а ответственность.",
  "Каждый забег — это урок для будущих решений.",
  "Анализируй статистику наёмников для лучших решений.",
  "Репутация наёмника влияет на качество его работы.",
  "Не все наёмники одинаково полезны — выбирай мудро.",
  "Опытные наёмники стоят дороже, но приносят больше.",
  "Новички дешевле, но рискованнее.",
  "Доверяй, но проверяй — особенно когда речь о куше.",
  "Документы могут стоить больше золота.",
  "В Фронтире припасы ценятся выше обычных вещей.",
  "В КСБ антиквариат — это не просто хлам.",
  "В Андурале магические предметы — ключ к успеху.",
  "В Нью-Элизиуме данные — новая валюта.",
  "На Перекрёстке люди могут стоить больше вещей.",
  "Адаптируй стратегию под каждый сеттинг.",
  "Не все категории одинаково прибыльны в каждом мире.",
  "Изучай множители — они меняются от мира к миру.",
  "Сохраняй настройки множителей для каждого сеттинга.",
  "Курс монеты зависит от общей казны — контролируй его.",
  "Меньше монет в обращении = выше их ценность.",
  "Больше монет = ниже ценность, но больше ликвидности.",
  "Баланс между дефицитом и избытком — искусство.",
  "Стандарт казны — это якорь стабильности.",
  "Базовый курс определяет экономику всей гильдии.",
  "Не меняй стандарт без веской причины.",
  "Инфляция убивает доверие к монете.",
  "Дефляция может быть опаснее инфляции.",
  "Контролируй выпуск монет через успешность забегов.",
  "Неудачные забеги могут повысить ценность монеты.",
  "Слишком успешные забеги обесценивают монету.",
  "Баланс — ключ к здоровой экономике.",
  "Следи за соотношением домов в казне.",
  "Дом с большей долей имеет больше влияния.",
  "Не позволяй никому монополизировать казну.",
  "Ротация лидеров между домами сохраняет баланс.",
  "Гильдмастер должен быть над домами, а не одним из них.",
  "Союз между домами сильнее, чем конфликты.",
  "Конфликты между домами ослабляют гильдию.",
  "Используй Дом Правосудия для разрешения споров.",
  "Дом Меценатства может смягчить последствия конфликтов.",
  "Дом Слуг — твои глаза и уши во всех домах.",
  "Доверяй слугам, но не давай им слишком много власти.",
  "Информация — самая ценная валюта.",
  "Предсказатель видит будущее, но не меняет его.",
  "Используй предсказания мудро, но не слепо.",
  "Каждый наёмник имеет свою цену — знай её.",
  "Лояльность наёмников важнее их навыков.",
  "Предательство наёмника может стоить дороже его жизни.",
  "Награждай лояльность — это инвестиция.",
  "Наказывай предательство — это урок для других.",
  "Репутация гильдии зависит от поведения наёмников.",
  "Плохой наёмник может испортить репутацию всей гильдии.",
  "Хороший наёмник может поднять репутацию гильдии.",
  "Выбирай наёмников мудро — они лицо гильдии.",
  "Обучай новичков — это инвестиция в будущее.",
  "Не трать всех опытных наёмников на один забег.",
  "Распределяй риски между разными группами.",
  "Диверсификация — ключ к выживанию.",
  "Не клади все яйца в одну корзину — даже если это корзина Гильдмастера.",
  "Анализируй прошлые забеги для планирования будущих.",
  "Статистика — твой лучший советник.",
  "Интуиция важна, но данные важнее.",
  "Доверяй цифрам, но не забывай про контекст.",
  "Каждый забег уникален — учитывай обстоятельства.",
  "Погода, время, место — всё влияет на успех.",
  "Подготовка — 90% успеха забега.",
  "Разведка стоит дешевле, чем потери.",
  "Не недооценивай противника — даже если это ребёнок.",
  "Не переоценивай себя — даже если ты Гильдмастер.",
  "Смирение — добродетель выживших.",
  "Гордыня — добродетель мёртвых.",
  "Баланс между уверенностью и осторожностью — искусство.",
  "Риск необходим, но должен быть оправдан.",
  "Награда должна соответствовать риску.",
  "Не рискуй всем ради малой выгоды.",
  "Иногда лучший забег — тот, который не состоялся.",
  "Отступление — не поражение, а мудрость.",
  "Мёртвые наёмники не приносят прибыли.",
  "Живые наёмники — это будущая прибыль.",
  "Инвестируй в их выживание — это окупится.",
  "Лечение дешевле, чем похороны.",
  "Страхование наёмников — не роскошь, а необходимость.",
  "Пенсионный фонд для ветеранов — хорошая инвестиция.",
  "Лояльные ветераны обучают новичков.",
  "Преемственность — ключ к долголетию гильдии.",
  "Гильдия сильнее, чем любой отдельный дом.",
  "Единство домов — сила гильдии.",
  "Разобщённость домов — слабость гильдии.",
  "Гильдмастер объединяет, а не разделяет.",
  "Твоя задача — видеть общую картину.",
  "Детали важны, но не теряй фокус.",
  "Стратегия важнее тактики.",
  "Тактика важнее импровизации.",
  "Импровизация лучше, чем отсутствие плана.",
  "План лучше, чем надежда.",
  "Надежда — не стратегия.",
  "Действие лучше бездействия.",
  "Но обдуманное действие лучше необдуманного.",
  "Терпение — добродетель Гильдмастера.",
  "Спешка — враг качества.",
  "Но промедление — враг возможности.",
  "Баланс между скоростью и качеством — искусство.",
  "Эликса всегда рядом, чтобы помочь.",
];

const DEFAULT_NAMES = [
  'Безымянный вор', 'Тень', 'Клинок', 'Ворон', 'Шепот',
  'Крыса', 'Призрак', 'Змей', 'Лис', 'Ястреб',
];

// === КОМПОНЕНТ ===
function App() {
  // --- Параметры забега ---
  const [runName, setRunName] = useState('Забег #1');
  const [cleanRunBonus, setCleanRunBonus] = useState(0);
  const [predictorPercent, setPredictorPercent] = useState(0);
  const [mercenaryCost, setMercenaryCost] = useState(50);
  const [lostMercenaries, setLostMercenaries] = useState(0);

  // --- Казна гильдии (динамический курс) ---
  const [treasuryStandard, setTreasuryStandard] = useState(10000); // стандарт (при котором курс = базовому)
  const [baseCourseAtStandard, setBaseCourseAtStandard] = useState(10); // курс при стандарте (ед. за 1 ГМ)

  // --- Дома правления ---
  const [houseMavo, setHouseMavo] = useState(2500); // Дом Маво (маги, паранормальное)
  const [houseAccounting, setHouseAccounting] = useState(3000); // Дом Бухгалтерии (взлом реальности, цифры)
  const [houseFamily, setHouseFamily] = useState(2500); // Дом Семьи (классическая мафия)
  const [houseGuildmaster, setHouseGuildmaster] = useState(2000); // Гильдмастер (глава гильдии)
  
  // --- Дома вне общей казны ---
  const [houseServants, setHouseServants] = useState(1500); // Дом Слуг (получает % со всех)
  const [housePatronage, setHousePatronage] = useState(1000); // Дом Меценатства (не влияет на инфляцию)
  const [houseJustice, setHouseJustice] = useState(1500); // Дом Правосудия (получает % кроме слуг и гильдмастера)

  // --- Репутация и сила домов (редактируемые вручную) ---
  const [houseReputationManual, setHouseReputationManual] = useState({
    mavo: 50,
    accounting: 50,
    family: 50,
    guildmaster: 50,
    servants: 50,
    patronage: 50,
    justice: 50,
  });
  
  const [housePowerManual, setHousePowerManual] = useState({
    mavo: 50,
    accounting: 50,
    family: 50,
    guildmaster: 50,
    servants: 50,
    patronage: 50,
    justice: 50,
  });
  
  // --- Проценты для специальных домов ---
  const [servantsPercent, setServantsPercent] = useState(5); // Дом Слуг получает 5% со всех
  const [justicePercent, setJusticePercent] = useState(3); // Дом Правосудия получает 3% (кроме слуг и гильдмастера)

  // Определения сеттингов с их категориями
  const SETTINGS = {
    'Перекрёсток': {
      categories: ['обычные вещи', 'дорогие вещи', 'редкие', 'люди', 'документы'],
      icon: '🛣',
      desc: 'Обычный мир',
    },
    'Фронтир': {
      categories: ['обычные вещи', 'редкие', 'техника', 'припасы', 'артефакты'],
      icon: '☢',
      desc: 'Пост-апокалипсис',
    },
    'КСБ': {
      categories: ['обычные вещи', 'дорогие вещи', 'редкие', 'люди', 'документы', 'антиквариат'],
      icon: '👑',
      desc: 'Российская империя 17-18 вв.',
    },
    'Андураль': {
      categories: ['обычные вещи', 'редкие', 'артефакты', 'магические предметы', 'монстры', 'люди'],
      icon: '🐉',
      desc: 'Фэнтези',
    },
    'Нью-Элизиум': {
      categories: ['обычные вещи', 'дорогие вещи', 'редкие', 'техника', 'данные', 'люди'],
      icon: '🌃',
      desc: 'Киберпанк',
    },
  };

  // --- Сеттинг ---
  const [currentSetting, setCurrentSetting] = useState<string>('Перекрёсток');
  
  // --- Множители (отдельные для каждого сеттинга) ---
  const [multipliersBySetting, setMultipliersBySetting] = useState<Record<string, Record<string, number>>>(() => {
    // Инициализируем множители для всех сеттингов
    const initial: Record<string, Record<string, number>> = {};
    Object.entries(SETTINGS).forEach(([settingName, settingData]) => {
      initial[settingName] = {};
      settingData.categories.forEach(cat => {
        initial[settingName][cat] = DEFAULT_MULTIPLIERS[cat] || 1.0;
      });
    });
    return initial;
  });
  
  // Получаем множители для текущего сеттинга
  const multipliers = multipliersBySetting[currentSetting] || {};
  
  // Функция для обновления множителей текущего сеттинга
  const setMultipliers = useCallback((newMultipliers: Record<string, number>) => {
    setMultipliersBySetting(prev => ({
      ...prev,
      [currentSetting]: newMultipliers
    }));
  }, [currentSetting]);

  // --- Куш ---
  const [kushName, setKushName] = useState('Куш');
  const [kushPrice, setKushPrice] = useState(0);
  const [hasKush, setHasKush] = useState(false);

  // --- Участники ---
  const [members, setMembers] = useState<PartyMember[]>([
    { id: '1', name: 'Первый', sharePercent: 20, reputation: 50 },
    { id: '2', name: 'Второй', sharePercent: 20, reputation: 50 },
    { id: '3', name: 'Третий', sharePercent: 20, reputation: 50 },
    { id: '4', name: 'Четвёртый', sharePercent: 20, reputation: 50 },
    { id: '5', name: 'Пятый', sharePercent: 20, reputation: 50 },
  ]);

  // --- Добыча ---
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: 'Кошелёк купца', category: 'обычные вещи', basePrice: 5, quantity: 3, stolen: true },
    { id: '2', name: 'Серебряный подсвечник', category: 'дорогие вещи', basePrice: 12, quantity: 1, stolen: true },
    { id: '3', name: 'Запечатанное письмо', category: 'документы', basePrice: 20, quantity: 1, stolen: true },
  ]);

  // --- Сохранение/загрузка ---
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Вкладки ---
  const [activeTab, setActiveTab] = useState<'run' | 'houses' | 'stats'>('run');

  // --- Совет для гильдмастера ---
  const [currentTipIndex, setCurrentTipIndex] = useState(() => {
    // Случайный совет при загрузке
    return Math.floor(Math.random() * GUILDMASTER_TIPS.length);
  });

  // --- Совет для наёмников ---
  const [mercenaryTipIndex, setMercenaryTipIndex] = useState(() => {
    return Math.floor(Math.random() * MERCENARY_TIPS.length);
  });

  // --- Все наёмники (история) ---
  const [allMercenaries, setAllMercenaries] = useState<PartyMember[]>([]);

  // Загрузка всех данных из localStorage при старте
  useEffect(() => {
    // Загружаем игровые данные (дома, множители, настройки)
    const savedGameData = localStorage.getItem('gameData');
    if (savedGameData) {
      try {
        const gameData = JSON.parse(savedGameData);
        if (gameData.houseMavo !== undefined) setHouseMavo(gameData.houseMavo);
        if (gameData.houseAccounting !== undefined) setHouseAccounting(gameData.houseAccounting);
        if (gameData.houseFamily !== undefined) setHouseFamily(gameData.houseFamily);
        if (gameData.houseGuildmaster !== undefined) setHouseGuildmaster(gameData.houseGuildmaster);
        if (gameData.houseServants !== undefined) setHouseServants(gameData.houseServants);
        if (gameData.housePatronage !== undefined) setHousePatronage(gameData.housePatronage);
        if (gameData.houseJustice !== undefined) setHouseJustice(gameData.houseJustice);
        if (gameData.houseReputationManual) setHouseReputationManual(gameData.houseReputationManual);
        if (gameData.housePowerManual) setHousePowerManual(gameData.housePowerManual);
        if (gameData.multipliersBySetting) setMultipliersBySetting(gameData.multipliersBySetting);
        if (gameData.treasuryStandard !== undefined) setTreasuryStandard(gameData.treasuryStandard);
        if (gameData.baseCourseAtStandard !== undefined) setBaseCourseAtStandard(gameData.baseCourseAtStandard);
      } catch (e) {
        console.error('Failed to load game data:', e);
      }
    }

    // Загружаем наёмников из отдельного хранилища (они приоритетнее)
    const savedMercs = localStorage.getItem('allMercenaries');
    if (savedMercs) {
      try {
        setAllMercenaries(JSON.parse(savedMercs));
      } catch (e) {
        console.error('Failed to load mercenaries:', e);
      }
    }
    
    // Загружаем забеги
    const saved = localStorage.getItem('savedRuns');
    if (saved) {
      try {
        const runs: SavedRun[] = JSON.parse(saved);
        setSavedRuns(runs);
        
        // Если наёмников не было в отдельном хранилище — собираем из забегов
        if (!savedMercs) {
          const allMergs: PartyMember[] = [];
          const seenNames = new Set<string>();
          
          runs.forEach(run => {
            const mercs = run.data.allMercenaries || run.data.members || [];
            mercs.forEach(m => {
              if (!seenNames.has(m.name)) {
                seenNames.add(m.name);
                allMergs.push(m);
              }
            });
          });
          
          if (allMergs.length > 0) {
            setAllMercenaries(allMergs);
          }
        }
      } catch (e) {
        console.error('Failed to load saved runs:', e);
      }
    }
  }, []);

  // Автосохранение наёмников в localStorage при каждом изменении
  useEffect(() => {
    localStorage.setItem('allMercenaries', JSON.stringify(allMercenaries));
  }, [allMercenaries]);

  // Автосохранение всех остальных данных (дома, множители, настройки)
  useEffect(() => {
    const gameData = {
      houseMavo,
      houseAccounting,
      houseFamily,
      houseGuildmaster,
      houseServants,
      housePatronage,
      houseJustice,
      houseReputationManual,
      housePowerManual,
      multipliersBySetting,
      treasuryStandard,
      baseCourseAtStandard,
    };
    localStorage.setItem('gameData', JSON.stringify(gameData));
  }, [houseMavo, houseAccounting, houseFamily, houseGuildmaster, houseServants, housePatronage, houseJustice, houseReputationManual, housePowerManual, multipliersBySetting, treasuryStandard, baseCourseAtStandard]);

  // Получить текущие данные забега
  const getCurrentRunData = useCallback((): RunData => {
    return {
      runName,
      currentSetting,
      cleanRunBonus,
      predictorPercent,
      mercenaryCost,
      lostMercenaries,
      houseMavo,
      houseAccounting,
      houseFamily,
      houseGuildmaster,
      houseServants,
      housePatronage,
      houseJustice,
      servantsPercent,
      justicePercent,
      treasuryStandard,
      baseCourseAtStandard,
      multipliersBySetting,
      kushName,
      kushPrice,
      hasKush,
      members,
      items,
      allMercenaries,
    };
  }, [runName, currentSetting, cleanRunBonus, predictorPercent, mercenaryCost, lostMercenaries, houseMavo, houseAccounting, houseFamily, houseGuildmaster, houseServants, housePatronage, houseJustice, servantsPercent, justicePercent, treasuryStandard, baseCourseAtStandard, multipliersBySetting, kushName, kushPrice, hasKush, members, items, allMercenaries]);

  // Загрузить данные забега
  const loadRunData = useCallback((data: RunData) => {
    setRunName(data.runName);
    setCurrentSetting(data.currentSetting || 'Перекрёсток');
    setCleanRunBonus(data.cleanRunBonus);
    setPredictorPercent(data.predictorPercent);
    setMercenaryCost(data.mercenaryCost);
    setLostMercenaries(data.lostMercenaries);
    setHouseMavo(data.houseMavo);
    setHouseAccounting(data.houseAccounting);
    setHouseFamily(data.houseFamily);
    setHouseGuildmaster(data.houseGuildmaster);
    setHouseServants(data.houseServants);
    setHousePatronage(data.housePatronage);
    setHouseJustice(data.houseJustice);
    setServantsPercent(data.servantsPercent);
    setJusticePercent(data.justicePercent);
    setTreasuryStandard(data.treasuryStandard);
    setBaseCourseAtStandard(data.baseCourseAtStandard);
    if (data.multipliersBySetting) {
      setMultipliersBySetting(data.multipliersBySetting);
    }
    setKushName(data.kushName);
    setKushPrice(data.kushPrice);
    setHasKush(data.hasKush);
    setMembers(data.members);
    setItems(data.items);
    
    // Объединяем наёмников из забега с текущими (без дубликатов)
    setAllMercenaries(prev => {
      const existingNames = new Set(prev.map(m => m.name));
      // Берём наёмников из allMercenaries или из members (для старых забегов)
      const runMercs = data.allMercenaries || data.members || [];
      const newMercs = runMercs.filter((m: PartyMember) => !existingNames.has(m.name));
      return [...prev, ...newMercs];
    });
  }, []);

  // Сохранить текущий забег
  const saveCurrentRun = useCallback(() => {
    const newRun: SavedRun = {
      id: Date.now().toString(),
      name: runName,
      timestamp: Date.now(),
      data: getCurrentRunData(),
    };
    const updated = [...savedRuns, newRun];
    setSavedRuns(updated);
    localStorage.setItem('savedRuns', JSON.stringify(updated));
  }, [runName, savedRuns, getCurrentRunData]);

  // Загрузить забег по ID
  const loadRun = useCallback((id: string) => {
    const run = savedRuns.find(r => r.id === id);
    if (run) {
      loadRunData(run.data);
      setShowSaveModal(false);
    }
  }, [savedRuns, loadRunData]);

  // Удалить забег
  const deleteRun = useCallback((id: string) => {
    const updated = savedRuns.filter(r => r.id !== id);
    setSavedRuns(updated);
    localStorage.setItem('savedRuns', JSON.stringify(updated));
  }, [savedRuns]);

  // Экспорт в JSON файл
  const exportToFile = useCallback(() => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      runs: savedRuns,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Создаём ссылку и кликаем
    const a = document.createElement('a');
    a.href = url;
    a.download = `guild-runs-${new Date().toISOString().split('T')[0]}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    
    // Небольшая задержка для надёжности
    setTimeout(() => {
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Показываем уведомление об успехе
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    }, 100);
  }, [savedRuns]);

  // Импорт из JSON файла
  const importFromFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.runs && Array.isArray(data.runs)) {
          const merged = [...savedRuns, ...data.runs];
          setSavedRuns(merged);
          localStorage.setItem('savedRuns', JSON.stringify(merged));
          
          // Извлекаем всех наёмников из импортированных забегов
          const importedMercs: PartyMember[] = [];
          data.runs.forEach((run: SavedRun) => {
            if (run.data.allMercenaries && Array.isArray(run.data.allMercenaries)) {
              importedMercs.push(...run.data.allMercenaries);
            }
          });
          
          // Объединяем с текущими наёмниками (без дубликатов)
          if (importedMercs.length > 0) {
            setAllMercenaries(prev => {
              const existingNames = new Set(prev.map(m => m.name));
              const newMercs = importedMercs.filter(m => !existingNames.has(m.name));
              return [...prev, ...newMercs];
            });
          }
          
          alert(`Импортировано ${data.runs.length} забегов${importedMercs.length > 0 ? ` и ${importedMercs.length} наёмников` : ''}`);
        } else {
          alert('Неверный формат файла');
        }
      } catch (error) {
        alert('Ошибка при чтении файла');
      }
    };
    reader.readAsText(file);
    
    // Сброс input для возможности повторной загрузки того же файла
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [savedRuns]);

  // --- Функции для предметов ---
  const addItem = useCallback(() => {
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      name: 'Новый предмет',
      category: 'обычное',
      basePrice: 1,
      quantity: 1,
      stolen: true,
    }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateItem = useCallback((id: string, field: keyof Item, value: string | number | boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }, []);

  // --- Функции для участников ---
  const addMember = useCallback(() => {
    const idx = members.length;
    setMembers(prev => [...prev, {
      id: Date.now().toString(),
      name: DEFAULT_NAMES[idx % DEFAULT_NAMES.length] || `Наёмник #${idx + 1}`,
      sharePercent: 0,
      reputation: 50,
    }]);
  }, [members.length]);

  const removeMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMember = useCallback((id: string, field: keyof PartyMember, value: string | number) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  }, []);

  const equalizeShares = useCallback(() => {
    if (members.length === 0) return;
    const equal = Math.floor(100 / members.length * 10) / 10;
    setMembers(prev => prev.map(m => ({ ...m, sharePercent: equal })));
  }, [members.length]);

  // === РАСЧЁТ ===
  const calc = useMemo(() => {
    // Общая казна = Маво + Бухгалтерия + Семья + Гильдмастер (без слуг, меценатства, правосудия)
    const mainHousesTotal = houseMavo + houseAccounting + houseFamily + houseGuildmaster;
    
    // Дом Слуг получает процент со ВСЕХ основных домов
    const servantsCut = Math.floor(mainHousesTotal * (servantsPercent / 100));
    
    // Дом Правосудия получает процент с Маво + Бухгалтерия + Семья (без слуг и гильдмастера)
    const justiceBase = houseMavo + houseAccounting + houseFamily;
    const justiceCut = Math.floor(justiceBase * (justicePercent / 100));
    
    // Общая казна для расчёта курса (без специальных домов)
    const totalTreasury = mainHousesTotal;

    // 0. Текущий курс гильдейской монеты
    // Чем больше монет в обращении — тем выше курс (монета дешевле)
    // Чем меньше монет — тем ниже курс (монета дороже)
    const currentRate = Math.max(1, baseCourseAtStandard * (totalTreasury / treasuryStandard));

    // Статистика домов
    const houseStats = {
      mavo: {
        amount: houseMavo,
        percent: mainHousesTotal > 0 ? (houseMavo / mainHousesTotal) * 100 : 0,
        color: 'purple',
        icon: '🔮',
        name: 'Дом Маво',
      },
      accounting: {
        amount: houseAccounting,
        percent: mainHousesTotal > 0 ? (houseAccounting / mainHousesTotal) * 100 : 0,
        color: 'cyan',
        icon: '📊',
        name: 'Дом Бухгалтерии',
      },
      family: {
        amount: houseFamily,
        percent: mainHousesTotal > 0 ? (houseFamily / mainHousesTotal) * 100 : 0,
        color: 'red',
        icon: '🗡',
        name: 'Дом Семьи',
      },
      guildmaster: {
        amount: houseGuildmaster,
        percent: mainHousesTotal > 0 ? (houseGuildmaster / mainHousesTotal) * 100 : 0,
        color: 'amber',
        icon: '👑',
        name: 'Гильдмастер',
      },
      servants: {
        amount: houseServants,
        percent: 0, // Не учитывается в общей казне
        color: 'gray',
        icon: '🙇',
        name: 'Дом Слуг',
        income: servantsCut,
      },
      patronage: {
        amount: housePatronage,
        percent: 0, // Не учитывается в общей казне
        color: 'pink',
        icon: '🎭',
        name: 'Дом Меценатства',
      },
      justice: {
        amount: houseJustice,
        percent: 0, // Не учитывается в инфляции
        color: 'blue',
        icon: '⚖',
        name: 'Дом Правосудия',
        income: justiceCut,
      },
    };

    // 1. Сумма добычи
    let lootSum = 0;
    const perCategory: Record<string, { count: number; value: number }> = {};
    // Инициализируем категории текущего сеттинга
    SETTINGS[currentSetting as keyof typeof SETTINGS].categories.forEach(cat => {
      perCategory[cat] = { count: 0, value: 0 };
    });

    items.forEach(item => {
      if (item.stolen) {
        const val = item.basePrice * item.quantity * (multipliers[item.category] || DEFAULT_MULTIPLIERS[item.category] || 1.0);
        lootSum += val;
        // Защита от несуществующих категорий
        if (!perCategory[item.category]) {
          perCategory[item.category] = { count: 0, value: 0 };
        }
        perCategory[item.category].count += item.quantity;
        perCategory[item.category].value += val;
      }
    });

    // 2. Куш
    const kushValue = hasKush ? kushPrice : 0;
    const totalLoot = lootSum + kushValue;

    // 3. Бонус за чистый забег (прибавляет %)
    const lootWithBonus = totalLoot * (1 + cleanRunBonus / 100);

    // 4. Штраф за погибших (может быть больше добычи!)
    const penalty = mercenaryCost * lostMercenaries;

    // 5. После штрафов (может быть отрицательным)
    const afterPenalty = lootWithBonus - penalty;

    // 6. Предсказатель забирает % от положительной части
    const predictorCut = afterPenalty > 0 ? afterPenalty * (predictorPercent / 100) : 0;

    // 7. Итого к распределению
    const distributable = afterPenalty - predictorCut;

    // 8. В гильдейских монетах (всегда целые, округление вниз)
    const totalGM = Math.floor(distributable / currentRate);
    const penaltyGM = Math.floor(penalty / currentRate);
    const predictorGM = Math.floor(predictorCut / currentRate);
    const lootWithBonusGM = Math.floor(lootWithBonus / currentRate);
    const mercenaryCostGM = Math.floor(mercenaryCost / currentRate);

    // 9. Распределение по участникам (каждый получает целое число ГМ)
    const totalShares = members.reduce((s, m) => s + m.sharePercent, 0);
    const memberPayouts = members.map(m => {
      const fraction = totalShares > 0 ? m.sharePercent / totalShares : 0;
      const payoutGM = Math.floor(totalGM * fraction);
      return { ...m, payoutGM };
    });

    // 10. Репутация и сила домов (используем ручные значения)
    const houseReputation = houseReputationManual;
    const housePower = housePowerManual;
    
    // 11. Общая репутация гильдии (среднее всех домов)
    const guildReputation = Math.round(
      (houseReputation.mavo + houseReputation.accounting + houseReputation.family + 
       houseReputation.guildmaster + houseReputation.servants + 
       houseReputation.patronage + houseReputation.justice) / 7
    );
    
    // 12. Общая сила гильдии
    const guildPower = Math.round(
      (housePower.mavo + housePower.accounting + housePower.family + 
       housePower.guildmaster + housePower.servants + 
       housePower.patronage + housePower.justice) / 7
    );

    return {
      lootSum,
      kushValue,
      totalLoot,
      lootWithBonus,
      lootWithBonusGM,
      penalty,
      penaltyGM,
      afterPenalty,
      predictorCut,
      predictorGM,
      distributable,
      totalGM,
      mercenaryCostGM,
      currentRate,
      totalTreasury,
      mainHousesTotal,
      servantsCut,
      justiceCut,
      houseStats,
      perCategory,
      memberPayouts,
      totalShares,
      isInDebt: totalGM < 0,
      houseReputation,
      housePower,
      guildReputation,
      guildPower,
    };
  }, [items, multipliers, hasKush, kushPrice, cleanRunBonus, mercenaryCost, lostMercenaries, predictorPercent, houseMavo, houseAccounting, houseFamily, houseGuildmaster, houseServants, housePatronage, houseJustice, servantsPercent, justicePercent, treasuryStandard, baseCourseAtStandard, members, currentSetting, houseReputationManual, housePowerManual]);

  // Завершить забег - сохранить в JSON и сбросить участников/лут
  const finishRun = useCallback(() => {
    // 1. Сначала обновляем allMercenaries синхронно
    const existingNames = new Set(allMercenaries.map(m => m.name));
    const newMercs = members.filter(m => !existingNames.has(m.name));
    const updatedAllMercenaries = [...allMercenaries, ...newMercs];
    
    // 2. Обновляем состояние
    setAllMercenaries(updatedAllMercenaries);

    // 3. Сохраняем текущий забег в JSON файл с обновлёнными данными
    const runData = {
      ...getCurrentRunData(),
      allMercenaries: updatedAllMercenaries, // Используем обновлённый массив
    };
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      runs: [{
        id: Date.now().toString(),
        name: runName,
        timestamp: Date.now(),
        data: runData,
      }],
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `run-${runName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    
    setTimeout(() => {
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    // 3. Сбрасываем участников и лут
    setItems([]);
    setMembers([]);
    
    // 4. Увеличиваем номер забега
    const match = runName.match(/#(\d+)$/);
    if (match) {
      const num = parseInt(match[1]) + 1;
      setRunName(runName.replace(/#\d+$/, `#${num}`));
    }

    alert(`Забег "${runName}" завершён и сохранён!\nПолучено: ${calc.totalGM} ГМ\n\nУчастники и лут сброшены.`);
  }, [runName, calc.totalGM, members, getCurrentRunData]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-3 md:p-5">
      {/* Заголовок */}
      <header className="mb-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          {/* Совет для наёмников (слева) */}
          <div className="bg-gray-800/80 border border-red-700/30 rounded-lg p-3 max-w-md order-2 lg:order-1">
            <div className="flex items-start gap-2">
              <span className="text-red-400 text-lg flex-shrink-0">🗡</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 italic leading-relaxed">
                  {MERCENARY_TIPS[mercenaryTipIndex]}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setMercenaryTipIndex(prev => 
                      prev === 0 ? MERCENARY_TIPS.length - 1 : prev - 1
                    )}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    title="Предыдущий совет"
                  >
                    ←
                  </button>
                  <span className="text-xs text-gray-600">
                    {mercenaryTipIndex + 1} / {MERCENARY_TIPS.length}
                  </span>
                  <button
                    onClick={() => setMercenaryTipIndex(prev => 
                      prev === MERCENARY_TIPS.length - 1 ? 0 : prev + 1
                    )}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    title="Следующий совет"
                  >
                    →
                  </button>
                  <button
                    onClick={() => setMercenaryTipIndex(Math.floor(Math.random() * MERCENARY_TIPS.length))}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors ml-2"
                    title="Случайный совет"
                  >
                    🎲
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Заголовок (по центру) */}
          <div className="text-center flex-1 order-1 lg:order-2">
            <h1 className="text-xl md:text-2xl font-bold text-amber-400">
              🖤 Эликса — Помощница Гильдмастера 🖤
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              Суккуб-бухгалтер гильдии воров и наёмников
            </p>
          </div>
          
          {/* Совет для гильдмастера (справа) */}
          <div className="bg-gray-800/80 border border-amber-700/30 rounded-lg p-3 max-w-md order-3">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 text-lg flex-shrink-0">💡</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 italic leading-relaxed">
                  {GUILDMASTER_TIPS[currentTipIndex]}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setCurrentTipIndex(prev => 
                      prev === 0 ? GUILDMASTER_TIPS.length - 1 : prev - 1
                    )}
                    className="text-xs text-gray-500 hover:text-amber-400 transition-colors"
                    title="Предыдущий совет"
                  >
                    ←
                  </button>
                  <span className="text-xs text-gray-600">
                    {currentTipIndex + 1} / {GUILDMASTER_TIPS.length}
                  </span>
                  <button
                    onClick={() => setCurrentTipIndex(prev => 
                      prev === GUILDMASTER_TIPS.length - 1 ? 0 : prev + 1
                    )}
                    className="text-xs text-gray-500 hover:text-amber-400 transition-colors"
                    title="Следующий совет"
                  >
                    →
                  </button>
                  <button
                    onClick={() => setCurrentTipIndex(Math.floor(Math.random() * GUILDMASTER_TIPS.length))}
                    className="text-xs text-gray-500 hover:text-amber-400 transition-colors ml-2"
                    title="Случайный совет"
                  >
                    🎲
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Панель управления сохранением */}
      <div className="max-w-7xl mx-auto mb-3 flex flex-wrap gap-2 items-center justify-center">
        <button
          onClick={saveCurrentRun}
          className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1"
        >
          💾 Сохранить забег
        </button>
        <button
          onClick={() => setShowSaveModal(true)}
          className="bg-blue-700 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1"
        >
          📂 Загрузить ({savedRuns.length})
        </button>
        <button
          onClick={() => {
            if (savedRuns.length === 0) {
              alert('Сначала сохраните хотя бы один забег');
              return;
            }
            exportToFile();
          }}
          className={`${exportSuccess ? 'bg-green-600' : 'bg-purple-700 hover:bg-purple-600'} text-white text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1`}
          title={savedRuns.length === 0 ? 'Сначала сохраните забег' : `Экспорт ${savedRuns.length} забегов`}
        >
          {exportSuccess ? '✓ Экспортировано' : `📤 Экспорт ${savedRuns.length > 0 ? `(${savedRuns.length})` : ''}`}
        </button>
        <label className="bg-orange-700 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer">
          📥 Импорт
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importFromFile}
            className="hidden"
          />
        </label>
      </div>

      {/* Переключатель вкладок */}
      <div className="max-w-7xl mx-auto mb-3">
        <div className="flex gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => setActiveTab('run')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'run'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            🎯 Забег
          </button>
          <button
            onClick={() => setActiveTab('houses')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'houses'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            🏛 Дома Гильдии
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'stats'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            📊 Статистика
          </button>
        </div>
      </div>

      {activeTab === 'run' && (
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3">

        {/* ===== ЛЕВАЯ КОЛОНКА: Параметры + Участники + Предсказатель ===== */}
        <div className="lg:col-span-3 space-y-3">

          {/* Параметры забега */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <h2 className="text-sm font-semibold text-amber-300 mb-2">📋 Параметры забега</h2>
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs text-gray-400 mb-0.5">Название</label>
                <input
                  type="text"
                  value={runName}
                  onChange={e => setRunName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-0.5">Сеттинг (откуда воруют)</label>
                <select
                  value={currentSetting}
                  onChange={e => {
                    setCurrentSetting(e.target.value);
                    // При смене сеттинга обновляем категории предметов на категории нового сеттинга
                    const newCategories = SETTINGS[e.target.value as keyof typeof SETTINGS].categories;
                    setItems(prev => prev.map(item => ({
                      ...item,
                      category: newCategories.includes(item.category) ? item.category : newCategories[0]
                    })));
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
                >
                  {Object.entries(SETTINGS).map(([name, data]) => (
                    <option key={name} value={name}>{data.icon} {name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-0.5 italic">
                  {SETTINGS[currentSetting as keyof typeof SETTINGS].desc}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Категории: {SETTINGS[currentSetting as keyof typeof SETTINGS].categories.join(', ')}
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-0.5">
                  Бонус за чистый забег: <span className="text-green-400">+{cleanRunBonus}%</span>
                </label>
                <input
                  type="range"
                  value={cleanRunBonus}
                  onChange={e => setCleanRunBonus(Number(e.target.value))}
                  min="0" max="100" step="5"
                  className="w-full accent-green-500"
                />
              </div>
            </div>
          </div>

          {/* Множители */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-amber-300">📊 Множители</h2>
              <button
                onClick={() => {
                  // Сбросить множители для категорий текущего сеттинга
                  const currentCategories = SETTINGS[currentSetting as keyof typeof SETTINGS].categories;
                  const newMultipliers = { ...multipliers };
                  currentCategories.forEach(cat => {
                    newMultipliers[cat] = DEFAULT_MULTIPLIERS[cat] || 1.0;
                  });
                  setMultipliers(newMultipliers);
                }}
                className="text-xs text-gray-500 hover:text-gray-300 border border-gray-600 rounded px-1.5 py-0.5 transition-colors"
              >
                ↺
              </button>
            </div>
            <div className="space-y-1.5">
              {SETTINGS[currentSetting as keyof typeof SETTINGS].categories.map(cat => (
                <div key={cat} className="flex justify-between items-center gap-1">
                  <span className={`text-xs ${getCategoryColor(cat)}`}>
                    {getCategoryIcon(cat)} {cat}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-gray-600 text-xs">×</span>
                    <input
                      type="number"
                      value={multipliers[cat] || DEFAULT_MULTIPLIERS[cat] || 1.0}
                      onChange={e => {
                        const v = Math.max(0, Number(e.target.value));
                        setMultipliers({ ...multipliers, [cat]: v });
                      }}
                      min="0" step="0.5"
                      className="w-14 bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-center text-xs font-mono text-gray-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Потери */}
          <div className="bg-gray-800 rounded-lg p-3 border border-red-900/40">
            <h2 className="text-sm font-semibold text-red-400 mb-2">💀 Потери</h2>
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs text-gray-400 mb-0.5">Стоимость наёмника (ед.)</label>
                <input
                  type="number"
                  value={mercenaryCost}
                  onChange={e => setMercenaryCost(Math.max(0, Number(e.target.value)))}
                  min="0" step="5"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-red-500"
                />
                <p className="text-xs text-gray-600 mt-0.5">= {calc.mercenaryCostGM} ГМ за голову</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-0.5">Погибло наёмников</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLostMercenaries(Math.max(0, lostMercenaries - 1))}
                    className="bg-red-900/50 hover:bg-red-800/50 text-red-300 w-8 h-8 rounded flex items-center justify-center text-lg font-bold transition-colors"
                  >−</button>
                  <span className="font-mono text-xl text-red-400 w-8 text-center">{lostMercenaries}</span>
                  <button
                    onClick={() => setLostMercenaries(lostMercenaries + 1)}
                    className="bg-red-900/50 hover:bg-red-800/50 text-red-300 w-8 h-8 rounded flex items-center justify-center text-lg font-bold transition-colors"
                  >+</button>
                </div>
                {calc.penalty > 0 && (
                  <p className="text-xs text-red-400 mt-1">
                    Штраф: −{calc.penalty.toFixed(0)} ед. (−{calc.penaltyGM} ГМ)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Предсказатель */}
          <div className="bg-gray-800 rounded-lg p-3 border border-indigo-900/40">
            <h2 className="text-sm font-semibold text-indigo-400 mb-2">🔮 Предсказатель</h2>
            <div>
              <label className="block text-xs text-gray-400 mb-0.5">
                Доля предсказателя: <span className="text-indigo-400">{predictorPercent}%</span>
              </label>
              <input
                type="range"
                value={predictorPercent}
                onChange={e => setPredictorPercent(Number(e.target.value))}
                min="0" max="50" step="1"
                className="w-full accent-indigo-500"
              />
              {calc.predictorCut > 0 && (
                <p className="text-xs text-indigo-400 mt-1">
                  Забирает: {calc.predictorCut.toFixed(1)} ед. ({calc.predictorGM} ГМ)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ===== ЦЕНТРАЛЬНАЯ КОЛОНКА: Участники + Добыча ===== */}
        <div className="lg:col-span-5 space-y-3">

          {/* Участники */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-amber-300">
                🗡 Участники ({members.length})
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={equalizeShares}
                  className="text-xs text-gray-400 hover:text-gray-200 border border-gray-600 rounded px-2 py-0.5 transition-colors"
                >
                  ⚖ поровну
                </button>
                <button
                  onClick={addMember}
                  className="text-xs bg-amber-600 hover:bg-amber-500 text-white rounded px-2 py-0.5 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={m.name}
                    onChange={e => updateMember(m.id, 'name', e.target.value)}
                    className="flex-1 bg-transparent border-b border-transparent hover:border-gray-600 focus:border-amber-500 focus:outline-none text-sm py-0.5 min-w-0"
                  />
                  <div className="flex items-center gap-0.5 shrink-0">
                    <input
                      type="number"
                      value={m.sharePercent}
                      onChange={e => updateMember(m.id, 'sharePercent', Math.max(0, Number(e.target.value)))}
                      min="0" step="1"
                      className="w-12 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-center text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-gray-500 text-xs">%</span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0" title="Репутация">
                    <input
                      type="number"
                      value={m.reputation}
                      onChange={e => updateMember(m.id, 'reputation', Math.max(0, Math.min(100, Number(e.target.value))))}
                      min="0" max="100" step="1"
                      className={`w-10 bg-gray-700 border rounded px-1 py-0.5 text-center text-xs font-mono focus:outline-none focus:border-amber-500 ${
                        m.reputation >= 75 ? 'border-green-600 text-green-400' :
                        m.reputation >= 50 ? 'border-yellow-600 text-yellow-400' :
                        m.reputation >= 25 ? 'border-orange-600 text-orange-400' :
                        'border-red-600 text-red-400'
                      }`}
                    />
                  </div>
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-red-500/60 hover:text-red-400 text-sm shrink-0 w-5 text-center"
                  >×</button>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-1.5 border-t border-gray-700 flex justify-between text-xs">
              <span className="text-gray-500">Сумма долей:</span>
              <span className={`font-mono ${calc.totalShares === 100 ? 'text-green-400' : 'text-amber-400'}`}>
                {calc.totalShares.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Добыча */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-amber-300">🎒 Добыча</h2>
              <button
                onClick={addItem}
                className="text-xs bg-amber-600 hover:bg-amber-500 text-white rounded px-2 py-0.5 transition-colors"
              >
                + предмет
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-gray-600 text-center py-4 text-sm">Пусто</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-700">
                      <th className="text-left py-1 px-1">Предмет</th>
                      <th className="text-left py-1 px-1">Кат.</th>
                      <th className="text-center py-1 px-1">Цена</th>
                      <th className="text-center py-1 px-1">Кол.</th>
                      <th className="text-center py-1 px-1">Итого</th>
                      <th className="py-1 px-0.5"></th>
                      <th className="py-1 px-0.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const val = item.basePrice * item.quantity * (multipliers[item.category] || DEFAULT_MULTIPLIERS[item.category] || 1.0);
                      return (
                        <tr key={item.id} className={`border-b border-gray-700/30 ${!item.stolen ? 'opacity-30' : ''}`}>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              value={item.name}
                              onChange={e => updateItem(item.id, 'name', e.target.value)}
                              className="bg-transparent border-b border-transparent hover:border-gray-600 focus:border-amber-500 focus:outline-none w-full text-xs py-0.5"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <select
                              value={item.category}
                              onChange={e => updateItem(item.id, 'category', e.target.value)}
                              className={`bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-amber-500 ${getCategoryColor(item.category)}`}
                            >
                              {SETTINGS[currentSetting as keyof typeof SETTINGS].categories.map(c => (
                                <option key={c} value={c} style={{ color: getCategoryColorHex(c) }}>
                                  {getCategoryIcon(c)} {c}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-1 px-1 text-center">
                            <input
                              type="number"
                              value={item.basePrice}
                              onChange={e => updateItem(item.id, 'basePrice', Math.max(0, Number(e.target.value)))}
                              min="0" step="1"
                              className="w-12 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-center text-xs font-mono focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e => updateItem(item.id, 'quantity', Math.max(0, Number(e.target.value)))}
                              min="0" step="1"
                              className="w-10 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-center text-xs font-mono focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className={`py-1 px-1 text-center font-mono ${getCategoryColor(item.category)}`}>
                            {item.stolen ? val.toFixed(0) : '—'}
                          </td>
                          <td className="py-1 px-0.5 text-center">
                            <input
                              type="checkbox"
                              checked={item.stolen}
                              onChange={e => updateItem(item.id, 'stolen', e.target.checked)}
                              className="accent-amber-500 w-3 h-3"
                              title="Учтено в добыче"
                            />
                          </td>
                          <td className="py-1 px-0.5 text-center">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-500/60 hover:text-red-400 text-sm"
                            >×</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Куш */}
            <div className="mt-3 pt-2 border-t border-gray-700">
              <div className="flex items-center gap-2 mb-1.5">
                <input
                  type="checkbox"
                  checked={hasKush}
                  onChange={e => setHasKush(e.target.checked)}
                  className="accent-amber-500 w-3.5 h-3.5"
                />
                <span className="text-sm font-semibold text-amber-400">👑 Куш</span>
                <span className="text-xs text-gray-500">(особо ценный предмет)</span>
              </div>
              {hasKush && (
                <div className="flex items-center gap-2 ml-5">
                  <input
                    type="text"
                    value={kushName}
                    onChange={e => setKushName(e.target.value)}
                    className="flex-1 bg-gray-700 border border-amber-700/50 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500"
                    placeholder="Название куша"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={kushPrice}
                      onChange={e => setKushPrice(Math.max(0, Number(e.target.value)))}
                      min="0" step="10"
                      className="w-20 bg-gray-700 border border-amber-700/50 rounded px-2 py-1 text-center text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-xs text-gray-500">ед.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== ПРАВАЯ КОЛОНКА: Итоги + Распределение ===== */}
        <div className="lg:col-span-4 space-y-3">

          {/* Итоги */}
          <div className={`rounded-lg p-3 border ${calc.isInDebt ? 'bg-red-950/30 border-red-700/50' : 'bg-gray-800 border-amber-700/50'}`}>
            <h2 className="text-sm font-semibold text-amber-300 mb-2">
              💰 Итоги: {runName}
            </h2>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center pb-1 mb-1 border-b border-gray-700">
                <span className="text-gray-400">Текущий курс:</span>
                <span className="font-mono text-amber-400 font-semibold">
                  1 ГМ = {calc.currentRate.toFixed(1)} ед.
                </span>
              </div>
              {calc.totalTreasury < treasuryStandard && (
                <div className="text-xs text-green-400/70 text-center mb-1">
                  ↑ Монета дороже стандарта (дефицит)
                </div>
              )}
              {calc.totalTreasury > treasuryStandard && (
                <div className="text-xs text-red-400/70 text-center mb-1">
                  ↓ Монета дешевле стандарта (избыток)
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Добыча (база):</span>
                <span className="font-mono text-gray-300">{calc.lootSum.toFixed(0)} ед.</span>
              </div>
              {hasKush && (
                <div className="flex justify-between">
                  <span className="text-amber-400">Куш ({kushName}):</span>
                  <span className="font-mono text-amber-400">+{calc.kushValue.toFixed(0)} ед.</span>
                </div>
              )}
              {cleanRunBonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-400">Бонус за чистоту (+{cleanRunBonus}%):</span>
                  <span className="font-mono text-green-400">→ {calc.lootWithBonus.toFixed(0)} ед.</span>
                </div>
              )}
              {calc.penalty > 0 && (
                <div className="flex justify-between">
                  <span className="text-red-400">
                    Штраф за погибших (×{lostMercenaries}):
                  </span>
                  <span className="font-mono text-red-400">−{calc.penalty.toFixed(0)} ед.</span>
                </div>
              )}
              {calc.predictorCut > 0 && (
                <div className="flex justify-between">
                  <span className="text-indigo-400">Предсказатель ({predictorPercent}%):</span>
                  <span className="font-mono text-indigo-400">−{calc.predictorCut.toFixed(0)} ед.</span>
                </div>
              )}

              <div className="border-t border-gray-700 pt-1.5 mt-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-200 font-semibold">К распределению:</span>
                  <span className={`font-mono text-lg font-bold ${calc.isInDebt ? 'text-red-400' : 'text-amber-400'}`}>
                    {calc.totalGM} ГМ
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>в единицах:</span>
                  <span className="font-mono">{calc.distributable.toFixed(1)} ед.</span>
                </div>
              </div>

              {calc.isInDebt && (
                <div className="mt-2 p-2 bg-red-900/30 rounded border border-red-800/50">
                  <p className="text-red-400 text-xs font-semibold">
                    ⚠ Группа должна гильдии {Math.abs(calc.totalGM)} ГМ!
                  </p>
                  <p className="text-red-400/70 text-xs mt-0.5">
                    Штрафы за погибших превысили добычу.
                  </p>
                </div>
              )}

              {/* Кнопка завершения забега */}
              <button
                onClick={finishRun}
                className="w-full mt-3 bg-green-700 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors text-sm"
              >
                ✅ Завершить забег
              </button>
            </div>
          </div>

          {/* Разбивка по категориям */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <h2 className="text-sm font-semibold text-amber-300 mb-2">📦 По категориям</h2>
            <div className="space-y-1">
              {(Object.entries(calc.perCategory) as [ItemCategory, { count: number; value: number }][]).map(([cat, data]) => (
                data.count > 0 && (
                  <div key={cat} className="flex justify-between text-xs">
                    <span className={getCategoryColor(cat)}>
                      {getCategoryIcon(cat)} {cat}
                    </span>
                    <span className="text-gray-400 font-mono">
                      {data.count} шт. → {data.value.toFixed(0)} ед.
                    </span>
                  </div>
                )
              ))}
              {hasKush && (
                <div className="flex justify-between text-xs">
                  <span className="text-amber-400">👑 куш</span>
                  <span className="text-amber-400 font-mono">{calc.kushValue.toFixed(0)} ед.</span>
                </div>
              )}
            </div>
          </div>

          {/* Распределение */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <h2 className="text-sm font-semibold text-amber-300 mb-2">💵 Распределение</h2>
            {calc.memberPayouts.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-2">Нет участников</p>
            ) : (
              <div className="space-y-1">
                {calc.memberPayouts.map(m => {
                  const fraction = calc.totalShares > 0 ? m.sharePercent / calc.totalShares : 0;
                  return (
                    <div key={m.id} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-300 flex-1 min-w-0 truncate">{m.name}</span>
                      <span className="text-gray-500 font-mono shrink-0">{m.sharePercent}%</span>
                      <span className={`font-mono shrink-0 w-20 text-right font-semibold ${m.payoutGM < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {m.payoutGM >= 0 ? '+' : ''}{m.payoutGM} ГМ
                      </span>
                      {/* Мини-барчарт */}
                      <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full ${m.payoutGM >= 0 ? 'bg-green-500/60' : 'bg-red-500/60'}`}
                          style={{ width: `${Math.min(100, Math.abs(fraction) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Справка */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
            <h3 className="text-xs font-semibold text-gray-500 mb-1.5">💡 Формула расчёта</h3>
            <div className="text-xs text-gray-600 space-y-0.5 font-mono">
              <p>казна = Маво + Бухгалтерия + Семья + Гильдм.</p>
              <p>Слуги += ⌊казна × servants%⌋</p>
              <p>Правосудие += ⌊(М+Б+С) × justice%⌋</p>
              <p>курс = базовый × (казна ÷ стандарт)</p>
              <p>добыча = Σ(цена × кол × множ) + куш</p>
              <p>с_бонусом = добыча × (1 + бонус%)</p>
              <p>после_штрафов = с_бонусом − (цена × погибшие)</p>
              <p>итог = после_штрафов × (1 − предсказатель%)</p>
              <p>каждый = ⌊итог ÷ курс × (доля% ÷ Σдолей)⌋</p>
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'houses' && (
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Левая колонка: Настройка домов */}
        <div className="lg:col-span-6 space-y-3">
          {/* Параметры казны */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <h2 className="text-sm font-semibold text-amber-300 mb-2">💰 Параметры казны</h2>
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs text-gray-400 mb-0.5">Стандарт казны (референс)</label>
                <input
                  type="number"
                  value={treasuryStandard}
                  onChange={e => setTreasuryStandard(Math.max(1, Number(e.target.value)))}
                  min="1"
                  step="1000"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
                />
                <p className="text-xs text-gray-600 mt-0.5">
                  При {treasuryStandard.toLocaleString()} монет курс = {baseCourseAtStandard} ед./ГМ
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-0.5">Базовый курс (при стандарте)</label>
                <input
                  type="number"
                  value={baseCourseAtStandard}
                  onChange={e => setBaseCourseAtStandard(Math.max(1, Number(e.target.value)))}
                  min="1"
                  step="1"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Основные дома */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-amber-300">🏛 Основные дома</h2>
              <span className="text-xs text-amber-400 font-mono">
                Казна: {calc.mainHousesTotal.toLocaleString()}
              </span>
            </div>
            <div className="space-y-3">
              {/* Дом Маво */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-purple-400">🔮 Дом Маво</label>
                  <span className="text-xs text-purple-300 font-mono">{houseMavo.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  value={houseMavo}
                  onChange={e => setHouseMavo(Math.max(0, Number(e.target.value)))}
                  min="0"
                  max="50000"
                  step="500"
                  className="w-full accent-purple-500"
                />
                <p className="text-xs text-gray-600 mt-0.5">Маги и паранормальные существа</p>
              </div>

              {/* Дом Бухгалтерии */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-cyan-400">📊 Дом Бухгалтерии</label>
                  <span className="text-xs text-cyan-300 font-mono">{houseAccounting.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  value={houseAccounting}
                  onChange={e => setHouseAccounting(Math.max(0, Number(e.target.value)))}
                  min="0"
                  max="50000"
                  step="500"
                  className="w-full accent-cyan-500"
                />
                <p className="text-xs text-gray-600 mt-0.5">Взлом реальности, цифры и подсчёт</p>
              </div>

              {/* Дом Семьи */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-red-400">🗡 Дом Семьи</label>
                  <span className="text-xs text-red-300 font-mono">{houseFamily.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  value={houseFamily}
                  onChange={e => setHouseFamily(Math.max(0, Number(e.target.value)))}
                  min="0"
                  max="50000"
                  step="500"
                  className="w-full accent-red-500"
                />
                <p className="text-xs text-gray-600 mt-0.5">Классическая мафия</p>
              </div>

              {/* Гильдмастер */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-amber-400">👑 Гильдмастер</label>
                  <span className="text-xs text-amber-300 font-mono">{houseGuildmaster.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  value={houseGuildmaster}
                  onChange={e => setHouseGuildmaster(Math.max(0, Number(e.target.value)))}
                  min="0"
                  max="50000"
                  step="500"
                  className="w-full accent-amber-500"
                />
                <p className="text-xs text-gray-600 mt-0.5">Глава всей гильдии</p>
              </div>
            </div>
          </div>

          {/* Специальные дома */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <h2 className="text-sm font-semibold text-amber-300 mb-2">⚙ Специальные дома</h2>
            <div className="space-y-3">
              {/* Дом Слуг */}
              <div className="pb-3 border-b border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-gray-400">🙇 Дом Слуг</label>
                  <span className="text-xs text-gray-300 font-mono">{houseServants.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  value={houseServants}
                  onChange={e => setHouseServants(Math.max(0, Number(e.target.value)))}
                  min="0"
                  max="50000"
                  step="500"
                  className="w-full accent-gray-500"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-600">Получает % со всех основных домов</p>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={servantsPercent}
                      onChange={e => setServantsPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                      min="0"
                      max="100"
                      step="1"
                      className="w-12 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-center text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                </div>
                {calc.servantsCut > 0 && (
                  <p className="text-xs text-green-400 mt-0.5">+{calc.servantsCut.toLocaleString()} монет</p>
                )}
              </div>

              {/* Дом Меценатства */}
              <div className="pb-3 border-b border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-pink-400">🎭 Дом Меценатства</label>
                  <span className="text-xs text-pink-300 font-mono">{housePatronage.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  value={housePatronage}
                  onChange={e => setHousePatronage(Math.max(0, Number(e.target.value)))}
                  min="0"
                  max="50000"
                  step="500"
                  className="w-full accent-pink-500"
                />
                <p className="text-xs text-gray-600 mt-0.5">Не влияет на инфляцию</p>
              </div>

              {/* Дом Правосудия */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-blue-400">⚖ Дом Правосудия</label>
                  <span className="text-xs text-blue-300 font-mono">{houseJustice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  value={houseJustice}
                  onChange={e => setHouseJustice(Math.max(0, Number(e.target.value)))}
                  min="0"
                  max="50000"
                  step="500"
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-600">Получает % (кроме слуг и гильдмастера)</p>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={justicePercent}
                      onChange={e => setJusticePercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                      min="0"
                      max="100"
                      step="1"
                      className="w-12 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-center text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                </div>
                {calc.justiceCut > 0 && (
                  <p className="text-xs text-green-400 mt-0.5">+{calc.justiceCut.toLocaleString()} монет</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка: Статистика */}
        <div className="lg:col-span-6 space-y-3">
          {/* Статистика домов */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <h2 className="text-sm font-semibold text-amber-300 mb-2">📊 Статистика домов</h2>
            <div className="space-y-2">
              {/* Визуальный барчарт основных домов */}
              <div className="flex h-6 rounded overflow-hidden border border-gray-600">
                {calc.houseStats.mavo.percent > 0 && (
                  <div
                    className="bg-purple-600 flex items-center justify-center text-xs text-white font-semibold"
                    style={{ width: `${calc.houseStats.mavo.percent}%` }}
                    title={`Дом Маво: ${calc.houseStats.mavo.amount} (${calc.houseStats.mavo.percent.toFixed(1)}%)`}
                  >
                    {calc.houseStats.mavo.percent > 15 && `${calc.houseStats.mavo.percent.toFixed(0)}%`}
                  </div>
                )}
                {calc.houseStats.accounting.percent > 0 && (
                  <div
                    className="bg-cyan-600 flex items-center justify-center text-xs text-white font-semibold"
                    style={{ width: `${calc.houseStats.accounting.percent}%` }}
                    title={`Дом Бухгалтерии: ${calc.houseStats.accounting.amount} (${calc.houseStats.accounting.percent.toFixed(1)}%)`}
                  >
                    {calc.houseStats.accounting.percent > 15 && `${calc.houseStats.accounting.percent.toFixed(0)}%`}
                  </div>
                )}
                {calc.houseStats.family.percent > 0 && (
                  <div
                    className="bg-red-600 flex items-center justify-center text-xs text-white font-semibold"
                    style={{ width: `${calc.houseStats.family.percent}%` }}
                    title={`Дом Семьи: ${calc.houseStats.family.amount} (${calc.houseStats.family.percent.toFixed(1)}%)`}
                  >
                    {calc.houseStats.family.percent > 15 && `${calc.houseStats.family.percent.toFixed(0)}%`}
                  </div>
                )}
                {calc.houseStats.guildmaster.percent > 0 && (
                  <div
                    className="bg-amber-600 flex items-center justify-center text-xs text-white font-semibold"
                    style={{ width: `${calc.houseStats.guildmaster.percent}%` }}
                    title={`Гильдмастер: ${calc.houseStats.guildmaster.amount} (${calc.houseStats.guildmaster.percent.toFixed(1)}%)`}
                  >
                    {calc.houseStats.guildmaster.percent > 15 && `${calc.houseStats.guildmaster.percent.toFixed(0)}%`}
                  </div>
                )}
              </div>

              {/* Детальная статистика */}
              <div className="space-y-1 text-xs">
                <div className="text-gray-500 text-xs font-semibold mb-1">Основные дома (влияют на курс):</div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-400">🔮 Дом Маво</span>
                  <span className="font-mono text-purple-300">
                    {calc.houseStats.mavo.amount.toLocaleString()} ({calc.houseStats.mavo.percent.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400">📊 Дом Бухгалтерии</span>
                  <span className="font-mono text-cyan-300">
                    {calc.houseStats.accounting.amount.toLocaleString()} ({calc.houseStats.accounting.percent.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-400">🗡 Дом Семьи</span>
                  <span className="font-mono text-red-300">
                    {calc.houseStats.family.amount.toLocaleString()} ({calc.houseStats.family.percent.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-400">👑 Гильдмастер</span>
                  <span className="font-mono text-amber-300">
                    {calc.houseStats.guildmaster.amount.toLocaleString()} ({calc.houseStats.guildmaster.percent.toFixed(1)}%)
                  </span>
                </div>
                
                <div className="pt-1 mt-1 border-t border-gray-700">
                  <span className="text-gray-400 font-semibold">Общая казна:</span>
                  <span className="font-mono text-amber-400 font-semibold ml-2">
                    {calc.totalTreasury.toLocaleString()}
                  </span>
                </div>

                <div className="text-gray-500 text-xs font-semibold mt-2 mb-1">Специальные дома:</div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">🙇 Дом Слуг</span>
                  <span className="font-mono text-gray-300">
                    {calc.houseStats.servants.amount.toLocaleString()} 
                    {calc.servantsCut > 0 && <span className="text-green-400 ml-1">+{calc.servantsCut}</span>}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-pink-400">🎭 Дом Меценатства</span>
                  <span className="font-mono text-pink-300">
                    {calc.houseStats.patronage.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-400">⚖ Дом Правосудия</span>
                  <span className="font-mono text-blue-300">
                    {calc.houseStats.justice.amount.toLocaleString()}
                    {calc.justiceCut > 0 && <span className="text-green-400 ml-1">+{calc.justiceCut}</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Справка */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
            <h3 className="text-xs font-semibold text-gray-500 mb-1.5">💡 Формула расчёта</h3>
            <div className="text-xs text-gray-600 space-y-0.5 font-mono">
              <p>казна = Маво + Бухгалтерия + Семья + Гильдм.</p>
              <p>Слуги += ⌊казна × servants%⌋</p>
              <p>Правосудие += ⌊(М+Б+С) × justice%⌋</p>
              <p>курс = базовый × (казна ÷ стандарт)</p>
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'stats' && (
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Левая колонка: Репутация гильдии и домов */}
        <div className="lg:col-span-6 space-y-3">
          {/* Общая репутация гильдии */}
          <div className="bg-gray-800 rounded-lg p-4 border border-amber-700/50">
            <h2 className="text-lg font-semibold text-amber-300 mb-3">🏛 Репутация Гильдии</h2>
            <div className="flex items-center justify-center mb-3">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(calc.guildReputation / 100) * 351.86} 351.86`}
                    className={
                      calc.guildReputation >= 75 ? 'text-green-500' :
                      calc.guildReputation >= 50 ? 'text-yellow-500' :
                      calc.guildReputation >= 25 ? 'text-orange-500' :
                      'text-red-500'
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-amber-400">{calc.guildReputation}</span>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400">
              {calc.guildReputation >= 75 ? 'Превосходная репутация' :
               calc.guildReputation >= 50 ? 'Хорошая репутация' :
               calc.guildReputation >= 25 ? 'Средняя репутация' :
               'Плохая репутация'}
            </p>
          </div>

          {/* Репутация и сила основных домов */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h2 className="text-sm font-semibold text-amber-300 mb-3">🏰 Дома: Репутация и Сила</h2>
            <div className="space-y-3">
              {/* Дом Маво */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-purple-400">🔮 Дом Маво</span>
                  <div className="flex gap-2 text-xs font-mono">
                    <span className="text-purple-300" title="Репутация">⭐{calc.houseReputation.mavo}</span>
                    <span className="text-purple-300" title="Сила">💪{calc.housePower.mavo}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Репутация">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${calc.houseReputation.mavo}%` }}
                    />
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Сила">
                    <div
                      className="bg-purple-400 h-2 rounded-full transition-all"
                      style={{ width: `${calc.housePower.mavo}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Дом Бухгалтерии */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-cyan-400">📊 Дом Бухгалтерии</span>
                  <div className="flex gap-2 text-xs font-mono">
                    <span className="text-cyan-300" title="Репутация">⭐{calc.houseReputation.accounting}</span>
                    <span className="text-cyan-300" title="Сила">💪{calc.housePower.accounting}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Репутация">
                    <div
                      className="bg-cyan-500 h-2 rounded-full transition-all"
                      style={{ width: `${calc.houseReputation.accounting}%` }}
                    />
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Сила">
                    <div
                      className="bg-cyan-400 h-2 rounded-full transition-all"
                      style={{ width: `${calc.housePower.accounting}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Дом Семьи */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-red-400">🗡 Дом Семьи</span>
                  <div className="flex gap-2 text-xs font-mono">
                    <span className="text-red-300" title="Репутация">⭐{calc.houseReputation.family}</span>
                    <span className="text-red-300" title="Сила">💪{calc.housePower.family}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Репутация">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${calc.houseReputation.family}%` }}
                    />
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Сила">
                    <div
                      className="bg-red-400 h-2 rounded-full transition-all"
                      style={{ width: `${calc.housePower.family}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Гильдмастер */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-amber-400">👑 Гильдмастер</span>
                  <div className="flex gap-2 text-xs font-mono">
                    <span className="text-amber-300" title="Репутация">⭐{calc.houseReputation.guildmaster}</span>
                    <span className="text-amber-300" title="Сила">💪{calc.housePower.guildmaster}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Репутация">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${calc.houseReputation.guildmaster}%` }}
                    />
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Сила">
                    <div
                      className="bg-amber-400 h-2 rounded-full transition-all"
                      style={{ width: `${calc.housePower.guildmaster}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Репутация и сила специальных домов */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h2 className="text-sm font-semibold text-amber-300 mb-3">⚙ Специальные Дома</h2>
            <div className="space-y-3">
              {/* Дом Слуг */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">🙇 Дом Слуг</span>
                  <div className="flex gap-2 text-xs font-mono">
                    <span className="text-gray-300" title="Репутация">⭐{calc.houseReputation.servants}</span>
                    <span className="text-gray-300" title="Сила">💪{calc.housePower.servants}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Репутация">
                    <div
                      className="bg-gray-500 h-2 rounded-full transition-all"
                      style={{ width: `${calc.houseReputation.servants}%` }}
                    />
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Сила">
                    <div
                      className="bg-gray-400 h-2 rounded-full transition-all"
                      style={{ width: `${calc.housePower.servants}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Дом Меценатства */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-pink-400">🎭 Дом Меценатства</span>
                  <div className="flex gap-2 text-xs font-mono">
                    <span className="text-pink-300" title="Репутация">⭐{calc.houseReputation.patronage}</span>
                    <span className="text-pink-300" title="Сила">💪{calc.housePower.patronage}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Репутация">
                    <div
                      className="bg-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${calc.houseReputation.patronage}%` }}
                    />
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Сила">
                    <div
                      className="bg-pink-400 h-2 rounded-full transition-all"
                      style={{ width: `${calc.housePower.patronage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Дом Правосудия */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-blue-400">⚖ Дом Правосудия</span>
                  <div className="flex gap-2 text-xs font-mono">
                    <span className="text-blue-300" title="Репутация">⭐{calc.houseReputation.justice}</span>
                    <span className="text-blue-300" title="Сила">💪{calc.housePower.justice}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Репутация">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${calc.houseReputation.justice}%` }}
                    />
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2" title="Сила">
                    <div
                      className="bg-blue-400 h-2 rounded-full transition-all"
                      style={{ width: `${calc.housePower.justice}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Редактирование репутации и силы домов */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h2 className="text-sm font-semibold text-amber-300 mb-3">✏️ Редактировать Дома</h2>
            <div className="space-y-4">
              {/* Дом Маво */}
              <div className="border-b border-gray-700 pb-3">
                <div className="text-xs text-purple-400 mb-2">🔮 Дом Маво</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Репутация</label>
                    <input
                      type="number"
                      value={houseReputationManual.mavo}
                      onChange={e => setHouseReputationManual(prev => ({ ...prev, mavo: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Сила</label>
                    <input
                      type="number"
                      value={housePowerManual.mavo}
                      onChange={e => setHousePowerManual(prev => ({ ...prev, mavo: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Дом Бухгалтерии */}
              <div className="border-b border-gray-700 pb-3">
                <div className="text-xs text-cyan-400 mb-2">📊 Дом Бухгалтерии</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Репутация</label>
                    <input
                      type="number"
                      value={houseReputationManual.accounting}
                      onChange={e => setHouseReputationManual(prev => ({ ...prev, accounting: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Сила</label>
                    <input
                      type="number"
                      value={housePowerManual.accounting}
                      onChange={e => setHousePowerManual(prev => ({ ...prev, accounting: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Дом Семьи */}
              <div className="border-b border-gray-700 pb-3">
                <div className="text-xs text-red-400 mb-2">🗡 Дом Семьи</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Репутация</label>
                    <input
                      type="number"
                      value={houseReputationManual.family}
                      onChange={e => setHouseReputationManual(prev => ({ ...prev, family: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Сила</label>
                    <input
                      type="number"
                      value={housePowerManual.family}
                      onChange={e => setHousePowerManual(prev => ({ ...prev, family: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Гильдмастер */}
              <div className="border-b border-gray-700 pb-3">
                <div className="text-xs text-amber-400 mb-2">👑 Гильдмастер</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Репутация</label>
                    <input
                      type="number"
                      value={houseReputationManual.guildmaster}
                      onChange={e => setHouseReputationManual(prev => ({ ...prev, guildmaster: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Сила</label>
                    <input
                      type="number"
                      value={housePowerManual.guildmaster}
                      onChange={e => setHousePowerManual(prev => ({ ...prev, guildmaster: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Дом Слуг */}
              <div className="border-b border-gray-700 pb-3">
                <div className="text-xs text-gray-400 mb-2">🙇 Дом Слуг</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Репутация</label>
                    <input
                      type="number"
                      value={houseReputationManual.servants}
                      onChange={e => setHouseReputationManual(prev => ({ ...prev, servants: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Сила</label>
                    <input
                      type="number"
                      value={housePowerManual.servants}
                      onChange={e => setHousePowerManual(prev => ({ ...prev, servants: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Дом Меценатства */}
              <div className="border-b border-gray-700 pb-3">
                <div className="text-xs text-pink-400 mb-2">🎭 Дом Меценатства</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Репутация</label>
                    <input
                      type="number"
                      value={houseReputationManual.patronage}
                      onChange={e => setHouseReputationManual(prev => ({ ...prev, patronage: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Сила</label>
                    <input
                      type="number"
                      value={housePowerManual.patronage}
                      onChange={e => setHousePowerManual(prev => ({ ...prev, patronage: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* Дом Правосудия */}
              <div>
                <div className="text-xs text-blue-400 mb-2">⚖ Дом Правосудия</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Репутация</label>
                    <input
                      type="number"
                      value={houseReputationManual.justice}
                      onChange={e => setHouseReputationManual(prev => ({ ...prev, justice: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Сила</label>
                    <input
                      type="number"
                      value={housePowerManual.justice}
                      onChange={e => setHousePowerManual(prev => ({ ...prev, justice: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      min="0" max="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка: Репутация наёмников */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-amber-300">🗡 Все Наёмники ({allMercenaries.length})</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const name = prompt('Введите имя нового наёмника:');
                    if (name && name.trim()) {
                      const newMerc: PartyMember = {
                        id: Date.now().toString(),
                        name: name.trim(),
                        sharePercent: 0,
                        reputation: 50,
                      };
                      setAllMercenaries(prev => [...prev, newMerc]);
                    }
                  }}
                  className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors"
                >
                  + Добавить
                </button>
                <button
                  onClick={() => {
                    if (confirm('⚠️ Вы уверены? Это удалит ВСЕХ наёмников и ВСЕ сохранённые забеги без возможности восстановления!')) {
                      setAllMercenaries([]);
                      setSavedRuns([]);
                      localStorage.removeItem('allMercenaries');
                      localStorage.removeItem('savedRuns');
                    }
                  }}
                  className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                >
                  🗑 Сброс
                </button>
              </div>
            </div>
            {allMercenaries.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">Нет наёмников. Завершите забег, чтобы добавить участников.</p>
            ) : (
              <div className="space-y-2">
                {allMercenaries.map(m => (
                  <div key={m.id} className="bg-gray-700/50 rounded p-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newName = prompt('Введите новое имя:', m.name);
                        if (newName && newName.trim()) {
                          setAllMercenaries(prev => prev.map(merc => 
                            merc.id === m.id ? { ...merc, name: newName.trim() } : merc
                          ));
                        }
                      }}
                      className="text-sm text-gray-200 flex-1 text-left hover:text-amber-400 transition-colors"
                      title="Нажми чтобы переименовать"
                    >
                      {m.name}
                    </button>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={m.reputation}
                        onChange={e => {
                          const newValue = Math.max(0, Math.min(100, Number(e.target.value)));
                          setAllMercenaries(prev => prev.map(merc => 
                            merc.id === m.id ? { ...merc, reputation: newValue } : merc
                          ));
                        }}
                        min="0" max="100"
                        className={`w-14 bg-gray-700 border rounded px-2 py-1 text-center text-sm font-mono focus:outline-none ${
                          m.reputation >= 75 ? 'border-green-600 text-green-400' :
                          m.reputation >= 50 ? 'border-yellow-600 text-yellow-400' :
                          m.reputation >= 25 ? 'border-orange-600 text-orange-400' :
                          'border-red-600 text-red-400'
                        }`}
                      />
                    </div>
                    <div className="w-20 bg-gray-600 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          m.reputation >= 75 ? 'bg-green-500' :
                          m.reputation >= 50 ? 'bg-yellow-500' :
                          m.reputation >= 25 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${m.reputation}%` }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Удалить наёмника "${m.name}"?`)) {
                          setAllMercenaries(prev => prev.filter(merc => merc.id !== m.id));
                        }
                      }}
                      className="text-red-500 hover:text-red-400 text-lg px-1 transition-colors"
                      title="Удалить наёмника"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Справка по репутации */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
            <h3 className="text-xs font-semibold text-gray-500 mb-1.5">💡 Как работает статистика</h3>
            <div className="text-xs text-gray-600 space-y-0.5">
              <p>• <strong className="text-gray-400">Дома</strong>: репутация и сила устанавливаются вручную</p>
              <p>• <strong className="text-gray-400">Гильдия</strong>: средняя репутация всех домов</p>
              <p>• <strong className="text-gray-400">Наёмники</strong>: добавляются при завершении забега</p>
              <p>• <strong className="text-gray-400">Репутация</strong>: меняется вручную (0-100)</p>
              <p className="mt-1 text-gray-500">Кнопка "Завершить забег" сохраняет результаты в JSON и сбрасывает участников</p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Модальное окно загрузки */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowSaveModal(false)}>
          <div className="bg-gray-800 rounded-lg border border-gray-600 max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3 border-b border-gray-700">
              <h2 className="text-sm font-semibold text-amber-300">📂 Сохранённые забеги</h2>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {savedRuns.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">Нет сохранённых забегов</p>
              ) : (
                <div className="space-y-2">
                  {savedRuns.map(run => (
                    <div key={run.id} className="bg-gray-700/50 rounded p-2 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-200 truncate">{run.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(run.timestamp).toLocaleString('ru-RU')}
                        </div>
                      </div>
                      <button
                        onClick={() => loadRun(run.id)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded transition-colors shrink-0"
                      >
                        Загрузить
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить забег "${run.name}"?`)) {
                            deleteRun(run.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 text-sm shrink-0 px-1"
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-700 flex justify-between items-center">
              <span className="text-xs text-gray-500">Всего: {savedRuns.length}</span>
              <button
                onClick={() => setShowSaveModal(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1.5 rounded transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Подпись Эликсы */}
      <footer className="max-w-7xl mx-auto mt-6 text-center">
        <p className="text-xs text-gray-600 italic">
          🖤 Всё посчитано, всё на месте. Гильдмастер доволен. — <span className="text-pink-500/70">Эликса</span>
        </p>
      </footer>
    </div>
  );
}

export default App;
