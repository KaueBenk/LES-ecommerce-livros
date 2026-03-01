/**
 * constants.js — Application-wide constants
 */

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CATALOG: '/catalog',
  PRODUCT: '/product/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDER_HISTORY: '/account/orders',
  ACCOUNT: '/account',
  CHANGE_PASSWORD: '/account/change-password',
  ADMIN: '/admin',
  NOT_FOUND: '*',
};

// Genders
export const GENDER_OPTIONS = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMININO', label: 'Feminino' },
  { value: 'OUTRO', label: 'Outro' },
];

// Phone types
export const PHONE_TYPES = [
  { value: 'CELULAR', label: 'Celular' },
  { value: 'FIXO', label: 'Fixo' },
];

// Address types
export const ADDRESS_TYPES = [
  { value: 'ENTREGA', label: 'Entrega' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'ENTREGA_E_FINANCEIRO', label: 'Entrega e Financeiro' },
];

// Residential types
export const RESIDENTIAL_TYPES = [
  { value: 'CASA', label: 'Casa' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'OUTRO', label: 'Outro' },
];

// Street types
export const STREET_TYPES = [
  { value: 'RUA', label: 'Rua' },
  { value: 'AVENIDA', label: 'Avenida' },
  { value: 'TRAVESSA', label: 'Travessa' },
  { value: 'ALAMEDA', label: 'Alameda' },
  { value: 'ESTRADA', label: 'Estrada' },
  { value: 'OUTRO', label: 'Outro' },
];

// Brazilian states
export const BRAZIL_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];

// Ranking levels
export const RANKING_LEVELS = {
  BRONZE: 'BRONZE',
  PRATA: 'PRATA',
  OURO: 'OURO',
  PLATINA: 'PLATINA',
};

// Order statuses
export const ORDER_STATUS = {
  AGUARDANDO_PAGAMENTO: 'AGUARDANDO_PAGAMENTO',
  APROVADO: 'APROVADO',
  EM_TRANSPORTE: 'EM_TRANSPORTE',
  ENTREGUE: 'ENTREGUE',
  CANCELADO: 'CANCELADO',
};

// LocalStorage keys
export const LS_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PROFILE: 'user_profile',
  CART_SESSION: 'cart_session',
  USER_PREFERENCES: 'user_preferences',
};

// Cart TTL in milliseconds
export const CART_TTL_MS = 30 * 60 * 1000; // 30 minutes
