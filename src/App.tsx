import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

// === ТИПЫ ===
type ItemCategory = 'обычное' | 'дорогое' | 'редкое' | 'люди' | 'артефакты';

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
}

interface SavedRun {
  id: string;
  name: string;
  timestamp: number;
  data: RunData;
}

interface RunData {
  runName: string;
  cleanRunBonus: number;
  predictorPercent: number;
  mercenaryCost: number;
  lostMercenaries: number;
  treasuryAmount: number;
  treasuryStandard: number;
  baseCourseAtStandard: number;
  multipliers: Record<ItemCategory, number>;
  kushName: string;
  kushPrice: number;
  hasKush: boolean;
  members: PartyMember[];
  items: Item[];
}

// === КОНСТАНТЫ ===
const DEFAULT_MULTIPLIERS: Record<ItemCategory, number> = {
  'обычное': 1.0,
  'дорогое': 2.5,
  'редкое': 5.0,
  'люди': 8.0,
  'артефакты': 15.0,
};

const CATEGORY_ICONS: Record<ItemCategory, string> = {
  'обычное': '🪙',
  'дорогое': '💰',
  'редкое': '📜',
  'люди': '👤',
  'артефакты': '💎',
};

const CATEGORY_COLORS: Record<ItemCategory, string> = {
  'обычное': 'text-gray-300',
  'дорогое': 'text-yellow-400',
  'редкое': 'text-purple-400',
  'люди': 'text-red-400',
  'артефакты': 'text-cyan-400',
};

