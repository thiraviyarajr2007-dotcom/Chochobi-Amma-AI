import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Sparkles,
  CheckCircle2,
  Plus,
  UserPlus,
  Check,
  Target,
  ArrowRight,
  ArrowLeft,
  Coins,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { BottomSheet } from '../components/BottomSheet';
import { TopBar } from '../components/TopBar';
import { triggerConfetti } from '../components/ConfettiBurst';
import { useToast } from '../components/Toast';
import { KidProfile, KidGoal, KidTask } from '../types';
import { db } from '../lib/db';

export const QuestPage: React.FC = () => {
  const { t, formatRupee, lang } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [kids, setKids] = useState<KidProfile[]>([]);
  const [goals, setGoals] = useState<KidGoal[]>([]);
  const [tasks, setTasks] = useState<KidTask[]>([]);

  // Modals
  const [isAddKidOpen, setIsAddKidOpen] = useState(false);
  const [newKidName, setNewKidName] = useState('');
  const [newKidAvatar, setNewKidAvatar] = useState('👦');

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [targetKidId, setTargetKidId] = useState<string>('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(500);
  const [newGoalReward, setNewGoalReward] = useState('சோகோபி பிஸ்கட் & வாழ்த்து அட்டை 🍪');

  const refreshData = async () => {
    const loadedKids = await db.kids.toArray();
    const loadedGoals = await db.goals.toArray();
    const loadedTasks = await db.tasks.toArray();

    setKids(loadedKids);
    setGoals(loadedGoals);
    setTasks(loadedTasks);
    if (loadedKids.length > 0 && !targetKidId) {
      setTargetKidId(loadedKids[0].id);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const totalPoints = kids.reduce((acc, k) => acc + (k.totalPoints || 0), 0);

  const handleAddKid = async () => {
    if (!newKidName.trim()) return;
    if (kids.length >= 4) {
      showToast(lang === 'ta' ? 'அதிகபட்சம் 4 குழந்தைகள் மட்டுமே சேர்க்க முடியும்' : 'Max 4 children allowed', 'warning');
      return;
    }

    const newKid: KidProfile = {
      id: 'kid-' + Date.now(),
      name: newKidName.trim(),
      avatar: newKidAvatar,
      totalPoints: 100,
      createdAt: Date.now(),
    };

    await db.kids.add(newKid);
    await refreshData();
    setIsAddKidOpen(false);
    setNewKidName('');
    showToast(t('quest.childAdded'), 'success');
  };

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim() || newGoalTarget <= 0 || !targetKidId) return;

    const newGoal: KidGoal = {
      id: 'goal-' + Date.now(),
      kidId: targetKidId,
      title: newGoalTitle.trim(),
      targetAmount: newGoalTarget,
      savedAmount: 0,
      reward: newGoalReward || 'Reward',
      completed: false,
      createdAt: Date.now(),
    };

    await db.goals.add(newGoal);
    await refreshData();
    setIsAddGoalOpen(false);
    setNewGoalTitle('');
    showToast(t('quest.goalCreated'), 'success');
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col">
      <TopBar
        title={t('quest.title')}
        subtitle={t('quest.subtitle')}
        showBack={true}
        onBack={() => navigate('/home')}
      />

      <div className="flex-1 pb-28 pt-2 px-4 flex flex-col gap-5 max-w-[440px] mx-auto w-full select-none">
        {/* Back Link */}
        <button
          onClick={() => navigate('/home')}
          className="self-start flex items-center gap-2 text-sm font-bold text-warmBrown hover:text-kumkum px-2 py-1 rounded-xl transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        {/* Family Piggy Bank Banner */}
        <Card variant="warmGold" className="flex items-center justify-between p-4 bg-gradient-to-tr from-turmeric-light to-white border-turmeric">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-turmeric flex items-center justify-center text-2xl shadow-warm-sm">
              🏺
            </div>
            <div>
              <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider block">
                {lang === 'ta' ? 'குடும்ப சேமிப்பு உண்டியல்' : 'Family Piggy Bank'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-warmBrown">
                {totalPoints} 🍪 <span className="text-sm font-bold text-warmBrown-muted">({formatRupee(totalPoints)})</span>
              </div>
            </div>
          </div>
          <Mascot mood="happy" size={54} />
        </Card>

        {/* Children List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-warmBrown">
              {t('quest.childrenTitle')} ({kids.length}/4)
            </h3>
            {kids.length < 4 && (
              <button
                type="button"
                onClick={() => setIsAddKidOpen(true)}
                className="text-xs font-bold text-kumkum flex items-center gap-1 hover:underline"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('quest.addChild')}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {kids.map((kid) => {
              const kidGoalList = goals.filter((g) => g.kidId === kid.id);
              const activeGoal = kidGoalList[0];
              const percent = activeGoal
                ? Math.min(100, Math.round(((activeGoal.savedAmount || 0) / activeGoal.targetAmount) * 100))
                : 0;

              return (
                <div
                  key={kid.id}
                  onClick={() => navigate(`/quest/${kid.id}`)}
                  className="p-4 rounded-3xl bg-white border border-[#EFEBE9] hover:border-kumkum/40 shadow-warm-sm active:scale-[0.98] transition-all flex flex-col gap-3 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl">{kid.avatar}</span>
                      <div>
                        <span className="text-sm font-black text-warmBrown block">{kid.name}</span>
                        <span className="text-xs font-bold text-turmeric-dark">
                          {kid.totalPoints || 0} 🍪 {t('quest.biscuits')}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-warmBrown-subtle" />
                  </div>

                  {activeGoal ? (
                    <div className="flex flex-col gap-1.5 pt-1 border-t border-[#EFEBE9]">
                      <div className="flex justify-between text-xs font-semibold text-warmBrown-muted">
                        <span className="truncate max-w-[130px]">{activeGoal.title}</span>
                        <span className="font-bold text-kumkum">{percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-cream-dark rounded-full overflow-hidden">
                        <div
                          className="h-full bg-kumkum rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1 text-[11px] font-semibold text-warmBrown-subtle">
                      + {t('quest.addGoal')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Goals Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-warmBrown">
              {t('quest.activeGoals')} ({goals.length})
            </h3>
            <button
              type="button"
              onClick={() => setIsAddGoalOpen(true)}
              className="text-xs font-bold text-kumkum flex items-center gap-1 hover:underline"
            >
              <Plus className="w-4 h-4" />
              <span>{t('quest.addGoal')}</span>
            </button>
          </div>

          {goals.length === 0 ? (
            <Card variant="surface" className="text-center py-6">
              <span className="text-2xl">🎯</span>
              <p className="text-xs font-bold text-warmBrown mt-2">{t('quest.noGoalsYet')}</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-2.5">
              {goals.map((g) => {
                const kid = kids.find((k) => k.id === g.kidId);
                const percent = Math.min(100, Math.round(((g.savedAmount || 0) / g.targetAmount) * 100));

                return (
                  <div
                    key={g.id}
                    onClick={() => kid && navigate(`/quest/${kid.id}`)}
                    className="p-4 rounded-3xl bg-white border border-[#EFEBE9] hover:border-kumkum/40 shadow-warm-sm flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-kumkum-100 flex items-center justify-center text-lg flex-shrink-0">
                        🎯
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-warmBrown">{g.title}</span>
                        <span className="text-xs text-warmBrown-subtle font-medium">
                          {kid ? `${kid.avatar} ${kid.name}` : ''} • {formatRupee(g.savedAmount || 0)} / {formatRupee(g.targetAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-kumkum">{percent}%</span>
                      <ArrowRight className="w-4 h-4 text-warmBrown-subtle" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD CHILD */}
      <BottomSheet
        isOpen={isAddKidOpen}
        onClose={() => setIsAddKidOpen(false)}
        title={t('quest.addChild')}
      >
        <div className="flex flex-col gap-4 py-2">
          <div>
            <label htmlFor="kid-name-input" className="text-xs font-bold text-warmBrown-subtle uppercase block mb-1.5">
              {t('quest.childName')}
            </label>
            <input
              id="kid-name-input"
              type="text"
              value={newKidName}
              onChange={(e) => setNewKidName(e.target.value)}
              placeholder="e.g. கவின் / Priya"
              className="w-full px-4 py-3 rounded-2xl bg-cream border border-[#EFEBE9] text-warmBrown font-bold text-sm focus:border-kumkum focus:outline-none"
            />
          </div>

          <div>
            <span className="text-xs font-bold text-warmBrown-subtle uppercase block mb-1.5">
              {t('quest.selectAvatar')}
            </span>
            <div className="flex gap-2">
              {['👦', '👧', '🧒', '👶', '🦸', '🧚'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewKidAvatar(emoji)}
                  className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center border-2 transition-all ${
                    newKidAvatar === emoji ? 'border-kumkum bg-kumkum-100' : 'border-[#EFEBE9] bg-white'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleAddKid}
            disabled={!newKidName.trim()}
          >
            {t('common.save')}
          </Button>
        </div>
      </BottomSheet>

      {/* MODAL: ADD GOAL */}
      <BottomSheet
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        title={t('quest.addGoal')}
      >
        <div className="flex flex-col gap-4 py-2">
          {kids.length > 1 && (
            <div>
              <label htmlFor="goal-kid-select" className="text-xs font-bold text-warmBrown-subtle uppercase block mb-1.5">
                {t('quest.childrenTitle')}
              </label>
              <select
                id="goal-kid-select"
                value={targetKidId}
                onChange={(e) => setTargetKidId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-cream border border-[#EFEBE9] text-warmBrown font-bold text-sm focus:border-kumkum focus:outline-none"
              >
                {kids.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.avatar} {k.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="goal-name-input" className="text-xs font-bold text-warmBrown-subtle uppercase block mb-1.5">
              {t('quest.goalName')}
            </label>
            <input
              id="goal-name-input"
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="e.g. புதிய பள்ளிப் பை / New Bicycle"
              className="w-full px-4 py-3 rounded-2xl bg-cream border border-[#EFEBE9] text-warmBrown font-bold text-sm focus:border-kumkum focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="goal-target-input" className="text-xs font-bold text-warmBrown-subtle uppercase block mb-1.5">
              {t('quest.targetAmount')} (₹)
            </label>
            <input
              id="goal-target-input"
              type="number"
              value={newGoalTarget}
              onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-2xl bg-cream border border-[#EFEBE9] text-warmBrown font-black text-lg focus:border-kumkum focus:outline-none"
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleAddGoal}
            disabled={!newGoalTitle.trim() || newGoalTarget <= 0}
          >
            {t('common.save')}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
};
