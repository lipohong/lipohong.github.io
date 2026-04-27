---
title: "TOTP Series Part 7: The Partial Authentication Pattern, React Router Guards, and Axios Interceptors | TOTP 系列之七：部分驗證模式、React Router 守衛與 Axios 攔截器"
date: 2026-04-27 13:00:00 +0800
categories: [Frontend, TOTP Series]
tags: [totp, frontend, react, react-router, axios, security, authentication, session-storage, assisted_by_ai]
toc: true
---

## The Conundrum of "Half-Logged-In"

Implementing Two-Factor Authentication introduces a profound architectural disruption to traditional web application routing. In a standard Single-Factor Authentication (SFA) application, the flow is binary:
1. The user submits a valid password.
2. The backend responds with a 200 OK and a JWT (or sets an HttpOnly session cookie).
3. The frontend routes the user to the secure dashboard.

However, with 2FA, the flow fractures into a three-step dance. When the user successfully submits their password, the backend recognizes that the user has 2FA enabled. The backend cannot grant full access yet, but it also cannot return a 401 Unauthorized, because the user *did* provide the correct password. 

The user enters a liminal state—a "Partial Authentication" phase. They are no longer unauthenticated, but they are not yet fully authorized. 

This liminal state creates several massive headaches for frontend engineering:
- **Where do we route the user?** We must forcefully redirect them to a `/verify-2fa` page.
- **How do we prove they passed the first factor?** If they refresh the `/verify-2fa` page, how does the frontend remember that they already passed the password check?
- **How do we prevent bypasses?** A malicious user could try to manually type `/dashboard` into the URL bar while in this partial state. The router must block them.
- **How do we remember their original destination?** If they clicked a deep link (e.g., `/invoices/123`), got redirected to login, then redirected to 2FA, we must successfully route them back to `/invoices/123` after they finally provide the 6-digit code.

In this deep dive, we will architect a robust, battle-tested solution for the Partial Authentication pattern using React Router v6 and Axios Interceptors. We will explore the critical security differences between `sessionStorage` and `localStorage`, and we will build airtight Route Guards to ensure our frontend is as secure as our backend.

---

## Deep Dive: Storage Mechanisms for Temporary Tokens

When the backend acknowledges a correct password but requires a TOTP code, it must return a **Temporary Token** (or a Partial JWT). The frontend must store this token to send it back alongside the 6-digit code in the final verification request. 

Where should the frontend store this temporary token?

1. **Memory (React State/Zustand/Redux):** 
   - *Pros:* Extremely secure against XSS. 
   - *Cons:* If the user accidentally hits F5 to refresh the page on the 2FA screen, the memory is wiped. They are thrown all the way back to the password screen. This is terrible UX.
2. **`localStorage`:**
   - *Pros:* Survives page refreshes and tab closures.
   - *Cons:* It survives FOREVER until explicitly deleted. If a user logs in on a public library computer, gets to the 2FA screen, realizes they forgot their phone, and simply closes the tab, the Temporary Token remains permanently stored in `localStorage`. The next person to use that computer can extract the token and bypass the password phase!
3. **`sessionStorage`:**
   - *Pros:* Survives page refreshes!
   - *Cons:* It is strictly bound to the specific browser tab. **If the user closes the tab, the OS instantly destroys the `sessionStorage`.**

**The Enterprise Standard:** For Temporary 2FA Tokens, `sessionStorage` is the absolute gold standard. It perfectly balances the UX requirement of surviving a page refresh with the security requirement of volatile memory management.

---

## Architecture: The Axios Interceptor

To make our Partial Authentication flow seamless, we shouldn't clutter our login components with complex `if/else` logic checking for specific HTTP status codes. Instead, we use Axios Interceptors to globally catch the backend's "2FA Required" response.

Let's assume our backend responds with an HTTP `403 Forbidden` and a custom error code `ERR_2FA_REQUIRED` when a user needs to provide a TOTP.

