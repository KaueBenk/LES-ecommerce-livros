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
  ORDER_CONFIRMATION: '/order-confirmation',
  ORDER_HISTORY: '/account/orders',
  ACCOUNT: '/account',
  ADDRESSES: '/account/addresses',
  CREDIT_CARDS: '/account/credit-cards',
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
  { value: 'COBRANCA', label: 'Cobrança' },
  { value: 'AMBOS', label: 'Ambos' },
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

// Credit card brands
export const CREDIT_CARD_BRANDS = [
  { value: 'VISA', label: 'Visa', icon: '💳' },
  { value: 'MASTERCARD', label: 'Mastercard', icon: '💳' },
  { value: 'ELO', label: 'Elo', icon: '💳' },
  { value: 'AMEX', label: 'American Express', icon: '💳' },
  { value: 'HIPERCARD', label: 'Hipercard', icon: '💳' },
  { value: 'DINERS', label: 'Diners Club', icon: '💳' },
  { value: 'OUTRO', label: 'Outro', icon: '💳' },
];
