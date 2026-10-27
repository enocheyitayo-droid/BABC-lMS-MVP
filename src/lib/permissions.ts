export const roles = ["school_admin", "teacher", "bursar", "cashier", "expense_approver", "guardian"] as const;
export type Role = typeof roles[number];
export const roleLabels: Record<Role, string> = {
  school_admin: "School administrator", teacher: "Teacher", bursar: "Bursar",
  cashier: "Cashier", expense_approver: "Expense approver / auditor", guardian: "Parent / guardian",
};
export const permissions = ["school:configure", "staff:read", "admissions:manage", "attendance:record", "results:enter", "results:publish", "finance:manage", "payments:record", "expenses:approve", "children:read"] as const;
export type Permission = typeof permissions[number];
const grants: Record<Role, readonly Permission[]> = {
  school_admin: ["school:configure", "staff:read", "admissions:manage", "results:publish"],
  teacher: ["attendance:record", "results:enter", "results:publish"],
  bursar: ["finance:manage", "payments:record"],
  cashier: ["payments:record"],
  expense_approver: ["expenses:approve"],
  guardian: ["children:read"],
};
// Assignment and guardian-link checks must ALSO be enforced for record access.
export function can(role: Role, permission: Permission): boolean {
  return grants[role].includes(permission);
}