```typescript
// src/api/axiosClient.ts
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, // For HttpOnly cookies
});

// A custom hook to initialize interceptors so we can use React Router's navigate
export const useSetupAxiosInterceptors = () => {
  const navigate = useNavigate();

  axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const originalRequest = error.config;

      // Check if the backend is explicitly demanding 2FA
      if (error.response?.status === 403 && error.response?.data?.code === 'ERR_2FA_REQUIRED') {
        
        // 1. Extract the Temporary Token from the response payload
        const temporaryToken = error.response.data.tempToken;
        
        // 2. Store it securely in sessionStorage
        sessionStorage.setItem('totp_temp_token', temporaryToken);

        // 3. Remember where they originally wanted to go
        // If they were logging in, maybe they came from a specific deep link
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/dashboard';
        sessionStorage.setItem('totp_return_url', returnUrl);

        // 4. Forcefully redirect them to the 2FA verification screen
        navigate('/verify-2fa', { replace: true });
        
        // Resolve the promise so the calling component doesn't crash with an unhandled exception
        return Promise.resolve({ data: { requires2FA: true } });
      }

      // Handle standard 401 Unauthorized (invalid password)
      if (error.response?.status === 401) {
        // Clear everything
        sessionStorage.removeItem('totp_temp_token');
        // Let the login component show the "Invalid Credentials" message
      }

      return Promise.reject(error);
    }
  );
};
```

---

## Implementation: The Route Guards

React Router v6 handles navigation, but it doesn't inherently understand security. We must wrap our routes in higher-order components (Guards) to enforce the state machine.

We have three distinct types of routes:
1. **Public Routes:** `/login`
2. **Liminal Routes:** `/verify-2fa` (Only accessible if you have a Temporary Token)
3. **Protected Routes:** `/dashboard` (Only accessible if you have a full JWT/Session Cookie)

### The Partial Auth Guard
This guard protects the `/verify-2fa` page. If a user tries to access this page directly without first passing the password check, they must be kicked out.

```tsx
// src/components/guards/PartialAuthGuard.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const PartialAuthGuard: React.FC = () => {
  const tempToken = sessionStorage.getItem('totp_temp_token');

  if (!tempToken) {
    // The user has no temporary token. They either haven't entered a password,
    // or their token expired, or they closed the tab and lost their session.
    // Kick them back to the start.
    return <Navigate to="/login" replace />;
  }

  // They have the token. Render the 2FA Input screen.
  return <Outlet />;
};
```

### The Full Protected Guard
This guard protects the dashboard. It must explicitly block users who are stuck in the Liminal State.

```tsx
// src/components/guards/ProtectedRouteGuard.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const ProtectedRouteGuard: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore(); // Checks for full JWT
  const hasTempToken = !!sessionStorage.getItem('totp_temp_token');

  // If they have a full JWT, they are fully authenticated
  if (isAuthenticated) {
    return <Outlet />;
  }

  // If they are NOT fully authenticated, but they DO have a temp token,
  // they are trying to bypass the 2FA screen. Force them back to it!
  if (hasTempToken) {
    return <Navigate to="/verify-2fa" replace />;
  }

  // They have nothing. Kick them to login, but save where they were trying to go.
  return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
};
```

---

## The Verification Page: Closing the Loop

Now we construct the actual `/verify-2fa` React page. It utilizes the `TotpCodeInput` component we built in Part 6, sends the Temporary Token to the backend, and handles the final routing.

```tsx
// src/pages/VerifyTotpPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TotpCodeInput } from '../components/TotpCodeInput';
import { axiosClient } from '../api/axiosClient';
import { useAuthStore } from '../store/useAuthStore';

export const VerifyTotpPage: React.FC = () => {
  const navigate = useNavigate();
  const { setFullyAuthenticated } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerification = async (totpCode: string) => {
    setErrorMsg(null);
    const tempToken = sessionStorage.getItem('totp_temp_token');

    try {
      // Send BOTH the Temporary Token and the user's 6-digit code
      const response = await axiosClient.post('/auth/totp/verify', {
        tempToken,
        totpCode
      });

      // 1. Backend verifies the code and issues the full JWT/Session Cookie
      
      // 2. We MUST destroy the temporary token so it cannot be abused
      sessionStorage.removeItem('totp_temp_token');
      
      // 3. Update our global frontend state
      setFullyAuthenticated(response.data.user);

      // 4. Determine where to route them next
      const returnUrl = sessionStorage.getItem('totp_return_url') || '/dashboard';
      sessionStorage.removeItem('totp_return_url'); // Clean up

      // 5. Route them!
      navigate(returnUrl, { replace: true });

    } catch (error: any) {
      // Use explicit error boundaries based on HTTP status codes
      if (error.response?.status === 400) {
        setErrorMsg('Invalid 2FA Code. Please try again.');
      } else if (error.response?.status === 401) {
        // The Temp Token itself expired! (e.g., took longer than 5 mins to find phone)
        sessionStorage.removeItem('totp_temp_token');
        navigate('/login?error=session_expired', { replace: true });
      } else {
        setErrorMsg('A server error occurred. Please contact support.');
      }
    }
  };

  return (
    <div className="verify-page-container">
      <h1>Two-Factor Authentication</h1>
      <p>Please open your authenticator app and enter the 6-digit code.</p>
      
      <TotpCodeInput 
        length={6} 
        onComplete={handleVerification} 
        errorMsg={errorMsg} 
        autoFocus={true} 
      />
    </div>
  );
};
```

