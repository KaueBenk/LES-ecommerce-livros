# Testing Demo Mode

## How to Test the Demo Mode

### 1. Start the Dev Server
```bash
cd frontend
npm run dev:demo
```

The server will start on http://localhost:5173

### 2. Expected Behavior

When you access the application:
- You should be **automatically logged in as admin**
- No login page should be required
- The interface should load normally

### 3. What Data Should Show

#### Admin Panel (`/admin`)
- Books list with 6 mockbooks
- Orders list with 2 mock orders
- Analytics dashboard with mock data
- All admin features accessible

#### Catalog (`/catalog`)
- 6 books displayed with full details
- Search should work
- Pagination should work

#### Other Features
- Cart functionality should work
- Profile editing should work
- Order history should show mock orders

### 4. Console Logs

Open the browser's Developer Console (F12) and look for:
- `[DEMO MODE] Intercepting: GET /api/v1/admin/livros` - indicates the interceptor is working
- `[DEMO MODE] Intercepting: GET /api/v1/livros` - for catalog requests

### 5. Network Tab

In Developer Tools, Network tab:
- API requests will show as if they're going to `/api/v1/...`
- Responses will contain mock data
- No actual network errors should appear

### 6. Testing Checklist

- [ ] Page loads without login
- [ ] Home page displays books
- [ ] Catalog page loads with 6 books
- [ ] Admin dashboard shows data
- [ ] Orders page shows mock orders
- [ ] Cart functionality works
- [ ] Product details load
- [ ] Reviews section shows mock reviews

### 7. If Something Is Not Working

Check:
1. Browser console for errors
2. Vite dev server terminal for logs
3. Verify `VITE_DEMO_MODE=true` is set (check .env.local)
4. Clear browser cache and reload

### 8. Debugging

To see more detail, add this to your browser console:
```javascript
// Check if demo mode is enabled
import.meta.env.VITE_DEMO_MODE
```

Check the Network tab for actual API responses.

---

## Implementation Details

The demo mode works by:
1. Reading `VITE_DEMO_MODE` environment variable
2. Intercepting all axios responses in `src/services/demoInterceptor.js`
3. Returning mock data from `src/services/mockData.js`
4. Auto-logging in the user as admin in `src/store/authContext.jsx`
5. Bypassing auth checks in `src/components/auth/ProtectedRoute.jsx`

All mock data is served from the frontend - no backend API is required.
