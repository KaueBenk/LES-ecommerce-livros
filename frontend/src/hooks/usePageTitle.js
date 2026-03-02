import { useEffect } from 'react';

const APP_TITLE = 'LES Livraria';

/**
 * usePageTitle — Sets the document title.
 * @param {string} title - Page-specific title.
 */
const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_TITLE}` : APP_TITLE;
    return () => {
      document.title = APP_TITLE;
    };
  }, [title]);
};

export default usePageTitle;