By strictly managing the Temporary Token in `sessionStorage` and establishing airtight React Router Guards, we create a frontend application that is logically impossible to bypass, while maintaining a perfectly seamless user experience.

---

## 解決「半登入」狀態嘅巨大難題

喺一個系統度加入雙重認證 (2FA)，會對傳統 Web Application 嘅 Routing (路由) 架構帶嚟極大嘅顛覆。喺標準嘅單一因素驗證 (SFA) 系統入面，個流程係二元 (Binary) 嘅：
1. 用戶 Submit 一個正確嘅密碼。
2. Backend 回應一個 200 OK 同埋一條 JWT (或者 Set 一粒 HttpOnly 嘅 Session cookie)。
3. Frontend 將用戶 Route (導航) 入去受保護嘅 Dashboard。

但係，加咗 2FA 之後，個流程就會碎裂成一個「三步曲」。當用戶成功 Submit 咗正確嘅密碼，Backend 認得個用戶係開咗 2FA 嘅。Backend 未能夠批出完整權限，但同時又唔可以 return 一個 `401 Unauthorized`，因為用戶 *的而且確* 提供咗正確嘅密碼。

用戶會進入一個過渡狀態——一個「部分驗證 (Partial Authentication)」嘅階段。佢哋已經唔再係「未登入」，但又仲未算「完全授權」。

呢個過渡狀態為 Frontend 開發帶嚟幾個極大嘅頭痛位：
- **我哋要 Route 個用戶去邊？** 我哋必須要強行將佢哋 Redirect 去一個 `/verify-2fa` 嘅版面。
- **點樣證明佢哋已經過咗第一關？** 如果佢哋喺 `/verify-2fa` 嗰一頁撳咗 F5 Refresh，Frontend 點樣記住佢哋頭先已經入啱咗密碼？
- **點樣防止 Bypass (繞過)？** 一個心懷不軌嘅用戶，可以趁自己處於呢個過渡狀態嗰陣，手動喺 URL Bar 度打 `/dashboard` 嘗試強行進入。Router 必須要識得 Block 住佢哋。
- **點樣記住佢哋原本想去邊？** 如果佢哋本來係 Click 一條 Deep link (例如 `/invoices/123`)，然後俾系統 Redirect 去 Login，再 Redirect 去 2FA。當佢哋終於入完嗰 6 位數 Code 之後，我哋必須要識得完美將佢哋 Route 返去 `/invoices/123`。

喺呢篇極度深入嘅探討入面，我哋會運用 React Router v6 同埋 Axios Interceptors，構建一個無堅不摧、身經百戰嘅「部分驗證」解決方案。我哋會研究 `sessionStorage` 同 `localStorage` 喺安全級別上嘅關鍵差異，並且打造滴水不漏嘅 Route Guards (路由守衛)，確保我哋嘅 Frontend 同 Backend 一樣咁安全可靠。

---

## 深度探討：暫時性 Token 嘅儲存機制

當 Backend 確認密碼正確但要求 2FA Code 嗰陣，佢必須要 return 一條 **暫時性 Token (Temporary Token)** (或者叫 Partial JWT)。Frontend 必須要裝住呢條 Token，等遲啲同個 6 位數 Code 一齊 Send 返去 Backend 做終極驗證。

Frontend 應該將呢條暫時性 Token 收埋喺邊？

1. **Memory (React State/Zustand/Redux):** 
   - *優點:* 對抗 XSS 攻擊極度安全。
   - *缺點:* 如果用戶喺 2FA 畫面唔小心撳咗 F5 Refresh，Memory 會瞬間被清空。佢哋會被無情地踢返去密碼畫面重新入過。呢種 UX (用戶體驗) 係垃圾級別嘅。
