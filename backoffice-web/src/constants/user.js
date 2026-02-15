export const USER_STATUS = {
  ACTIVE: { label: '활성', color: '#28A745' },
  INACTIVE: { label: '비활성', color: '#6C757D' },
};

export const USER_ROLE = {
  HQ_ADMIN: { label: '본사 관리자', color: '#1D4ED8' },
  STORE_ADMIN: { label: '매장 관리자', color: '#0F766E' },
  STORE_HALL_STAFF: { label: '홀 스태프', color: '#7C3AED' },
  STORE_KITCHEN_STAFF: { label: '주방 스태프', color: '#B45309' },
};

export const USER_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'ACTIVE', label: USER_STATUS.ACTIVE.label },
  { value: 'INACTIVE', label: USER_STATUS.INACTIVE.label },
];

export const USER_ROLE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'HQ_ADMIN', label: USER_ROLE.HQ_ADMIN.label },
  { value: 'STORE_ADMIN', label: USER_ROLE.STORE_ADMIN.label },
  { value: 'STORE_HALL_STAFF', label: USER_ROLE.STORE_HALL_STAFF.label },
  { value: 'STORE_KITCHEN_STAFF', label: USER_ROLE.STORE_KITCHEN_STAFF.label },
];

export const USER_ROLE_FORM_OPTIONS = USER_ROLE_OPTIONS.filter(option => option.value);
