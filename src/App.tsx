import { useState, useMemo, useCallback } from 'react';

// Типы предметов
type ItemCategory = 'обычное' | 'дорогое' | 'редкое' | 'люди' | 'артефакты';

interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  basePrice: number; // базовая цена в единицах
  quantity: number;
  stolen: boolean;
}

interface RunResult {
  totalBaseValue: number;
  guildCoinRate: number;
  totalInGuildCoins: number;
  perCategory: Record<ItemCategory, { count: number; value: number }>;
}

// Дефолтные множители для категорий
const DEFAULT_MULTIPLIERS: Record<ItemCategory, number> = {
  'обычное': 1.0,
  'дорогое': 2.5,
  'редкое': 5.0,
  'люди': 8.0,
  'артефакты': 15.0,
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

function App() {
  // Множители категорий (редактируемые)
  const [multipliers, setMultipliers] = useState<Record<ItemCategory, number>>(DEFAULT_MULTIPLIERS);
  // Базовый курс: сколько базовых единиц = 1 гильдейская монета
  const [baseRate, setBaseRate] = useState<number>(10);
  // Бонус за "чистоту" забега (0-100%)
  const [cleanRunBonus, setCleanRunBonus] = useState<number>(0);
  // Штраф за потери во время забега (0-100%)
  const [lossPenalty, setLossPenalty] = useState<number>(0);
  // Название текущего забега
  const [runName, setRunName] = useState<string>('Забег #1');

  const [items, setItems] = useState<Item[]>([
    { id: '1', name: 'Серебряные украшения', category: 'обычное', basePrice: 5, quantity: 3, stolen: true },
    { id: '2', name: 'Золотой перстень', category: 'дорогое', basePrice: 12, quantity: 1, stolen: true },
    { id: '3', name: 'Зашифрованный свиток', category: 'редкое', basePrice: 20, quantity: 1, stolen: true },
  ]);

  // Добавление предмета
  const addItem = useCallback(() => {
    const newItem: Item = {
      id: Date.now().toString(),
      name: 'Новый предмет',
      category: 'обычное',
      basePrice: 1,
      quantity: 1,
      stolen: true,
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  // Удаление предмета
  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // Обновление предмета
  const updateItem = useCallback((id: string, field: keyof Item, value: string | number | boolean) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

  // Расчёт экономики
  const calculation = useMemo((): RunResult => {
    let totalBaseValue = 0;
    const perCategory: Record<ItemCategory, { count: number; value: number }> = {
      'обычное': { count: 0, value: 0 },
      'дорогое': { count: 0, value: 0 },
      'редкое': { count: 0, value: 0 },
      'люди': { count: 0, value: 0 },
      'артефакты': { count: 0, value: 0 },
    };

    items.forEach(item => {
      if (item.stolen) {
        const value = item.basePrice * item.quantity * multipliers[item.category];
        totalBaseValue += value;
        perCategory[item.category].count += item.quantity;
        perCategory[item.category].value += value;
      }
    });

    // Расчёт курса с модификаторами
    const bonusMultiplier = 1 + (cleanRunBonus / 100);
    const penaltyMultiplier = 1 - (lossPenalty / 100);
    const adjustedValue = totalBaseValue * bonusMultiplier * penaltyMultiplier;

    const guildCoinRate = baseRate;
    const totalInGuildCoins = adjustedValue / guildCoinRate;

    return {
      totalBaseValue: adjustedValue,
      guildCoinRate,
      totalInGuildCoins,
      perCategory,
    };
  }, [items, baseRate, cleanRunBonus, lossPenalty, multipliers]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6">
      {/* Заголовок */}
      <header className="mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-amber-400">
          ⚔ Калькулятор Гильдейской Монеты ⚔
        </h1>
        <p className="text-gray-400 text-sm mt-1">Экономика воров и наёмников</p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Левая колонка — Параметры курса */}
        <div className="lg:col-span-1 space-y-4">
          {/* Параметры забега */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h2 className="text-lg font-semibold text-amber-300 mb-3">📋 Параметры забега</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Название забега</label>
                <input
                  type="text"
                  value={runName}
                  onChange={(e) => setRunName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Базовый курс (ед. за 1 ГМ)
                </label>
                <input
                  type="number"
                  value={baseRate}
                  onChange={(e) => setBaseRate(Math.max(0.1, Number(e.target.value)))}
                  min="0.1"
                  step="0.5"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  1 гильдейская монета = {baseRate} базовых единиц
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Бонус за чистый забег: {cleanRunBonus}%
                </label>
                <input
                  type="range"
                  value={cleanRunBonus}
                  onChange={(e) => setCleanRunBonus(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="5"
                  className="w-full accent-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Штраф за потери: {lossPenalty}%
                </label>
                <input
                  type="range"
                  value={lossPenalty}
                  onChange={(e) => setLossPenalty(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="5"
                  className="w-full accent-red-500"
                />
              </div>
            </div>
          </div>

          {/* Множители категорий */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-amber-300">📊 Множители категорий</h2>
              <button
                onClick={() => setMultipliers(DEFAULT_MULTIPLIERS)}
                className="text-xs text-gray-500 hover:text-gray-300 border border-gray-600 rounded px-2 py-0.5 transition-colors"
                title="Сбросить к значениям по умолчанию"
              >
                ↺ сброс
              </button>
            </div>
            <div className="space-y-2 text-sm">
              {(Object.keys(multipliers) as ItemCategory[]).map((cat) => (
                <div key={cat} className="flex justify-between items-center gap-2">
                  <span className={CATEGORY_COLORS[cat]}>
                    {cat === 'люди' ? '👤' : cat === 'артефакты' ? '💎' : cat === 'редкое' ? '📜' : cat === 'дорогое' ? '💰' : '🪙'} {cat}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-xs">×</span>
                    <input
                      type="number"
                      value={multipliers[cat]}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setMultipliers(prev => ({ ...prev, [cat]: val }));
                      }}
                      min="0"
                      step="0.5"
                      className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center text-sm font-mono text-gray-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Итоги забега */}
          <div className="bg-gray-800 rounded-lg p-4 border border-amber-700/50">
            <h2 className="text-lg font-semibold text-amber-300 mb-3">💰 Итоги: {runName}</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Общая стоимость:</span>
                <span className="font-mono text-green-400">{calculation.totalBaseValue.toFixed(1)} ед.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Курс ГМ:</span>
                <span className="font-mono text-amber-400">{calculation.guildCoinRate} ед./ГМ</span>
              </div>
              <div className="border-t border-gray-700 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-200 font-semibold">Итого в ГМ:</span>
                  <span className="font-mono text-xl text-amber-400 font-bold">
                    {calculation.totalInGuildCoins.toFixed(2)} ГМ
                  </span>
                </div>
              </div>
            </div>

            {/* Разбивка по категориям */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <h3 className="text-sm text-gray-400 mb-2">Разбивка по категориям:</h3>
              {(Object.entries(calculation.perCategory) as [ItemCategory, { count: number; value: number }][]).map(([cat, data]) => (
                data.count > 0 && (
                  <div key={cat} className="flex justify-between text-sm py-0.5">
                    <span className={CATEGORY_COLORS[cat]}>{cat}</span>
                    <span className="text-gray-300 font-mono">
                      {data.count} шт. → {data.value.toFixed(1)} ед.
                    </span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Правая колонка — Таблица добычи */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-amber-300">🎒 Добыча с забега</h2>
              <button
                onClick={addItem}
                className="bg-amber-600 hover:bg-amber-500 text-white text-sm px-3 py-1.5 rounded transition-colors"
              >
                + Добавить предмет
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Нет предметов. Добавьте добычу с забега.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2 px-2">Предмет</th>
                      <th className="text-left py-2 px-2">Категория</th>
                      <th className="text-center py-2 px-2">Баз. цена</th>
                      <th className="text-center py-2 px-2">Кол-во</th>
                      <th className="text-center py-2 px-2">Итого</th>
                      <th className="text-center py-2 px-2">✓</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const totalValue = item.basePrice * item.quantity * multipliers[item.category];
                      return (
                        <tr key={item.id} className={`border-b border-gray-700/50 ${!item.stolen ? 'opacity-40' : ''}`}>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              className="bg-transparent border-b border-transparent hover:border-gray-600 focus:border-amber-500 focus:outline-none w-full text-sm py-0.5"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={item.category}
                              onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                              className={`bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500 ${CATEGORY_COLORS[item.category]}`}
                            >
                              <option value="обычное">обычное</option>
                              <option value="дорогое">дорогое</option>
                              <option value="редкое">редкое</option>
                              <option value="люди">люди</option>
                              <option value="артефакты">артефакты</option>
                            </select>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              value={item.basePrice}
                              onChange={(e) => updateItem(item.id, 'basePrice', Math.max(0, Number(e.target.value)))}
                              min="0"
                              step="1"
                              className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center text-sm focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', Math.max(0, Number(e.target.value)))}
                              min="0"
                              step="1"
                              className="w-14 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center text-sm focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className={`py-2 px-2 text-center font-mono ${CATEGORY_COLORS[item.category]}`}>
                            {item.stolen ? totalValue.toFixed(1) : '—'}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.stolen}
                              onChange={(e) => updateItem(item.id, 'stolen', e.target.checked)}
                              className="accent-amber-500 w-4 h-4"
                              title="Учитывать в расчёте"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-400 hover:text-red-300 text-lg leading-none"
                              title="Удалить"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Быстрый подсчёт */}
            {items.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className={`${CATEGORY_BG['обычное']} rounded px-3 py-1.5`}>
                    <span className="text-gray-400">Предметов: </span>
                    <span className="font-mono text-gray-200">{items.filter(i => i.stolen).length}</span>
                  </div>
                  <div className={`${CATEGORY_BG['дорогое']} rounded px-3 py-1.5`}>
                    <span className="text-gray-400">Общая база: </span>
                    <span className="font-mono text-yellow-400">{items.filter(i => i.stolen).reduce((s, i) => s + i.basePrice * i.quantity, 0)}</span>
                  </div>
                  <div className={`${CATEGORY_BG['редкое']} rounded px-3 py-1.5`}>
                    <span className="text-gray-400">С множителями: </span>
                    <span className="font-mono text-purple-400">{calculation.totalBaseValue.toFixed(1)}</span>
                  </div>
                  <div className={`${CATEGORY_BG['артефакты']} rounded px-3 py-1.5`}>
                    <span className="text-gray-400">= </span>
                    <span className="font-mono text-cyan-400 font-bold">{calculation.totalInGuildCoins.toFixed(2)} ГМ</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Справка */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">💡 Как работает расчёт</h3>
            <div className="text-xs text-gray-500 space-y-1">
              <p>• <strong className="text-gray-400">Базовая стоимость</strong> × <strong className="text-gray-400">Количество</strong> × <strong className="text-gray-400">Множитель категории</strong> = ценность предмета</p>
              <p>• Сумма всех предметов × (1 + бонус%) × (1 − штраф%) = итоговая ценность</p>
              <p>• Итоговая ценность ÷ базовый курс = <strong className="text-amber-400">количество гильдейских монет</strong></p>
              <p className="mt-2 text-gray-600">Меняйте любой параметр — всё пересчитается автоматически.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
