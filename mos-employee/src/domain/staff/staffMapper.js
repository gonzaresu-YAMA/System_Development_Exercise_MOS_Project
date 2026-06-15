export const ROLE_LABEL = {
  manager: '店長',
  employee: '社員',
  partTime: 'アルバイト',
}

export const ROLE_OPTIONS = [
  { value: 'manager', label: '店長' },
  { value: 'employee', label: '社員' },
  { value: 'partTime', label: 'アルバイト' },
]

export const USECASE_LABEL = {
  hall: 'ホール',
  kitchen: '厨房',
  admin: '業務',
}

export function getRoleLabel(role) {
  return ROLE_LABEL[role] || role
}

export function getUseCaseLabel(useCase) {
  return USECASE_LABEL[useCase] || useCase
}
