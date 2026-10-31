import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  Sparkles,
  CheckCircle2,
  Plus,
  Lock,
  ArrowLeft,
  Check,
  Trash2,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { BottomSheet } from '../components/BottomSheet';
import { PinPad } from '../components/PinPad';
import { TopBar } from '../components/TopBar';
import { triggerConfetti } from '../components/ConfettiBurst';
import { useToast } from '../components/Toast';
import { KidProfile, KidGoal, KidTask } from '../types';
import { db } from '../lib/db';
import { verifyPin } from '../lib/security';

export const KidQuestPage: React.FC = () => {
  const { kidId } = useParams<{ kidId: string }>();
  const navigate = useNavigate();
  const { t, formatRupee, lang } = useI18n();
  const { showToast } = useToast();

  const [kid, setKid] = useState<KidProfile | null>(null);
  const [goals, setGoals] = useState<KidGoal[]>([]);
  const [tasks, setTasks] = useState<KidTask[]>([]);
  const [activeTab, setActiveTab] = useState<'goals' | 'chores'>('goals');

  // Modals
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(500);

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState(50);

  // Mom PIN Approval
  const [approvingTaskId, setApprovingTaskId] = useState<string | null>(null);
  const [pinError, setPinError] = useState(false);

  const refreshKidData = async () => {
    if (!kidId) return;
    const currentKid = await db.kids.get(kidId);
    if (currentKid) {
      setKid(currentKid);
      const kidGoals = await db.goals.where('kidId').equals(kidId).toArray();
      const kidTasks = await db.tasks.where('kidId').equals(kidId).toArray();
      setGoals(kidGoals);
      setTasks(kidTasks);
    }
  };

  useEffect(() => {
    refreshKidData();
  }, [kidId]);

  const handleAddGoal = async () => {
    if (!kidId || !newGoalTitle.trim() || newGoalTarget <= 0) return;

    const newGoal: KidGoal = {
      id: 'goal-' + Date.now(),
      kidId,
      title: newGoalTitle.trim(),
      targetAmount: newGoalTarget,
      savedAmount: 0,
      reward: 'சோகோபி பிஸ்கட் & வாழ்த்து அட்டை 🍪',
      completed: false,
      createdAt: Date.now(),
    };

    await db.goals.add(newGoal);
    await refreshKidData();
    setIsAddGoalOpen(false);
    setNewGoalTitle('');
    showToast(t('quest.goalCreated'), 'success');
  };

  const handleAddTask = async () => {
    if (!kidId || !newTaskTitle.trim() || newTaskPoints <= 0) return;

    const newTask: KidTask = {
      id: 'task-' + Date.now(),
      kidId,
      title: newTaskTitle.trim(),
      points: newTaskPoints,
      status: 'pending',
      createdAt: Date.now(),
    };

    await db.tasks.add(newTask);
    await refreshKidData();
    setIsAddTaskOpen(false);
    setNewTaskTitle('');
    showToast(t('quest.taskAdded'), 'success');
  };

  const handleContributeGoal = async (goalId: string, amount: number) => {
    const targetGoal = goals.find((g) => g.id === goalId);
    if (!targetGoal) return;

    const newCurrent = (targetGoal.savedAmount || 0) + amount;
    const isNowDone = newCurrent >= targetGoal.targetAmount;

    await db.goals.update(goalId, {
      savedAmount: newCurrent,
      completed: isNowDone,
    });

    if (isNowDone) {
      triggerConfetti();
      showToast(t('quest.goalReached'), 'success');
    } else {
      showToast(lang === 'ta' ? 'சேமிப்பில் சேர்க்கப்பட்டது' : 'Added to savings', 'success');
    }

    await refreshKidData();
  };

  // Mom PIN Verification
  const handleApprovePin = async (enteredPin: string) => {
    if (!approvingTaskId || !kid) return;

    const isValid = await verifyPin(enteredPin);
    if (isValid) {
      const task = tasks.find((t) => t.id === approvingTaskId);
      if (task) {
        // Mark task approved
        await db.tasks.update(task.id, { status: 'approved' });

        // Award points to kid
        const updatedPoints = (kid.totalPoints || 0) + task.points;
        await db.kids.update(kid.id, { totalPoints: updatedPoints });

        triggerConfetti();
        showToast(`+${task.points} 🍪 ${t('quest.pointsAwarded')}`, 'success');
      }
      setApprovingTaskId(null);
      await refreshKidData();
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 1500);
      showToast(t('lock.pinError'), 'error');
    }
  };

  if (!kid) {
    return (
      <div className="min-h-screen bg-[#FFF8EC] flex flex-col items-center justify-center p-6 text-center">
        <Mascot mood="alert" size={90} />
        <h2 className="text-xl font-black text-warmBrown mt-3">{t('quest.childNotFound')}</h2>
        <div className="mt-4">
          <Button variant="primary" onClick={() => navigate('/quest')}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col">
      <TopBar
        title={`${kid.avatar} ${kid.name}`}
        subtitle={`${kid.totalPoints || 0} 🍪 ${t('quest.biscuits')}`}
        showBack={true}
        onBack={() => navigate('/quest')}
      />

      <div className="flex-1 pb-28 pt-2 px-4 flex flex-col gap-4 max-w-[440px] mx-auto w-full select-none">
        {/* Back Link */}
        <button
          onClick={() => navigate('/quest')}
          className="self-start flex items-center gap-2 text-sm font-bold text-warmBrown hover:text-kumkum px-2 py-1 rounded-xl transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        {/* Kid Stat Card */}
        <Card variant="warmGold" className="flex items-center justify-between p-4 bg-gradient-to-tr from-turmeric-light to-white border-turmeric">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{kid.avatar}</span>
            <div>
              <h2 className="text-xl font-black text-warmBrown">{kid.name}</h2>
              <div className="text-sm font-bold text-turmeric-dark flex items-center gap-1.5 mt-0.5">
                <span>{kid.totalPoints || 0} 🍪 {t('quest.biscuits')}</span>
                <span>•</span>
                <span>{formatRupee(kid.totalPoints || 0)}</span>
              </div>
            </div>
          </div>
          <Mascot mood="happy" size={56} />
        </Card>

        {/* Sub-tabs: Goals vs Chores */}
        <div className="flex p-1 bg-white rounded-2xl border border-[#EFEBE9] shadow-warm-sm">
          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'goals'
                ? 'bg-kumkum text-white shadow-warm-sm'
                : 'text-warmBrown-muted hover:text-warmBrown'
            }`}
          >
            🎯 {t('quest.goalsTab')} ({goals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chores')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'chores'
                ? 'bg-kumkum text-white shadow-warm-sm'
                : 'text-warmBrown-muted hover:text-warmBrown'
            }`}
          >
            ⭐ {t('quest.choresTab')} ({tasks.length})
          </button>
        </div>

        {/* TAB 1: GOALS */}
        {activeTab === 'goals' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
                {t('quest.activeGoals')}
              </span>
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
              <Card variant="surface" className="text-center py-8">
                <span className="text-3xl">🎯</span>
                <p className="text-xs font-bold text-warmBrown mt-2">{t('quest.noGoalsYet')}</p>
              </Card>
            ) : (
              goals.map((goal) => {
                const percent = Math.min(
                  100,
                  Math.round(((goal.savedAmount || 0) / goal.targetAmount) * 100)
                );
                return (
                  <Card key={goal.id} variant="surface" className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">🎯</span>
                        <div>
                          <span className="text-sm font-black text-warmBrown block">{goal.title}</span>
                          <span className="text-xs font-semibold text-warmBrown-subtle">
                            {formatRupee(goal.savedAmount || 0)} / {formatRupee(goal.targetAmount)}
                          </span>
                        </div>
                      </div>
                      <span className="text-base font-black text-kumkum">{percent}%</span>
                    </div>

                    <div className="w-full h-3 bg-cream-dark rounded-full overflow-hidden">
                      <div
                        className="h-full bg-kumkum rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {!goal.completed ? (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleContributeGoal(goal.id, 50)}
                          className="flex-1 py-2 px-3 rounded-xl bg-turmeric-light border border-turmeric text-warmBrown font-bold text-xs hover:bg-turmeric active:scale-95 transition-all"
                        >
                          + {formatRupee(50)} {lang === 'ta' ? 'சேமி' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleContributeGoal(goal.id, 100)}
                          className="flex-1 py-2 px-3 rounded-xl bg-turmeric-light border border-turmeric text-warmBrown font-bold text-xs hover:bg-turmeric active:scale-95 transition-all"
                        >
                          + {formatRupee(100)} {lang === 'ta' ? 'சேமி' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-1 text-leafGreen font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('quest.goalCompleted')}</span>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: CHORES & MOM APPROVAL */}
        {activeTab === 'chores' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
                {t('quest.choresTab')}
              </span>
              <button
                type="button"
                onClick={() => setIsAddTaskOpen(true)}
                className="text-xs font-bold text-kumkum flex items-center gap-1 hover:underline"
              >
                <Plus className="w-4 h-4" />
                <span>{t('quest.addTask')}</span>
              </button>
            </div>

            {tasks.length === 0 ? (
              <Card variant="surface" className="text-center py-8">
                <span className="text-3xl">⭐</span>
                <p className="text-xs font-bold text-warmBrown mt-2">{t('quest.noChoresYet')}</p>
              </Card>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#EFEBE9] shadow-warm-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cream-dark flex items-center justify-center text-base flex-shrink-0">
                      ⭐
                    </div>
                    <div>
                      <span className="text-sm font-bold text-warmBrown block">{task.title}</span>
                      <span className="text-xs font-black text-turmeric-dark">
                        +{task.points} 🍪 {t('quest.biscuits')}
                      </span>
                    </div>
                  </div>

                  {task.status === 'approved' ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-leafGreen">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('quest.completed')}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setApprovingTaskId(task.id)}
                      className="px-3 py-1.5 rounded-xl bg-kumkum text-white text-xs font-bold hover:bg-kumkum-dark active:scale-95 transition-all flex items-center gap-1 shadow-warm-sm"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t('quest.momApprove')}</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MOM PIN APPROVAL MODAL */}
      <BottomSheet
        isOpen={!!approvingTaskId}
        onClose={() => setApprovingTaskId(null)}
        title={t('quest.momApprovalTitle')}
      >
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <Mascot mood="happy" size={70} />
          <p className="text-xs font-bold text-warmBrown-muted max-w-xs">
            {t('quest.momApprovalDesc')}
          </p>
          <PinPad
            onComplete={handleApprovePin}
            isError={pinError}
            errorMessage={t('lock.pinError')}
          />
        </div>
      </BottomSheet>

      {/* MODAL: ADD GOAL */}
      <BottomSheet
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        title={t('quest.addGoal')}
      >
        <div className="flex flex-col gap-4 py-2">
          <div>
            <label htmlFor="kid-goal-title" className="text-xs font-bold text-warmBrown-subtle uppercase block mb-1.5">
              {t('quest.goalName')}
            </label>
            <input
              id="kid-goal-title"
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="e.g. பள்ளிப் பை / School Bag"
              className="w-full px-4 py-3 rounded-2xl bg-cream border border-[#EFEBE9] text-warmBrown font-bold text-sm focus:border-kumkum focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="kid-goal-amount" className="text-xs font-bold text-warmBrown-subtle uppercase block mb-1.5">
              {t('quest.targetAmount')} (₹)
            </label>
            <input
              id="kid-goal-amount"
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

      {/* MODAL: ADD TASK */}
      <BottomSheet
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        title={t('quest.addTask')}
      >
        <div className="flex flex-col gap-4 py-2">
          <div>
            <label htmlFor="kid-task-title" className="text-xs font-bold text-warmBrown-subtle uppercase block mb-1.5">
              {t('quest.taskName')}
            </label>
            <input
              id="kid-task-title"
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. படிக்கும் அறையை சுத்தம் செய் / Clean room"
              className="w-full px-4 py-3 rounded-2xl bg-cream border border-[#EFEBE9] text-warmBrown font-bold text-sm focus:border-kumkum focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="kid-task-points" className="text-xs font-bold text-warmBrown-subtle uppercase block mb-1.5">
              {t('quest.pointsAwarded')} (🍪)
            </label>
            <input
              id="kid-task-points"
              type="number"
              value={newTaskPoints}
              onChange={(e) => setNewTaskPoints(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-2xl bg-cream border border-[#EFEBE9] text-warmBrown font-black text-lg focus:border-kumkum focus:outline-none"
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim() || newTaskPoints <= 0}
          >
            {t('common.save')}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
};