2. **`localStorage`:**
   - *優點:* 就算 Refresh 甚至山咗個 Browser tab 都依然健在。
   - *缺點:* 佢會 **永遠** 健在，直到你寫 code explicitly 刪除佢為止。如果一個用戶喺公共圖書館部電腦登入，去到 2FA 畫面先發現唔記得帶電話，然後就咁山咗個 Tab 走人。條 Temporary Token 會永久留喺部機嘅 `localStorage` 度。下一個用嗰部電腦嘅人，就可以輕易抽出條 Token，完美 Bypass 咗密碼嗰一關！
3. **`sessionStorage`:**
   - *優點:* 完美應付 Page refreshes！
   - *缺點:* 佢嘅生命週期嚴格綁定喺特定嘅 Browser tab。**如果用戶山咗個 Tab，OS 會瞬間摧毀成個 `sessionStorage`。**

**企業級 Standard:** 對於暫時性 2FA Token 來講，`sessionStorage` 係絕對嘅黃金標準。佢完美平衡咗「容許 Refresh」嘅 UX 需求，同埋「揮發性記憶體管理」嘅保安要求。

---

## 架構設計：Axios 攔截器 (The Axios Interceptor)

為咗令「部分驗證」流程變得絲滑流暢，我哋唔應該將一堆用嚟 Check 特定 HTTP Status Code 嘅複雜 `if/else` 邏輯塞晒落個 Login component 度。相反，我哋應該用 Axios Interceptors，喺 Global (全局) 層面捕捉 Backend 掟過來嘅「需要 2FA」回應。

假設我哋嘅 Backend，當遇到用戶需要提供 TOTP 嗰陣，會 return 一個 HTTP `403 Forbidden`，附帶一個 Custom error code `ERR_2FA_REQUIRED`。

```typescript
// src/api/axiosClient.ts
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, // 用嚟食 HttpOnly cookies
});

// 寫一個 Custom hook 來初始化 Interceptors，咁我哋先可以 Call 到 React Router 嘅 navigate
export const useSetupAxiosInterceptors = () => {
  const navigate = useNavigate();

  axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const originalRequest = error.config;

      // 檢查 Backend 係咪明確要求緊 2FA
      if (error.response?.status === 403 && error.response?.data?.code === 'ERR_2FA_REQUIRED') {
        
        // 1. 由 Response payload 抽出條 Temporary Token
        const temporaryToken = error.response.data.tempToken;
        
        // 2. 非常安全咁將佢儲存落 sessionStorage
        sessionStorage.setItem('totp_temp_token', temporaryToken);

        // 3. 記住用戶原本想去邊
        // 如果佢哋係 Login 緊，可能佢哋係由一條特定嘅 Deep link 彈過來嘅
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/dashboard';
        sessionStorage.setItem('totp_return_url', returnUrl);

        // 4. 強制 Redirect 佢哋去 2FA 驗證畫面
        navigate('/verify-2fa', { replace: true });
        
        // Resolve 咗個 Promise，等 Call API 嗰個 Component 唔會因為 Unhandled exception 而 Crash
        return Promise.resolve({ data: { requires2FA: true } });
      }

      // 處理標準嘅 401 Unauthorized (例如密碼打錯)
      if (error.response?.status === 401) {
        // 清洗乾淨所有嘢
        sessionStorage.removeItem('totp_temp_token');
        // 由得個 Login component 自己彈句「登入憑證錯誤」嘅字出來
      }

      return Promise.reject(error);
    }
  );
};
```

---

## 實踐：路由守衛 (The Route Guards)

React Router v6 負責 Navigation，但佢本身係冇任何保安概念嘅。我哋必須將啲 Routes 包裝喺高階組件 (Higher-Order Components，即係 Guards) 入面，去強制執行我哋個 State machine。

我哋有三種截然不同嘅 Routes：
1. **公開路由 (Public Routes):** `/login`
2. **過渡路由 (Liminal Routes):** `/verify-2fa` (只有當你手揸 Temporary Token 先入得)
3. **受保護路由 (Protected Routes):** `/dashboard` (只有當你手揸完整 JWT/Session Cookie 先入得)

### 部分驗證守衛 (The Partial Auth Guard)
呢個 Guard 負責保護 `/verify-2fa` 頁面。如果一個用戶完全未入密碼就想直接跳入去呢頁，必須即刻將佢踢走。

