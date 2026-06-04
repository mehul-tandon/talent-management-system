import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { EmptyState } from "../../components/empty-state";
import { PageHeader } from "../../components/page-header";
import { api } from "../../lib/api";
import type {
  Department,
  Employee,
  EmployeeStatus,
  Role
} from "../../types/api";

interface EmployeeFormState {
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  designation: string;
  departmentId: string;
  managerId: string;
  location: string;
  phone: string;
  hireDate: string;
  status: EmployeeStatus;
  skills: string;
}

interface EmployeeUpdateState {
  firstName: string;
  lastName: string;
  designation: string;
  departmentId: string;
  managerId: string;
  location: string;
  phone: string;
  status: EmployeeStatus;
  skills: string;
}

const roleOptions: Role[] = ["EMPLOYEE", "DEPT_MANAGER", "HR_MANAGER", "HR_ADMIN"];
const statusOptions: EmployeeStatus[] = ["ACTIVE", "ONBOARDING", "NOTICE_PERIOD", "INACTIVE"];

const defaultCreateState: EmployeeFormState = {
  email: "",
  role: "EMPLOYEE",
  firstName: "",
  lastName: "",
  designation: "",
  departmentId: "",
  managerId: "",
  location: "",
  phone: "",
  hireDate: "",
  status: "ONBOARDING",
  skills: ""
};

const defaultUpdateState: EmployeeUpdateState = {
  firstName: "",
  lastName: "",
  designation: "",
  departmentId: "",
  managerId: "",
  location: "",
  phone: "",
  status: "ONBOARDING",
  skills: ""
};

function toSkillArray(value: string) {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function buildUpdateState(employee: Employee): EmployeeUpdateState {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    designation: employee.designation,
    departmentId: employee.departmentId ?? employee.department?.id ?? "",
    managerId: employee.managerId ?? employee.manager?.id ?? "",
    location: employee.location ?? "",
    phone: employee.phone ?? "",
    status: employee.status,
    skills: employee.skills.join(", ")
  };
}