const CATEGORY_BG: Record<ItemCategory, string> = {
  'обычное': 'bg-gray-700/50',
  'дорогое': 'bg-yellow-900/30',
  'редкое': 'bg-purple-900/30',
  'люди': 'bg-red-900/30',
  'артефакты': 'bg-cyan-900/30',
};

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
  const [treasuryAmount, setTreasuryAmount] = useState(10000); // текущее кол-во монет в обращении
  const [treasuryStandard, setTreasuryStandard] = useState(10000); // стандарт (при котором курс = базовому)
  const [baseCourseAtStandard, setBaseCourseAtStandard] = useState(10); // курс при стандарте (ед. за 1 ГМ)

  // --- Множители ---
  const [multipliers, setMultipliers] = useState<Record<ItemCategory, number>>(DEFAULT_MULTIPLIERS);

  // --- Куш ---
  const [kushName, setKushName] = useState('Куш');
  const [kushPrice, setKushPrice] = useState(0);
  const [hasKush, setHasKush] = useState(false);

  // --- Участники ---
  const [members, setMembers] = useState<PartyMember[]>([
    { id: '1', name: 'Первый', sharePercent: 20 },
    { id: '2', name: 'Второй', sharePercent: 20 },
    { id: '3', name: 'Третий', sharePercent: 20 },
    { id: '4', name: 'Четвёртый', sharePercent: 20 },
    { id: '5', name: 'Пятый', sharePercent: 20 },
  ]);

  // --- Добыча ---
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: 'Серебряные украшения', category: 'обычное', basePrice: 5, quantity: 3, stolen: true },
    { id: '2', name: 'Золотой перстень', category: 'дорогое', basePrice: 12, quantity: 1, stolen: true },
    { id: '3', name: 'Зашифрованный свиток', category: 'редкое', basePrice: 20, quantity: 1, stolen: true },
  ]);

  // --- Сохранение/загрузка ---
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка сохранённых забегов из localStorage при старте
  useEffect(() => {
    const saved = localStorage.getItem('savedRuns');
    if (saved) {
      try {
        setSavedRuns(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved runs:', e);
      }
    }
  }, []);

  // Получить текущие данные забега
  const getCurrentRunData = useCallback((): RunData => {
    return {
      runName,
      cleanRunBonus,
      predictorPercent,
      mercenaryCost,
      lostMercenaries,
      treasuryAmount,
      treasuryStandard,
      baseCourseAtStandard,
      multipliers,
      kushName,
      kushPrice,
      hasKush,
      members,
      items,
    };
  }, [runName, cleanRunBonus, predictorPercent, mercenaryCost, lostMercenaries, treasuryAmount, treasuryStandard, baseCourseAtStandard, multipliers, kushName, kushPrice, hasKush, members, items]);

  // Загрузить данные забега
  const loadRunData = useCallback((data: RunData) => {
    setRunName(data.runName);
    setCleanRunBonus(data.cleanRunBonus);
    setPredictorPercent(data.predictorPercent);
    setMercenaryCost(data.mercenaryCost);
    setLostMercenaries(data.lostMercenaries);
    setTreasuryAmount(data.treasuryAmount);
    setTreasuryStandard(data.treasuryStandard);
    setBaseCourseAtStandard(data.baseCourseAtStandard);
    setMultipliers(data.multipliers);
    setKushName(data.kushName);
    setKushPrice(data.kushPrice);
    setHasKush(data.hasKush);
    setMembers(data.members);
    setItems(data.items);
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
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guild-runs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          alert(`Импортировано ${data.runs.length} забегов`);
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
    // 0. Текущий курс гильдейской монеты
    // Чем больше монет в обращении — тем выше курс (монета дешевле)
    // Чем меньше монет — тем ниже курс (монета дороже)
    const currentRate = Math.max(1, baseCourseAtStandard * (treasuryAmount / treasuryStandard));

    // 1. Сумма добычи
    let lootSum = 0;
    const perCategory: Record<ItemCategory, { count: number; value: number }> = {
      'обычное': { count: 0, value: 0 },
      'дорогое': { count: 0, value: 0 },
      'редкое': { count: 0, value: 0 },
      'люди': { count: 0, value: 0 },
      'артефакты': { count: 0, value: 0 },
    };

    items.forEach(item => {
      if (item.stolen) {
        const val = item.basePrice * item.quantity * multipliers[item.category];
        lootSum += val;
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
      perCategory,
      memberPayouts,
      totalShares,
      isInDebt: totalGM < 0,
    };
  }, [items, multipliers, hasKush, kushPrice, cleanRunBonus, mercenaryCost, lostMercenaries, predictorPercent, treasuryAmount, treasuryStandard, baseCourseAtStandard, members]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-3 md:p-5">
      {/* Заголовок */}
      <header className="mb-4 text-center">
        <h1 className="text-xl md:text-2xl font-bold text-amber-400">
          ⚔ Калькулятор Гильдейской Монеты ⚔
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">Экономика воров и наёмников</p>
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
          onClick={exportToFile}
          disabled={savedRuns.length === 0}
          className="bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1"
        >
          📤 Экспорт
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
                <label className="block text-xs text-gray-400 mb-0.5">
                  Монет в гильдии: <span className="text-amber-400 font-semibold">{treasuryAmount.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  value={treasuryAmount}
                  onChange={e => setTreasuryAmount(Math.max(0, Number(e.target.value)))}
                  min="0"
                  max="50000"
                  step="500"
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                  <span>0</span>
                  <span>50 000</span>
                </div>
              </div>
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
                onClick={() => setMultipliers(DEFAULT_MULTIPLIERS)}
                className="text-xs text-gray-500 hover:text-gray-300 border border-gray-600 rounded px-1.5 py-0.5 transition-colors"
              >
                ↺
              </button>
            </div>
            <div className="space-y-1.5">
              {(Object.keys(multipliers) as ItemCategory[]).map(cat => (
                <div key={cat} className="flex justify-between items-center gap-1">
                  <span className={`text-xs ${CATEGORY_COLORS[cat]}`}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-gray-600 text-xs">×</span>
                    <input
                      type="number"
                      value={multipliers[cat]}
                      onChange={e => {
                        const v = Math.max(0, Number(e.target.value));
                        setMultipliers(prev => ({ ...prev, [cat]: v }));
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
                      const val = item.basePrice * item.quantity * multipliers[item.category];
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
                              className={`bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-amber-500 ${CATEGORY_COLORS[item.category]}`}
                            >
                              {(Object.keys(multipliers) as ItemCategory[]).map(c => (
                                <option key={c} value={c}>{c}</option>
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
                          <td className={`py-1 px-1 text-center font-mono ${CATEGORY_COLORS[item.category]}`}>
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
              {treasuryAmount < treasuryStandard && (
                <div className="text-xs text-green-400/70 text-center mb-1">
                  ↑ Монета дороже стандарта (дефицит)
                </div>
              )}
              {treasuryAmount > treasuryStandard && (
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
            </div>
          </div>

          {/* Разбивка по категориям */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <h2 className="text-sm font-semibold text-amber-300 mb-2">📦 По категориям</h2>
            <div className="space-y-1">
              {(Object.entries(calc.perCategory) as [ItemCategory, { count: number; value: number }][]).map(([cat, data]) => (
                data.count > 0 && (
                  <div key={cat} className="flex justify-between text-xs">
                    <span className={CATEGORY_COLORS[cat]}>
                      {CATEGORY_ICONS[cat]} {cat}
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
    </div>
  );
}

export default App;