```tsx
// src/components/guards/PartialAuthGuard.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const PartialAuthGuard: React.FC = () => {
  const tempToken = sessionStorage.getItem('totp_temp_token');

  if (!tempToken) {
    // 該用戶冇暫時性 Token。即係佢哋一係未入密碼，
    // 一係 Token 已經過期，一係佢哋山過個 Tab 搞到 Session 冇咗。
    // 一腳踢佢返起點。
    return <Navigate to="/login" replace />;
  }

  // 佢哋有 Token。放行，Render 個 2FA Input 畫面。
  return <Outlet />;
};
```

### 全面受保護守衛 (The Full Protected Guard)
呢個 Guard 負責保護 Dashboard。佢必須要明確地 Block 住嗰啲卡咗喺過渡狀態 (Liminal State) 嘅用戶。

```tsx
// src/components/guards/ProtectedRouteGuard.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const ProtectedRouteGuard: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore(); // 檢查有冇完整嘅 JWT
  const hasTempToken = !!sessionStorage.getItem('totp_temp_token');

  // 如果有完整 JWT，代表佢哋已經「完全登入」
  if (isAuthenticated) {
    return <Outlet />;
  }

  // 如果佢哋「未完全登入」，但「有」暫時性 Token，
  // 代表佢哋嘗試偷雞 Bypass 個 2FA 畫面。強行挾持佢哋返去！
  if (hasTempToken) {
    return <Navigate to="/verify-2fa" replace />;
  }

  // 佢哋乜都冇。踢佢哋去 Login，但要記低佢哋原本想去邊。
  return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
};
```

---

## 終極驗證頁面：完美閉環 (Closing the Loop)

而家我哋可以砌出真正嘅 `/verify-2fa` React page 啦。佢會用到我哋喺 Part 6 整嗰個 `TotpCodeInput` component，將 Temporary Token 掟去 Backend，然後處理終極嘅 Routing。

```tsx
// src/pages/VerifyTotpPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TotpCodeInput } from '../components/TotpCodeInput';
import { axiosClient } from '../api/axiosClient';
import { useAuthStore } from '../store/useAuthStore';

export const VerifyTotpPage: React.FC = () => {
  const navigate = useNavigate();
  const { setFullyAuthenticated } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerification = async (totpCode: string) => {
    setErrorMsg(null);
    const tempToken = sessionStorage.getItem('totp_temp_token');

    try {
      // 必須同時 Send 條 Temporary Token 同埋用戶打嗰 6 位數字
      const response = await axiosClient.post('/auth/totp/verify', {
        tempToken,
        totpCode
      });

      // 1. Backend 驗證成功，批出完整嘅 JWT / Session Cookie
      
      // 2. 我哋【必須】摧毀條 Temporary Token，以防被濫用
      sessionStorage.removeItem('totp_temp_token');
      
      // 3. 更新 Frontend 全局狀態
      setFullyAuthenticated(response.data.user);

      // 4. 決定下一個目的地
      const returnUrl = sessionStorage.getItem('totp_return_url') || '/dashboard';
      sessionStorage.removeItem('totp_return_url'); // 執下手尾

      // 5. 正式導航！
      navigate(returnUrl, { replace: true });

    } catch (error: any) {
      // 根據唔同嘅 HTTP Status code 提供精準嘅 Error handling
      if (error.response?.status === 400) {
        setErrorMsg('2FA 驗證碼錯誤，請再試一次。');
      } else if (error.response?.status === 401) {
        // 連條 Temp Token 本身都過期咗！(例如用戶搵部電話搵咗超過 5 分鐘)
        sessionStorage.removeItem('totp_temp_token');
        navigate('/login?error=session_expired', { replace: true });
      } else {
        setErrorMsg('伺服器發生未知錯誤，請聯絡 IT 支援。');
      }
    }
  };

  return (
    <div className="verify-page-container">
      <h1>雙重認證 (2FA)</h1>
      <p>請打開你手機嘅 Authenticator App，然後輸入 6 位數字驗證碼。</p>
      
      <TotpCodeInput 
        length={6} 
        onComplete={handleVerification} 
        errorMsg={errorMsg} 
        autoFocus={true} 
      />
    </div>
  );
};
```

透過嚴格利用 `sessionStorage` 嚟管理暫時性 Token，同埋建立滴水不漏嘅 React Router Guards，我哋創造出一個邏輯上完全冇辦法 Bypass 嘅 Frontend Application，同時維持住完美、絲滑嘅最高級別用戶體驗！