export function EmployeesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | EmployeeStatus>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [createForm, setCreateForm] = useState<EmployeeFormState>(defaultCreateState);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<EmployeeUpdateState>(defaultUpdateState);
  const [onboardingPassword, setOnboardingPassword] = useState<string | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get<Department[]>("/admin/departments")
  });

  const employeesQuery = useQuery({
    queryKey: ["employees", search, statusFilter, departmentFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        limit: "50"
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      if (departmentFilter) {
        params.set("departmentId", departmentFilter);
      }

      return api.getEnvelope<Employee[]>(`/employees?${params.toString()}`);
    }
  });

  const employees = employeesQuery.data?.data ?? [];
  const totalEmployees = Number(employeesQuery.data?.meta?.total ?? employees.length);

  useEffect(() => {
    if (!editingEmployee) {
      setEditForm(defaultUpdateState);
      return;
    }

    setEditForm(buildUpdateState(editingEmployee));
  }, [editingEmployee]);

  useEffect(() => {
    if (createForm.departmentId || !departmentsQuery.data?.length) {
      return;
    }

    setCreateForm((current) => ({
      ...current,
      departmentId: departmentsQuery.data?.[0]?.id ?? ""
    }));
  }, [createForm.departmentId, departmentsQuery.data]);

  const createEmployeeMutation = useMutation({
    mutationFn: () =>
      api.post<Employee & { onboarding?: { temporaryPassword?: string } }>("/employees", {
        email: createForm.email,
        role: createForm.role,
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        designation: createForm.designation,
        departmentId: createForm.departmentId,
        managerId: createForm.managerId || undefined,
        location: createForm.location || undefined,
        phone: createForm.phone || undefined,
        hireDate: createForm.hireDate
          ? new Date(`${createForm.hireDate}T09:00:00`).toISOString()
          : undefined,
        status: createForm.status,
        skills: toSkillArray(createForm.skills)
      }),
    onSuccess: (employee) => {
      setCreateForm((current) => ({
        ...defaultCreateState,
        departmentId: current.departmentId
      }));
      setOnboardingPassword(employee.onboarding?.temporaryPassword ?? null);
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: () => {
      if (!editingEmployee) {
        throw new Error("No employee selected");
      }

      return api.patch<Employee>(`/employees/${editingEmployee.id}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        designation: editForm.designation,
        departmentId: editForm.departmentId,
        managerId: editForm.managerId || null,
        location: editForm.location || null,
        phone: editForm.phone || null,
        status: editForm.status,
        skills: toSkillArray(editForm.skills)
      });
    },
    onSuccess: (employee) => {
      setEditingEmployee(employee);
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
    }
  });

  function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOnboardingPassword(null);
    createEmployeeMutation.mutate();
  }

  function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateEmployeeMutation.mutate();
  }

  return (
    <section className="page-grid">
      <PageHeader
        title="Employee Directory"
        description="Operate employee onboarding and profile changes from the same workspace used for search and reporting."
        action={<div className="chip-badge">{totalEmployees} employees</div>}
      />

      <div className="two-column-grid">
        <article className="panel">
          <h3>Filters</h3>
          <form className="form-grid">
            <label>
              Search
              <input
                placeholder="Name, code, designation"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="field-grid">
              <label>
                Status
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as "ALL" | EmployeeStatus)
                  }
                >
                  <option value="ALL">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Department
                <select
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                >
                  <option value="">All departments</option>
                  {departmentsQuery.data?.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </form>
        </article>

        <article className="panel">
          <h3>Create Employee</h3>
          <form className="form-grid" onSubmit={handleCreateSubmit}>
            <div className="field-grid">
              <label>
                First name
                <input
                  required
                  value={createForm.firstName}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                />
              </label>
              <label>
                Last name
                <input
                  required
                  value={createForm.lastName}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, lastName: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="field-grid">
              <label>
                Email
                <input
                  required
                  type="email"
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <label>
                Role
                <select
                  value={createForm.role}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      role: event.target.value as Role
                    }))
                  }
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-grid">
              <label>
                Department
                <select
                  required
                  value={createForm.departmentId}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      departmentId: event.target.value
                    }))
                  }
                >
                  <option value="">Select a department</option>
                  {departmentsQuery.data?.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Designation
                <input
                  required
                  value={createForm.designation}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      designation: event.target.value
                    }))
                  }
                />
              </label>
            </div>

            <div className="field-grid">
              <label>
                Hire date
                <input
                  type="date"
                  value={createForm.hireDate}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, hireDate: event.target.value }))
                  }
                />
              </label>
              <label>
                Manager
                <select
                  value={createForm.managerId}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, managerId: event.target.value }))
                  }
                >
                  <option value="">No manager</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-grid">
              <label>
                Status
                <select
                  value={createForm.status}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      status: event.target.value as EmployeeStatus
                    }))
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Phone
                <input
                  value={createForm.phone}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
            </div>

            <label>
              Location
              <input
                value={createForm.location}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, location: event.target.value }))
                }
              />
            </label>

            <label>
              Skills
              <input
                placeholder="React, Hiring, Payroll"
                value={createForm.skills}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, skills: event.target.value }))
                }
              />
            </label>

            {createEmployeeMutation.error ? (
              <p className="error-text">
                {createEmployeeMutation.error instanceof Error
                  ? createEmployeeMutation.error.message
                  : "Unable to create employee"}
              </p>
            ) : null}

            {onboardingPassword ? (
              <p className="success-text">
                Employee created. Temporary password: <strong>{onboardingPassword}</strong>
              </p>
            ) : null}

            <div className="toolbar-row">
              <button className="primary-button" disabled={createEmployeeMutation.isPending} type="submit">
                {createEmployeeMutation.isPending ? "Creating..." : "Create employee"}
              </button>
            </div>
          </form>
        </article>
      </div>

      {editingEmployee ? (
        <article className="panel">
          <div className="row-between">
            <div>
              <h3>Edit Employee</h3>
              <p className="muted-copy">
                Updating {editingEmployee.firstName} {editingEmployee.lastName}
              </p>
            </div>
            <button
              className="secondary-button"
              onClick={() => setEditingEmployee(null)}
              type="button"
            >
              Close
            </button>
          </div>

          <form className="form-grid" onSubmit={handleUpdateSubmit}>
            <div className="field-grid">
              <label>
                First name
                <input
                  required
                  value={editForm.firstName}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                />
              </label>
              <label>
                Last name
                <input
                  required
                  value={editForm.lastName}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, lastName: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="field-grid">
              <label>
                Department
                <select
                  value={editForm.departmentId}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      departmentId: event.target.value
                    }))
                  }
                >
                  {departmentsQuery.data?.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Designation
                <input
                  required
                  value={editForm.designation}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      designation: event.target.value
                    }))
                  }
                />
              </label>
            </div>

            <div className="field-grid">
              <label>
                Manager
                <select
                  value={editForm.managerId}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, managerId: event.target.value }))
                  }
                >
                  <option value="">No manager</option>
                  {employees
                    .filter((employee) => employee.id !== editingEmployee.id)
                    .map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={editForm.status}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      status: event.target.value as EmployeeStatus
                    }))
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-grid">
              <label>
                Phone
                <input
                  value={editForm.phone}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
              <label>
                Location
                <input
                  value={editForm.location}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, location: event.target.value }))
                  }
                />
              </label>
            </div>

            <label>
              Skills
              <input
                value={editForm.skills}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, skills: event.target.value }))
                }
              />
            </label>

            {updateEmployeeMutation.error ? (
              <p className="error-text">
                {updateEmployeeMutation.error instanceof Error
                  ? updateEmployeeMutation.error.message
                  : "Unable to update employee"}
              </p>
            ) : null}

            <div className="toolbar-row">
              <button className="primary-button" disabled={updateEmployeeMutation.isPending} type="submit">
                {updateEmployeeMutation.isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </article>
      ) : null}

      {employeesQuery.isLoading ? <div className="panel">Loading employees...</div> : null}

      {!employeesQuery.isLoading && employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Adjust the filters or create the first employee from this page."
        />
      ) : null}

      <div className="table-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Status</th>
              <th>Skills</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>
                  <strong>
                    {employee.firstName} {employee.lastName}
                  </strong>
                  <div className="table-subcopy">{employee.user?.email}</div>
                </td>
                <td>{employee.empCode}</td>
                <td>{employee.department?.name ?? "--"}</td>
                <td>{employee.designation}</td>
                <td>
                  <span className="status-pill">{employee.status}</span>
                </td>
                <td>{employee.skills.join(", ") || "--"}</td>
                <td>
                  <button
                    className="secondary-button small-button"
                    onClick={() => setEditingEmployee(employee)}
                    type="button"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
