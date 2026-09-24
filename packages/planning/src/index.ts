import type { DueState, Effort, EnergyLevel, Priority } from '@homecare/contracts';

export interface PlanningTask {
  id: string;
  dueState: DueState;
  priority: Priority;
  effort: Effort;
  estimatedMinutes: number;
  lastCompletedAt: string | null;
  assignedTo: string | null;
}

export interface PlanSelection {
  taskId: string;
  estimatedMinutes: number;
  reason: 'overdue' | 'due' | 'priority';
  score: number;
}

export interface GeneratePlanOptions {
  userId: string;
  energyLevel: EnergyLevel;
  timeBudgetMinutes: number;
  includeAssignedToOthers?: boolean;
}

const dueScore: Record<DueState, number> = {
  overdue: 100,
  due: 70,
  upcoming: 30,
  not_due: 0,
};

const priorityScore: Record<Priority, number> = {
  high: 24,
  normal: 8,
  low: 0,
};

const energyScore: Record<EnergyLevel, Record<Effort, number>> = {
  low: { low: 16, normal: 4, high: -20 },
  normal: { low: 8, normal: 12, high: 2 },
  high: { low: 4, normal: 10, high: 14 },
};

function selectionReason(task: PlanningTask): PlanSelection['reason'] {
  if (task.dueState === 'overdue') return 'overdue';
  if (task.dueState === 'due') return 'due';
  return 'priority';
}

function taskScore(task: PlanningTask, options: GeneratePlanOptions): number {
  const assignment = task.assignedTo === options.userId ? 12 : 0;
  const durationFit = task.estimatedMinutes <= options.timeBudgetMinutes ? 6 : -30;
  return (
    dueScore[task.dueState] +
    priorityScore[task.priority] +
    energyScore[options.energyLevel][task.effort] +
    assignment +
    durationFit
  );
}

export function generatePlan(
  tasks: readonly PlanningTask[],
  options: GeneratePlanOptions,
): PlanSelection[] {
  const maximumMinutes = Math.floor(options.timeBudgetMinutes * 1.1);
  let selectedMinutes = 0;

  return tasks
    .filter((task) => task.dueState !== 'not_due' || task.priority === 'high')
    .filter(
      (task) =>
        options.includeAssignedToOthers || !task.assignedTo || task.assignedTo === options.userId,
    )
    .map((task) => ({ task, score: taskScore(task, options) }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      const leftDate = left.task.lastCompletedAt ?? '';
      const rightDate = right.task.lastCompletedAt ?? '';
      if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
      return left.task.id.localeCompare(right.task.id);
    })
    .reduce<PlanSelection[]>((plan, candidate) => {
      if (selectedMinutes + candidate.task.estimatedMinutes > maximumMinutes) return plan;
      plan.push({
        taskId: candidate.task.id,
        estimatedMinutes: candidate.task.estimatedMinutes,
        reason: selectionReason(candidate.task),
        score: candidate.score,
      });
      selectedMinutes += candidate.task.estimatedMinutes;
      return plan;
    }, []);
}
