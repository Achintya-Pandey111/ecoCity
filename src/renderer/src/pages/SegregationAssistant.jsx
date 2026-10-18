import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  Award,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Flame,
  X
} from 'lucide-react';
import { WASTE_CATEGORIES, WASTE_ITEMS, QUIZ_QUESTIONS } from '../data/segregationData';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SegregationAssistant() {
  const { currentUser } = useAuth();
  const { success } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'quiz'
  const [selectedItem, setSelectedItem] = useState(null);

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);

  useEffect(() => {
    loadQuizHistory();
  }, []);

  const loadQuizHistory = async () => {
    try {
      const res = await api.getQuizHistory();
      if (res.success) {
        setQuizHistory(res.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter items
  const filteredItems = WASTE_ITEMS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.instructions.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || item.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Quiz handlers
  const handleAnswerSelect = (index) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(index);
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;
    setIsAnswerSubmitted(true);
    if (selectedAnswer === QUIZ_QUESTIONS[currentQuestionIndex].correctIndex) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      // Quiz complete
      setIsQuizCompleted(true);
      const total = QUIZ_QUESTIONS.length;
      const finalScore = quizScore + (selectedAnswer === QUIZ_QUESTIONS[currentQuestionIndex].correctIndex ? 1 : 0);
      const pct = Math.round((finalScore / total) * 100);

      let badge = 'Green Apprentice';
      if (pct >= 85) badge = 'Master Segregator';
      else if (pct >= 60) badge = 'Eco Champion';

      try {
        await api.saveQuizResult({
          user_name: currentUser?.name || 'Citizen User',
          score: finalScore,
          total_questions: total,
          percentage: pct,
          badge_earned: badge
        });
        loadQuizHistory();
        success('Quiz Completed!', `You earned the "${badge}" badge with ${pct}% score!`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    setIsQuizCompleted(false);
  };

  const currentQ = QUIZ_QUESTIONS[currentQuestionIndex];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header and Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white font-heading">
              Waste Segregation Intelligence
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Search household and commercial waste items for verified municipal disposal streams, bin colors, and safety handling instructions.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-800/80 border border-slate-700/60">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Directory</span>
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Segregation Quiz</span>
          </button>
        </div>
      </div>

      {/* Local Municipal Rules Notice */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/20 flex items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <Info className="w-4 h-4" />
          </span>
          <div>
            <strong className="text-white">Municipal Segregation Bye-laws (Metropolis City 2026):</strong> Mandatory 3-way source segregation for residential complexes and 4-way for commercial establishments. Unsegregated waste attracts municipal warning notices.
          </div>
        </div>
      </div>

      {activeTab === 'directory' ? (
        /* DIRECTORY VIEW */
        <div className="space-y-6">
          {/* Search Bar & Category Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search items (e.g. vegetable peels, medicine, batteries, glass bottle, cardboard)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All Categories ({WASTE_ITEMS.length})
              </button>
              {Object.values(WASTE_CATEGORIES).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === cat.id
                      ? `${cat.colorClass} shadow-md`
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const catConfig =
                Object.values(WASTE_CATEGORIES).find(
                  (c) => c.id === item.categoryId
                ) || WASTE_CATEGORIES.DRY;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/40 backdrop-blur-md transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:shadow-xl hover:shadow-emerald-950/20"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catConfig.colorClass}`}
                      >
                        {item.category}
                      </span>
                      {item.specialHandling && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Special Handling</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.instructions}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: catConfig.hex }}
                      />
                      <span>Bin: {item.binColor}</span>
                    </div>
                    <span className="text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold text-[11px]">
                      <span>Guidelines</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">No waste items found</h4>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for broader terms like "paper", "oil", "food", or "battery".
              </p>
            </div>
          )}
        </div>
      ) : (
        /* QUIZ VIEW: "Test Your Segregation Skills" */
        <div className="max-w-3xl mx-auto space-y-6">
          {!isQuizCompleted ? (
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              {/* Progress Bar */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                <span>
                  Question {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}
                </span>
                <span className="text-emerald-400">Score: {quizScore}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`
                  }}
                />
              </div>

              {/* Question Text */}
              <h3 className="text-lg font-bold text-white font-heading leading-snug mb-6">
                {currentQ.question}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                  let btnStyle =
                    'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 text-slate-200';

                  if (selectedAnswer === idx) {
                    btnStyle =
                      'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500';
                  }

                  if (isAnswerSubmitted) {
                    if (idx === currentQ.correctIndex) {
                      btnStyle =
                        'bg-emerald-900/50 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400';
                    } else if (selectedAnswer === idx) {
                      btnStyle =
                        'bg-rose-950/50 border-rose-500 text-rose-200 ring-2 ring-rose-500';
                    } else {
                      btnStyle = 'opacity-40 bg-slate-900 border-slate-800 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswerSubmitted}
                      onClick={() => handleAnswerSelect(idx)}
                      className={`w-full p-4 rounded-2xl border text-left text-xs font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                    >
                      <span>{option}</span>
                      {isAnswerSubmitted && idx === currentQ.correctIndex && (
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      {isAnswerSubmitted &&
                        selectedAnswer === idx &&
                        idx !== currentQ.correctIndex && (
                          <X className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                    </button>
                  );
                })}
              </div>

              {/* Educational Explanation Box */}
              {isAnswerSubmitted && (
                <div
                  className={`mt-6 p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in duration-200 ${
                    selectedAnswer === currentQ.correctIndex
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    {selectedAnswer === currentQ.correctIndex ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>
                      {selectedAnswer === currentQ.correctIndex
                        ? 'Spot on! Correct answer.'
                        : 'Incorrect.'}
                    </span>
                  </div>
                  <p>{currentQ.explanation}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end">
                {!isAnswerSubmitted ? (
                  <button
                    disabled={selectedAnswer === null}
                    onClick={handleAnswerSubmit}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-all shadow-lg cursor-pointer"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <span>
                      {currentQuestionIndex < QUIZ_QUESTIONS.length - 1
                        ? 'Next Question'
                        : 'View Results'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Completion Screen */
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-black text-white font-heading">
                Quiz Complete!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You scored {quizScore} out of {QUIZ_QUESTIONS.length} (
                {Math.round((quizScore / QUIZ_QUESTIONS.length) * 100)}%)
              </p>

              <div className="inline-block mt-4 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm">
                🎖️ Badge Earned:{' '}
                {quizScore >= 7
                  ? 'Master Segregator'
                  : quizScore >= 5
                  ? 'Eco Champion'
                  : 'Green Apprentice'}
              </div>

              <div className="mt-8 flex justify-center gap-3">
                <button
                  onClick={restartQuiz}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Quiz</span>
                </button>
                <button
                  onClick={() => setActiveTab('directory')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg cursor-pointer"
                >
                  Browse Waste Directory
                </button>
              </div>

              {/* Past Quiz History */}
              {quizHistory.length > 0 && (
                <div className="mt-10 pt-6 border-t border-slate-800 text-left">
                  <h4 className="text-xs font-bold text-slate-300 mb-3">
                    Recent Citizen Quiz Attempts (SQLite Persisted)
                  </h4>
                  <div className="space-y-2">
                    {quizHistory.slice(0, 3).map((h) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white">{h.user_name}</span>
                          <span className="text-slate-400 ml-2">({h.badge_earned})</span>
                        </div>
                        <div className="text-emerald-400 font-bold">
                          {h.score}/{h.total_questions} ({h.percentage}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedItem.category}
                </span>
                <h3 className="text-xl font-bold text-white font-heading mt-1">
                  {selectedItem.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4 text-xs leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Suitable Receptacle</span>
                  <span className="font-bold text-white text-sm">{selectedItem.binColor}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Special Handling</span>
                  <span
                    className={`font-semibold ${
                      selectedItem.specialHandling ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedItem.specialHandling ? 'Yes, Required' : 'Standard Routine'}
                  </span>
                </div>
              </div>

              <div>
                <strong className="text-white block mb-1">Disposal Method:</strong>
                <p className="text-slate-300">{selectedItem.method}</p>
              </div>

              <div>
                <strong className="text-white block mb-1">Detailed Instructions:</strong>
                <p className="text-slate-300">{selectedItem.instructions}</p>
              </div>

              {selectedItem.precautions && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  <strong className="block mb-1 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Safety Precautions:</span>
                  </strong>
                  <p>{selectedItem.precautions}</p>
                </div>
              )}

              {selectedItem.tips && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <strong className="block mb-1 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Eco Tip & Circular Economy:</span>
                  </strong>
                  <p>{selectedItem.tips}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
