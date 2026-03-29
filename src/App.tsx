/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sun, Cloud, CloudRain, Coffee, Heart, Wind, Sparkles, ExternalLink, Loader2, Thermometer, Newspaper } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface CoffeeProduct {
  name: string;
  description: string;
  url: string;
  reason: string;
  price: string;
}

export default function App() {
  const [weather, setWeather] = useState<string>('sunny');
  const [apparentTemp, setApparentTemp] = useState<number>(25);
  const [mood, setMood] = useState<string>('');
  const [flavor, setFlavor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CoffeeProduct[]>([]);
  const [moodQuote, setMoodQuote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weatherOptions = [
    { id: 'sunny', label: '晴天', icon: Sun, color: 'text-orange-500' },
    { id: 'rainy', label: '雨天', icon: CloudRain, color: 'text-blue-500' },
    { id: 'cloudy', label: '陰天', icon: Cloud, color: 'text-gray-500' },
  ];

  const getRecommendations = async () => {
    if (!mood.trim()) {
      setError("請分享一下您現在的心情吧！");
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendations([]);
    setMoodQuote(null);

    try {
      const prompt = `
      情境描述：
      - 天氣：${weatherOptions.find(w => w.id === weather)?.label}
      - 體感溫度：${apparentTemp}°C
      - 使用者自述心情：${mood}
      - 喜愛的咖啡風味描述：${flavor || '未指定，請根據心情與天氣推薦'}
      
      任務：
      1. 推薦 3 款適合此情境且符合使用者風味偏好的「濾掛咖啡」商品。**請從各大主流電商平台（如 全聯線上購, momo, PChome, 蝦皮, 博客來等）中尋找「現貨供應中」且「可直接下單購買」的真實商品。**
      **特別價格限制：請優先挑選單包價格（換算後）在新台幣 15 元以下的平價實惠商品。**
      2. 請根據使用者的心情與當前的天氣/溫度，寫出一句溫暖、療癒或充滿智慧的「心情小語 (Mood Quote)」，幫助使用者在品嚐咖啡時放鬆身心。
      
      請使用 Google Search 進行實時搜尋，確保商品連結是各大電商平台的有效商品頁面，且資訊為最新。
      
      請以 JSON 格式回傳，結構如下：
      {
        "recommendations": [
          { "name": "...", "description": "...", "url": "...", "reason": "...", "price": "單包價格或總價" }
        ],
        "moodQuote": "..."
      }
      
      請只回傳 JSON 內容。`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      const data = JSON.parse(text);
      
      setRecommendations(data.recommendations || []);
      setMoodQuote(data.moodQuote || null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("搜尋時發生錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto">
      <header className="mb-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="serif text-5xl md:text-7xl mb-4 text-[#5A5A40]"
        >
          咖啡心情選物
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-600 italic"
        >
          結合天氣、溫度與心情，為您挑選最適合的「濾掛咖啡」與今日時光
        </motion.p>
      </header>

      <main className="space-y-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Weather & Temp */}
          <section className="space-y-6">
            <div>
              <h2 className="serif text-2xl mb-4 border-b border-[#5A5A40]/20 pb-2 flex items-center gap-2">
                <Sun size={24} /> 選擇天氣
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {weatherOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setWeather(option.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all border-2 ${
                      weather === option.id 
                        ? 'bg-white border-[#5A5A40] shadow-md scale-105' 
                        : 'bg-white/50 border-transparent hover:bg-white'
                    }`}
                  >
                    <option.icon className={`w-6 h-6 mb-1 ${option.color}`} />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="serif text-2xl mb-4 border-b border-[#5A5A40]/20 pb-2 flex items-center gap-2">
                <Thermometer size={24} /> 體感溫度
              </h2>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between mb-4">
                  <span className="text-gray-500">寒冷</span>
                  <span className="text-2xl font-bold text-[#5A5A40]">{apparentTemp}°C</span>
                  <span className="text-gray-500">炎熱</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="40" 
                  value={apparentTemp}
                  onChange={(e) => setApparentTemp(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#5A5A40]"
                />
              </div>
            </div>
          </section>

          {/* Mood Input */}
          <section>
            <h2 className="serif text-2xl mb-4 border-b border-[#5A5A40]/20 pb-2 flex items-center gap-2">
              <Heart size={24} /> 現在的心情
            </h2>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
              <textarea
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="例如：今天工作有點累，想找點溫暖的感覺... 或：心情大好，想嘗試奔放的風味！"
                className="flex-grow w-full p-4 rounded-2xl bg-[#f5f5f0]/50 border-none focus:ring-2 focus:ring-[#5A5A40] resize-none text-gray-700 placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-400 mt-2 italic">請自由描述您的感受，AI 會為您解讀</p>
            </div>
          </section>
        </div>

        {/* Flavor Selection */}
        <section>
          <h2 className="serif text-2xl mb-4 border-b border-[#5A5A40]/20 pb-2 flex items-center gap-2">
            <Coffee size={24} /> 喜愛的咖啡風味
          </h2>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <input
              type="text"
              value={flavor}
              onChange={(e) => setFlavor(e.target.value)}
              placeholder="例如：帶點果酸、深焙苦甜、或是想嘗試花香調..."
              className="w-full p-4 rounded-2xl bg-[#f5f5f0]/50 border-none focus:ring-2 focus:ring-[#5A5A40] text-gray-700 placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-2 italic">請自由描述您偏好的風味，AI 會為您在各大賣場中尋找</p>
          </div>
        </section>

        {/* Action Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={getRecommendations}
            disabled={loading}
            className="bg-[#5A5A40] text-white px-12 py-4 rounded-full text-xl serif hover:bg-[#4A4A30] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? '正在為您編織時光...' : '推薦適合我的濾掛咖啡'}
          </button>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-50 text-red-600 rounded-xl text-center"
            >
              {error}
            </motion.div>
          )}

          {(recommendations.length > 0 || moodQuote) && (
            <div className="space-y-16">
              {/* Mood Quote Section */}
              {moodQuote && (
                <motion.section
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center px-4"
                >
                  <div className="inline-block relative">
                    <Sparkles className="absolute -top-6 -left-6 text-yellow-400 opacity-50" size={32} />
                    <p className="serif text-2xl md:text-3xl text-[#5A5A40] italic leading-relaxed max-w-2xl mx-auto">
                      「{moodQuote}」
                    </p>
                    <Sparkles className="absolute -bottom-6 -right-6 text-yellow-400 opacity-50" size={32} />
                  </div>
                </motion.section>
              )}

              {/* Coffee Recommendations */}
              {recommendations.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4 justify-center">
                    <div className="h-px bg-[#5A5A40]/20 flex-grow"></div>
                    <h2 className="serif text-3xl text-[#5A5A40]">濾掛咖啡推薦</h2>
                    <div className="h-px bg-[#5A5A40]/20 flex-grow"></div>
                  </div>
                  <div className="grid gap-6">
                    {recommendations.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="serif text-2xl text-[#5A5A40]">{item.name}</h3>
                            <p className="text-[#5A5A40] font-bold text-sm mt-1">價格：{item.price}</p>
                          </div>
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-[#5A5A40] transition-colors"
                          >
                            <ExternalLink size={20} />
                          </a>
                        </div>
                        <p className="text-gray-600 mb-4 leading-relaxed">{item.description}</p>
                        <div className="bg-[#f5f5f0] p-4 rounded-2xl italic text-sm text-[#5A5A40]">
                          <span className="font-bold not-italic mr-2">推薦原因：</span>
                          {item.reason}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-24 text-center text-gray-400 text-sm pb-12">
        <p>© 2026 咖啡心情選物 - 尋找屬於您的命定風味</p>
      </footer>
    </div>
  );
}
