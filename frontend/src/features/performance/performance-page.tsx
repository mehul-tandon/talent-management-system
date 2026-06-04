import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "../../components/page-header";
import { useAuth } from "../auth/auth-context";
import { api } from "../../lib/api";
import type { Employee, Goal, GoalStatus, GoalType } from "../../types/api";

interface GoalFormState {
  employeeId: string;
  title: string;
  description: string;
  dueDate: string;
  progress: number;
  status: GoalStatus;
  type: GoalType;
}

interface ReviewCycleFormState {
  name: string;
  type: "MID_YEAR" | "ANNUAL";
  startDate: string;
  endDate: string;
}

const goalStatuses: GoalStatus[] = ["NOT_STARTED", "IN_PROGRESS", "AT_RISK", "COMPLETED"];
const goalTypes: GoalType[] = ["INDIVIDUAL", "TEAM", "COMPANY"];

const defaultGoalForm: GoalFormState = {
  employeeId: "",
  title: "",
  description: "",
  dueDate: "",
  progress: 0,
  status: "NOT_STARTED",
  type: "INDIVIDUAL"
};

const defaultReviewCycleForm: ReviewCycleFormState = {
  name: "",
  type: "MID_YEAR",
  startDate: "",
  endDate: ""
};

function buildGoalState(goal: Goal): GoalFormState {
  return {
    employeeId: goal.employeeId,
    title: goal.title,
    description: goal.description,
    dueDate: goal.dueDate.slice(0, 10),
    progress: goal.progress,
    status: goal.status,
    type: goal.type
  };
}

