import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  Plus,
  UserPlus,
  Check,
  Lock,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { BottomSheet } from '../components/BottomSheet';
import { PinPad } from '../components/PinPad';
import { triggerConfetti } from '../components/ConfettiBurst';
import { useToast } from '../components/Toast';
import { KidProfile, KidGoal, KidTask } from '../types';
import { db } from '../lib/db';
import { verifyPin } from '../lib/security';

export const QuestScreen: React.FC = () => {
  const { t, formatRupee } = useI18n();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'goals' | 'chores'>('goals');
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [goals, setGoals] = useState<KidGoal[]>([]);
  const [tasks, setTasks] = useState<KidTask[]>([]);
  const [selectedKidId, setSelectedKidId] = useState<string>('');

  // Modals
  const [isAddKidOpen, setIsAddKidOpen] = useState(false);
  const [newKidName, setNewKidName] = useState('');
  const [newKidAvatar, setNewKidAvatar] = useState('👦');

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(500);
  const [newGoalReward, setNewGoalReward] = useState('சோகோபி பிஸ்கட் & வாழ்த்து அட்டை 🍪');

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState(50);

  // Mom PIN Approval for chores
  const [approvingTaskId, setApprovingTaskId] = useState<string | null>(null);

  // Load from IndexedDB
  const refreshData = async () => {
    const loadedKids = await db.kids.toArray();
    const loadedGoals = await db.goals.toArray();
    const loadedTasks = await db.tasks.toArray();

    setKids(loadedKids);
    setGoals(loadedGoals);
    setTasks(loadedTasks);

    if (loadedKids.length > 0 && !selectedKidId) {
      setSelectedKidId(loadedKids[0].id);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const selectedKid = kids.find((k) => k.id === selectedKidId) || kids[0];
  const kidGoals = goals.filter((g) => g.kidId === selectedKid?.id);
  const kidTasks = tasks.filter((t) => t.kidId === selectedKid?.id);

  const handleAddKid = async () => {
    if (!newKidName.trim()) return;
    if (kids.length >= 4) {
      showToast('அதிகபட்சம் 4 குழந்தைகள் மட்டுமே சேர்க்க முடியும் (Max 4 kids)', 'warning');
      return;
    }

    const newKid: KidProfile = {
      id: 'kid-' + Date.now(),
      name: newKidName.trim(),
      avatar: newKidAvatar,
      totalPoints: 0,
      createdAt: Date.now(),
    };

    await db.kids.add(newKid);
    setNewKidName('');
    setIsAddKidOpen(false);
    showToast(t('common.success'), 'success');
    await refreshData();
    setSelectedKidId(newKid.id);
  };

  const handleAddGoal = async () => {
    if (!selectedKid || !newGoalTitle.trim() || newGoalTarget <= 0) return;

    const newGoal: KidGoal = {
      id: 'goal-' + Date.now(),
      kidId: selectedKid.id,
      title: newGoalTitle.trim(),
      targetAmount: newGoalTarget,
      savedAmount: 0,
      reward: newGoalReward,
      completed: false,
      createdAt: Date.now(),
    };

    await db.goals.add(newGoal);
    setNewGoalTitle('');
    setIsAddGoalOpen(false);
    showToast(t('common.success'), 'success');
    await refreshData();
  };

  const handleAddTask = async () => {
    if (!selectedKid || !newTaskTitle.trim() || newTaskPoints <= 0) return;

    const newTask: KidTask = {
      id: 'task-' + Date.now(),
      kidId: selectedKid.id,
      title: newTaskTitle.trim(),
      points: newTaskPoints,
      status: 'pending',
      createdAt: Date.now(),
    };

    await db.tasks.add(newTask);
    setNewTaskTitle('');
    setIsAddTaskOpen(false);
    showToast(t('common.success'), 'success');
    await refreshData();
  };

  // Mom Approves Chore with PIN Verification
  const handleApproveWithPin = async (enteredPin: string) => {
    const ok = await verifyPin(enteredPin);
    if (!ok) {
      showToast(t('lock.pinError'), 'error');
      return;
    }

    if (!approvingTaskId) return;

    const task = tasks.find((t) => t.id === approvingTaskId);
    if (task && selectedKid) {
      // 1. Mark task approved
      await db.tasks.update(task.id, { status: 'approved' });

      // 2. Add points to Kid
      const updatedPoints = selectedKid.totalPoints + task.points;
      await db.kids.update(selectedKid.id, { totalPoints: updatedPoints });

      // 3. Add to Kid's active goal
      const activeGoal = kidGoals.find((g) => !g.completed);
      if (activeGoal) {
        const nextSaved = Math.min(activeGoal.targetAmount, activeGoal.savedAmount + task.points);
        const justCompleted = nextSaved >= activeGoal.targetAmount && !activeGoal.completed;

        await db.goals.update(activeGoal.id, {
          savedAmount: nextSaved,
          completed: nextSaved >= activeGoal.targetAmount,
        });

        if (justCompleted) {
          triggerConfetti();
          showToast(t('quest.goalCompleted'), 'success');
        } else {
          showToast(`+${task.points} நாணயங்கள் சேர்க்கப்பட்டது! 🌟`, 'success');
        }
      }

      setApprovingTaskId(null);
      await refreshData();
    }
  };

  return (
    <div className="pb-28 pt-2 px-4 flex flex-col gap-5 max-w-[440px] mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-warmBrown tracking-tight flex items-center gap-1.5">
            {t('quest.title')}
          </h2>
          <p className="text-xs sm:text-sm text-warmBrown-subtle font-medium mt-0.5">
            {t('quest.subtitle')}
          </p>
        </div>
        <Mascot mood="celebrate" size={60} />
      </div>

      {/* Kid Selector Horizontal Row (Max 4 Kids) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {kids.map((k) => (
          <button
            key={k.id}
            onClick={() => setSelectedKidId(k.id)}
            className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              selectedKid?.id === k.id
                ? 'bg-kumkum text-white border-kumkum shadow-warm-md scale-[1.02]'
                : 'bg-white text-warmBrown border-[#EFEBE9] hover:bg-cream'
            }`}
          >
            <span className="text-xl">{k.avatar}</span>
            <span>{k.name}</span>
          </button>
        ))}

        {kids.length < 4 && (
          <button
            onClick={() => setIsAddKidOpen(true)}
            className="px-3 py-2 rounded-2xl bg-white border border-dashed border-turmeric text-warmBrown text-xs font-bold flex items-center gap-1 whitespace-nowrap hover:bg-turmeric-light active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-turmeric-dark" />
            <span>{t('quest.addKidBtn')}</span>
          </button>
        )}
      </div>

      {/* Selected Kid Gold Coin Bank */}
      {selectedKid && (
        <Card variant="warmGold" className="border-turmeric-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-3xl bg-turmeric flex items-center justify-center text-3xl shadow-warm-sm border border-turmeric-dark/20">
                {selectedKid.avatar}
              </div>
              <div>
                <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
                  {selectedKid.name} உண்டியல்
                </span>
                <div className="text-3xl font-black text-warmBrown flex items-center gap-1.5 mt-0.5">
                  <span>{selectedKid.totalPoints.toLocaleString('en-IN')}</span>
                  <span className="text-sm font-bold text-turmeric-dark">
                    {t('quest.pointsSuffix')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs bg-white text-leafGreen font-extrabold px-3 py-1 rounded-full shadow-warm-sm border border-leafGreen/20">
                🌟 லெவல் {Math.floor(selectedKid.totalPoints / 500) + 1}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs: Goals vs Chores */}
      <div className="flex p-1 bg-white rounded-3xl border border-[#EFEBE9] shadow-warm-sm">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'goals'
              ? 'bg-kumkum text-white shadow-warm-sm'
              : 'text-warmBrown-muted hover:text-warmBrown'
          }`}
        >
          {t('quest.kidsTab')} ({kidGoals.length})
        </button>
        <button
          onClick={() => setActiveTab('chores')}
          className={`flex-1 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'chores'
              ? 'bg-kumkum text-white shadow-warm-sm'
              : 'text-warmBrown-muted hover:text-warmBrown'
          }`}
        >
          {t('quest.choresTab')} ({kidTasks.length})
        </button>
      </div>

      {/* 1. Goals Tab Content */}
      {activeTab === 'goals' && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-warmBrown">
              {t('quest.activeGoals')}
            </h3>
            <button
              onClick={() => setIsAddGoalOpen(true)}
              className="text-xs font-bold text-kumkum flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('quest.addGoalBtn')}</span>
            </button>
          </div>

          {kidGoals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
            const isCompleted = percent >= 100 || goal.completed;

            return (
              <Card
                key={goal.id}
                variant="surface"
                className={`border-2 transition-all ${
                  isCompleted ? 'border-leafGreen/50 bg-leafGreen-light/20' : 'border-[#EFEBE9]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🎯</span>
                    <div className="flex flex-col">
                      <span className="text-base font-extrabold text-warmBrown leading-snug">
                        {goal.title}
                      </span>
                      <span className="text-xs font-semibold text-warmBrown-subtle">
                        {t('quest.rewardLabel')} {goal.reward}
                      </span>
                    </div>
                  </div>

                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-leafGreen bg-white px-2.5 py-1 rounded-full shadow-warm-sm border border-leafGreen/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>முடிந்தது! 🎉</span>
                    </span>
                  ) : (
                    <span className="text-xs font-black text-kumkum">
                      {percent}%
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-3.5 flex flex-col gap-1.5">
                  <div className="w-full h-3.5 bg-[#EFEBE9] rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-leafGreen'
                          : 'bg-gradient-to-r from-turmeric to-kumkum'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs font-bold text-warmBrown-muted">
                    <span>
                      {t('quest.saved')}: {formatRupee(goal.savedAmount)}
                    </span>
                    <span>
                      {t('quest.target')}: {formatRupee(goal.targetAmount)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 2. Household Chores Tab Content */}
      {activeTab === 'chores' && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-warmBrown">
              {t('quest.choresTab')}
            </h3>
            <button
              onClick={() => setIsAddTaskOpen(true)}
              className="text-xs font-bold text-kumkum flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('quest.assignChore')}</span>
            </button>
          </div>

          {kidTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-3xl bg-white border border-[#EFEBE9] shadow-warm-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {task.status === 'approved' ? '✅' : '🧹'}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-warmBrown leading-snug">
                    {task.title}
                  </span>
                  <span className="text-xs font-semibold text-turmeric-dark mt-0.5">
                    +{task.points} {t('quest.pointsSuffix')}
                  </span>
                </div>
              </div>

              {task.status === 'approved' ? (
                <span className="text-xs font-bold text-leafGreen bg-leafGreen-light px-2.5 py-1 rounded-full">
                  அங்கீகரிக்கப்பட்டது
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setApprovingTaskId(task.id)}
                  className="px-3 py-1.5 rounded-2xl bg-turmeric hover:bg-turmeric-dark text-warmBrown font-bold text-xs shadow-warm-sm flex items-center gap-1 active:scale-95 transition-all"
                >
                  <Lock className="w-3.5 h-3.5 text-kumkum" />
                  <span>அங்கீகரி (PIN)</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Weekly Savings Tip for Kids */}
      <Card variant="cream" className="border-turmeric-200">
        <h4 className="text-sm font-bold text-warmBrown flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-turmeric-dark" />
          <span>{t('quest.weeklyTipTitle')}</span>
        </h4>
        <p className="text-xs sm:text-sm font-medium text-warmBrown-muted leading-relaxed">
          {t('quest.rule1')}
        </p>
      </Card>

      {/* Modal: Add Kid */}
      <BottomSheet isOpen={isAddKidOpen} onClose={() => setIsAddKidOpen(false)} title={t('quest.addKidBtn')}>
        <div className="flex flex-col gap-4 py-2">
          <div>
            <label className="text-xs font-bold text-warmBrown-subtle">
              {t('quest.kidNamePrompt')}
            </label>
            <input
              type="text"
              value={newKidName}
              onChange={(e) => setNewKidName(e.target.value)}
              placeholder="எ.கா: ஆகாஷ் அல்லது அனு"
              className="w-full min-h-[48px] px-3.5 rounded-2xl bg-cream border border-[#EFEBE9] font-bold text-warmBrown mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-warmBrown-subtle mb-1 block">
              அவதார் தேர்வு:
            </label>
            <div className="flex gap-3">
              {['👦', '👧', '🦁', '🌸'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewKidAvatar(emoji)}
                  className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center border-2 ${
                    newKidAvatar === emoji ? 'border-kumkum bg-kumkum-100 scale-105' : 'border-[#EFEBE9] bg-white'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <Button variant="primary" onClick={handleAddKid} icon={<Check className="w-5 h-5" />}>
            {t('common.save')}
          </Button>
        </div>
      </BottomSheet>

      {/* Modal: Add Goal */}
      <BottomSheet isOpen={isAddGoalOpen} onClose={() => setIsAddGoalOpen(false)} title="+ புதிய இலக்கு சேர்க்க">
        <div className="flex flex-col gap-4 py-2">
          <div>
            <label className="text-xs font-bold text-warmBrown-subtle">
              இலக்கு பெயர்:
            </label>
            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="எ.கா: பள்ளி புத்தகப் பை"
              className="w-full min-h-[48px] px-3.5 rounded-2xl bg-cream border border-[#EFEBE9] font-bold text-warmBrown mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-warmBrown-subtle">
              இலக்கு தொகை (₹):
            </label>
            <input
              type="number"
              value={newGoalTarget}
              onChange={(e) => setNewGoalTarget(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[48px] px-3.5 rounded-2xl bg-cream border border-[#EFEBE9] font-bold text-warmBrown mt-1 text-xl"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-warmBrown-subtle">
              வெகுமதி:
            </label>
            <input
              type="text"
              value={newGoalReward}
              onChange={(e) => setNewGoalReward(e.target.value)}
              className="w-full min-h-[48px] px-3.5 rounded-2xl bg-cream border border-[#EFEBE9] font-bold text-warmBrown mt-1"
            />
          </div>

          <Button variant="primary" onClick={handleAddGoal} icon={<Check className="w-5 h-5" />}>
            {t('common.save')}
          </Button>
        </div>
      </BottomSheet>

      {/* Modal: Assign Chore */}
      <BottomSheet isOpen={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)} title="+ பணி சேர்க்க">
        <div className="flex flex-col gap-4 py-2">
          <div>
            <label className="text-xs font-bold text-warmBrown-subtle">
              வீட்டுப் பணி:
            </label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="எ.கா: படிக்கும் மேசையை சுத்தம் செய்தல்"
              className="w-full min-h-[48px] px-3.5 rounded-2xl bg-cream border border-[#EFEBE9] font-bold text-warmBrown mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-warmBrown-subtle">
              வழங்கப்படும் நாணயங்கள்:
            </label>
            <input
              type="number"
              value={newTaskPoints}
              onChange={(e) => setNewTaskPoints(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[48px] px-3.5 rounded-2xl bg-cream border border-[#EFEBE9] font-bold text-warmBrown mt-1 text-xl"
            />
          </div>

          <Button variant="primary" onClick={handleAddTask} icon={<Check className="w-5 h-5" />}>
            {t('common.save')}
          </Button>
        </div>
      </BottomSheet>

      {/* Modal: Mom PIN Verification to Approve Chore */}
      <BottomSheet
        isOpen={!!approvingTaskId}
        onClose={() => setApprovingTaskId(null)}
        title="அம்மாவின் PIN அங்கீகாரம்"
      >
        <div className="flex flex-col items-center py-2">
          <p className="text-xs sm:text-sm font-semibold text-warmBrown-muted mb-4 text-center">
            பணி முடிவடைந்ததை உறுதி செய்து நாணயங்கள் வழங்க உங்கள் PIN எண்ணை அழுத்தவும் அம்மா.
          </p>
          <PinPad onComplete={handleApproveWithPin} />
        </div>
      </BottomSheet>
    </div>
  );
};
