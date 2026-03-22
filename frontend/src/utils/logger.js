/**
 * Serviço centralizado de logging para o frontend.
 * Fornece interface estruturada para registrar operações, erros e eventos.
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Obtém contexto do usuário autenticado (se disponível)
 */
const getUserContext = () => {
  try {
    const userStr = localStorage.getItem('user_profile');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        userId: user.id,
        email: user.email,
        nome: user.nome,
        tipo: user.tipo
      };
    }
  } catch (error) {
    // Silencioso - não queremos erro em logging
  }
  return null;
};

/**
 * Formata timestamp para log
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Log de requisições HTTP
 */
const logRequest = (method, url, data = null) => {
  const user = getUserContext();
  const sanitizedData = sanitizeData(data);
  
  console.log(
    `%c[API-REQ] ${method.toUpperCase()} ${url}`,
    'color: #0066cc; font-weight: bold',
    {
      timestamp: getTimestamp(),
      method,
      url,
      data: sanitizedData,
      user: user?.email || 'anônimo'
    }
  );
};

/**
 * Log de respostas HTTP bem-sucedidas
 */
const logResponse = (method, url, status, duration = null) => {
  console.log(
    `%c[API-RES] ${method.toUpperCase()} ${url} - ${status}`,
    'color: #00aa00; font-weight: bold',
    {
      timestamp: getTimestamp(),
      method,
      url,
      status,
      duration: duration ? `${duration}ms` : null
    }
  );
};

/**
 * Log de erros HTTP
 */
const logError = (method, url, status, error, duration = null) => {
  const user = getUserContext();
  
  console.error(
    `%c[API-ERR] ${method?.toUpperCase() || 'REQUEST'} ${url || 'UNKNOWN'} - ${status || 'NETWORK_ERROR'}`,
    'color: #cc0000; font-weight: bold',
    {
      timestamp: getTimestamp(),
      method,
      url,
      status,
      error: error?.message || error,
      stack: isDevelopment ? error?.stack : undefined,
      duration: duration ? `${duration}ms` : null,
      user: user?.email || 'anônimo'
    }
  );
};

/**
 * Log de operações de autenticação
 */
const logAuth = (action, details = {}) => {
  const sanitizedDetails = { ...details };
  delete sanitizedDetails.senha;
  delete sanitizedDetails.password;
  delete sanitizedDetails.token;
  
  console.log(
    `%c[AUTH] ${action}`,
    'color: #9900cc; font-weight: bold',
    {
      timestamp: getTimestamp(),
      action,
      ...sanitizedDetails
    }
  );
};

/**
 * Log de operações do carrinho
 */
const logCart = (action, details = {}) => {
  const user = getUserContext();
  
  console.log(
    `%c[CART] ${action}`,
    'color: #ff6600; font-weight: bold',
    {
      timestamp: getTimestamp(),
      action,
      user: user?.email || 'anônimo',
      ...details
    }
  );
};

/**
 * Log de operações de checkout
 */
const logCheckout = (step, details = {}) => {
  const user = getUserContext();
  const sanitizedDetails = sanitizeData(details);
  
  console.log(
    `%c[CHECKOUT] ${step}`,
    'color: #cc00cc; font-weight: bold',
    {
      timestamp: getTimestamp(),
      step,
      user: user?.email || 'anônimo',
      ...sanitizedDetails
    }
  );
};

/**
 * Log de operações administrativas
 */
const logAdmin = (action, details = {}) => {
  const user = getUserContext();
  
  console.log(
    `%c[ADMIN] ${action}`,
    'color: #cc6600; font-weight: bold',
    {
      timestamp: getTimestamp(),
      action,
      admin: user?.email || 'unknown',
      ...details
    }
  );
};

/**
 * Log genérico de informação
 */
const logInfo = (category, message, details = {}) => {
  console.log(
    `%c[${category.toUpperCase()}] ${message}`,
    'color: #0099cc',
    {
      timestamp: getTimestamp(),
      ...details
    }
  );
};

/**
 * Log genérico de aviso
 */
const logWarn = (category, message, details = {}) => {
  console.warn(
    `%c[${category.toUpperCase()}] ${message}`,
    'color: #ff9900; font-weight: bold',
    {
      timestamp: getTimestamp(),
      ...details
    }
  );
};

/**
 * Log genérico de erro
 */
const logGenericError = (category, message, error = null, details = {}) => {
  console.error(
    `%c[${category.toUpperCase()}-ERR] ${message}`,
    'color: #cc0000; font-weight: bold',
    {
      timestamp: getTimestamp(),
      error: error?.message || error,
      stack: isDevelopment ? error?.stack : undefined,
      ...details
    }
  );
};

/**
 * Remove dados sensíveis antes de logar
 */
const sanitizeData = (data) => {
  if (!data) return data;
  
  const sensitive = ['senha', 'password', 'token', 'authorization', 'cvv', 'numeroCartao'];
  
  if (typeof data === 'object') {
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    for (const key in sanitized) {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '***';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  return data;
};

const logger = {
  logRequest,
  logResponse,
  logError,
  logAuth,
  logCart,
  logCheckout,
  logAdmin,
  logInfo,
  logWarn,
  logGenericError
};

export default logger;