export function PerformancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [goalForm, setGoalForm] = useState<GoalFormState>(defaultGoalForm);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editGoalForm, setEditGoalForm] = useState<GoalFormState>(defaultGoalForm);
  const [reviewCycleForm, setReviewCycleForm] = useState<ReviewCycleFormState>(
    defaultReviewCycleForm
  );
  const [managerId, setManagerId] = useState(user?.employee?.id ?? "");

  const employeesQuery = useQuery({
    queryKey: ["employees-for-goals"],
    queryFn: async () => {
      const envelope = await api.getEnvelope<Employee[]>("/employees?page=1&limit=100");
      return envelope.data;
    }
  });

  const employees = employeesQuery.data ?? [];

  useEffect(() => {
    if (goalForm.employeeId || employees.length === 0) {
      return;
    }

    setGoalForm((current) => ({
      ...current,
      employeeId: employees[0].id
    }));
  }, [employees, goalForm.employeeId]);

  useEffect(() => {
    if (managerId || !user?.employee?.id) {
      return;
    }

    setManagerId(user.employee.id);
  }, [managerId, user?.employee?.id]);

  useEffect(() => {
    if (!editingGoal) {
      return;
    }

    setEditGoalForm(buildGoalState(editingGoal));
  }, [editingGoal]);

  const goalsQuery = useQuery({
    queryKey: ["manager-goals", managerId],
    queryFn: () => api.get<Goal[]>(`/goals/team/${managerId}`),
    enabled: Boolean(managerId)
  });

  const createGoalMutation = useMutation({
    mutationFn: () =>
      api.post<Goal>("/goals", {
        employeeId: goalForm.employeeId,
        title: goalForm.title,
        description: goalForm.description,
        dueDate: new Date(`${goalForm.dueDate}T09:00:00`).toISOString(),
        progress: Number(goalForm.progress),
        status: goalForm.status,
        type: goalForm.type
      }),
    onSuccess: () => {
      setGoalForm((current) => ({
        ...defaultGoalForm,
        employeeId: current.employeeId
      }));
      void queryClient.invalidateQueries({ queryKey: ["manager-goals"] });
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: () => {
      if (!editingGoal) {
        throw new Error("No goal selected");
      }

      return api.patch<Goal>(`/goals/${editingGoal.id}`, {
        employeeId: editGoalForm.employeeId,
        title: editGoalForm.title,
        description: editGoalForm.description,
        dueDate: new Date(`${editGoalForm.dueDate}T09:00:00`).toISOString(),
        progress: Number(editGoalForm.progress),
        status: editGoalForm.status,
        type: editGoalForm.type
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["manager-goals"] });
    }
  });

  const createReviewCycleMutation = useMutation({
    mutationFn: () =>
      api.post("/reviews/cycle", {
        name: reviewCycleForm.name,
        type: reviewCycleForm.type,
        startDate: new Date(`${reviewCycleForm.startDate}T09:00:00`).toISOString(),
        endDate: new Date(`${reviewCycleForm.endDate}T09:00:00`).toISOString()
      }),
    onSuccess: () => {
      setReviewCycleForm(defaultReviewCycleForm);
    }
  });

  function handleGoalCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createGoalMutation.mutate();
  }

  function handleGoalUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateGoalMutation.mutate();
  }

  function handleReviewCycleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createReviewCycleMutation.mutate();
  }

  return (
    <section className="page-grid">
      <PageHeader
        title="Performance Hub"
        description="Manage goals and review-cycle setup from the same page used to inspect team progress."
        action={
          <label className="inline-filter">
            Team manager
            <select value={managerId} onChange={(event) => setManagerId(event.target.value)}>
              <option value="">Select a manager</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          </label>
        }
      />

      <div className="two-column-grid">
        <article className="panel">
          <h3>Create Goal</h3>
          <form className="form-grid" onSubmit={handleGoalCreate}>
            <div className="field-grid">
              <label>
                Employee
                <select
                  required
                  value={goalForm.employeeId}
                  onChange={(event) =>
                    setGoalForm((current) => ({ ...current, employeeId: event.target.value }))
                  }
                >
                  <option value="">Select an employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Goal type
                <select
                  value={goalForm.type}
                  onChange={(event) =>
                    setGoalForm((current) => ({
                      ...current,
                      type: event.target.value as GoalType
                    }))
                  }
                >
                  {goalTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Goal title
              <input
                required
                value={goalForm.title}
                onChange={(event) =>
                  setGoalForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>

            <label>
              Description
              <textarea
                required
                rows={5}
                value={goalForm.description}
                onChange={(event) =>
                  setGoalForm((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
              />
            </label>

            <div className="field-grid">
              <label>
                Due date
                <input
                  required
                  type="date"
                  value={goalForm.dueDate}
                  onChange={(event) =>
                    setGoalForm((current) => ({ ...current, dueDate: event.target.value }))
                  }
                />
              </label>
              <label>
                Progress
                <input
                  max={100}
                  min={0}
                  type="number"
                  value={goalForm.progress}
                  onChange={(event) =>
                    setGoalForm((current) => ({
                      ...current,
                      progress: Number(event.target.value)
                    }))
                  }
                />
              </label>
            </div>

            <label>
              Status
              <select
                value={goalForm.status}
                onChange={(event) =>
                  setGoalForm((current) => ({
                    ...current,
                    status: event.target.value as GoalStatus
                  }))
                }
              >
                {goalStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            {createGoalMutation.error ? (
              <p className="error-text">
                {createGoalMutation.error instanceof Error
                  ? createGoalMutation.error.message
                  : "Unable to create goal"}
              </p>
            ) : null}

            <div className="toolbar-row">
              <button className="primary-button" disabled={createGoalMutation.isPending} type="submit">
                {createGoalMutation.isPending ? "Creating..." : "Create goal"}
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <h3>Create Review Cycle</h3>
          <form className="form-grid" onSubmit={handleReviewCycleCreate}>
            <label>
              Cycle name
              <input
                required
                value={reviewCycleForm.name}
                onChange={(event) =>
                  setReviewCycleForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <div className="field-grid">
              <label>
                Type
                <select
                  value={reviewCycleForm.type}
                  onChange={(event) =>
                    setReviewCycleForm((current) => ({
                      ...current,
                      type: event.target.value as "MID_YEAR" | "ANNUAL"
                    }))
                  }
                >
                  <option value="MID_YEAR">MID_YEAR</option>
                  <option value="ANNUAL">ANNUAL</option>
                </select>
              </label>
              <label>
                Start date
                <input
                  required
                  type="date"
                  value={reviewCycleForm.startDate}
                  onChange={(event) =>
                    setReviewCycleForm((current) => ({
                      ...current,
                      startDate: event.target.value
                    }))
                  }
                />
              </label>
            </div>

            <label>
              End date
              <input
                required
                type="date"
                value={reviewCycleForm.endDate}
                onChange={(event) =>
                  setReviewCycleForm((current) => ({ ...current, endDate: event.target.value }))
                }
              />
            </label>

            {createReviewCycleMutation.error ? (
              <p className="error-text">
                {createReviewCycleMutation.error instanceof Error
                  ? createReviewCycleMutation.error.message
                  : "Unable to create review cycle"}
              </p>
            ) : null}

            <div className="toolbar-row">
              <button
                className="primary-button"
                disabled={createReviewCycleMutation.isPending}
                type="submit"
              >
                {createReviewCycleMutation.isPending ? "Creating..." : "Create review cycle"}
              </button>
            </div>
          </form>
        </article>
      </div>

      {editingGoal ? (
        <article className="panel">
          <div className="row-between">
            <div>
              <h3>Edit Goal</h3>
              <p className="muted-copy">{editingGoal.title}</p>
            </div>
            <button className="secondary-button" onClick={() => setEditingGoal(null)} type="button">
              Close
            </button>
          </div>

          <form className="form-grid" onSubmit={handleGoalUpdate}>
            <div className="field-grid">
              <label>
                Employee
                <select
                  value={editGoalForm.employeeId}
                  onChange={(event) =>
                    setEditGoalForm((current) => ({
                      ...current,
                      employeeId: event.target.value
                    }))
                  }
                >
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={editGoalForm.status}
                  onChange={(event) =>
                    setEditGoalForm((current) => ({
                      ...current,
                      status: event.target.value as GoalStatus
                    }))
                  }
                >
                  {goalStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Goal title
              <input
                value={editGoalForm.title}
                onChange={(event) =>
                  setEditGoalForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>

            <label>
              Description
              <textarea
                rows={5}
                value={editGoalForm.description}
                onChange={(event) =>
                  setEditGoalForm((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
              />
            </label>

            <div className="field-grid">
              <label>
                Due date
                <input
                  type="date"
                  value={editGoalForm.dueDate}
                  onChange={(event) =>
                    setEditGoalForm((current) => ({ ...current, dueDate: event.target.value }))
                  }
                />
              </label>
              <label>
                Progress
                <input
                  max={100}
                  min={0}
                  type="number"
                  value={editGoalForm.progress}
                  onChange={(event) =>
                    setEditGoalForm((current) => ({
                      ...current,
                      progress: Number(event.target.value)
                    }))
                  }
                />
              </label>
            </div>

            <label>
              Goal type
              <select
                value={editGoalForm.type}
                onChange={(event) =>
                  setEditGoalForm((current) => ({
                    ...current,
                    type: event.target.value as GoalType
                  }))
                }
              >
                {goalTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            {updateGoalMutation.error ? (
              <p className="error-text">
                {updateGoalMutation.error instanceof Error
                  ? updateGoalMutation.error.message
                  : "Unable to update goal"}
              </p>
            ) : null}

            <div className="toolbar-row">
              <button className="primary-button" disabled={updateGoalMutation.isPending} type="submit">
                {updateGoalMutation.isPending ? "Saving..." : "Save goal"}
              </button>
            </div>
          </form>
        </article>
      ) : null}

      <article className="panel">
        <h3>Manager Team Goals</h3>
        <div className="list-stack">
          {goalsQuery.data?.length ? (
            goalsQuery.data.map((goal) => (
              <div className="stack-card" key={goal.id}>
                <div className="row-between">
                  <div>
                    <strong>{goal.title}</strong>
                    <p className="muted-copy">
                      {goal.employee?.firstName} {goal.employee?.lastName}
                    </p>
                  </div>
                  <span className="status-pill">{goal.status}</span>
                </div>
                <p>{goal.description}</p>
                <div className="progress-rail">
                  <div className="progress-bar" style={{ width: `${goal.progress}%` }} />
                </div>
                <div className="row-between">
                  <span className="muted-copy">Due {goal.dueDate.slice(0, 10)}</span>
                  <button
                    className="secondary-button small-button"
                    onClick={() => setEditingGoal(goal)}
                    type="button"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="muted-copy">
              No manager-linked goals are available yet. Create one from this page to populate the
              performance view.
            </p>
          )}
        </div>
      </article>
    </section>
  );
}
