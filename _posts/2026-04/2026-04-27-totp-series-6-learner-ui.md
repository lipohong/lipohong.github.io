---
title: "TOTP Series Part 6: The Ultimate React Code Input, UX Edge Cases, and DOM Ref Management | TOTP 系列之六：終極 React Code Input、UX 邊緣情況與 DOM Ref 管理"
date: 2026-04-27 12:30:00 +0800
categories: [Frontend, TOTP Series]
tags: [totp, frontend, react, ui, code-input, qrcode, user-experience, dom, typescript, assisted_by_ai]
toc: true
---

## The Hidden Complexity of a 6-Digit Code Input

When building the frontend interface for a Two-Factor Authentication (2FA) setup or verification gateway, backend developers transitioning to frontend tasks often severely underestimate the User Experience (UX) and User Interface (UI) challenges involved. 

Generating and displaying the Base32 QR code using the `otpauth://` URI is generally straightforward, thanks to robust libraries like `qrcode.react`. The true, often hair-pulling challenge lies in collecting the 6-digit TOTP code from the user in a way that feels professional, intuitive, and frictionless.

A naive, simplistic approach is to just drop a single standard `<input type="number" maxLength={6} />` onto the page. While this functionally works and sends a 6-digit string to the backend, it feels cheap, unprofessional, and provides poor visual affordance. It allows formatting inconsistencies (like the letter 'e' for exponents in some browsers), and it does not visually reinforce to the user that a fixed-length, 6-character code is expected.

Modern, premium applications—think Stripe, Apple, or major banking apps—use an array of six distinct, visually separated input boxes. When the user types a digit, the cursor automatically and instantaneously shifts focus to the next box.

Building this multi-box input component from scratch reveals a labyrinth of Edge Cases that frontend developers must manually intercept and handle via the DOM:
- **The Backspace Dilemma:** What happens if the user is in box 4, which is empty, and they press the Backspace key? The intuitive expectation is that the cursor should jump back to box 3 and delete its contents.
- **The Clipboard Paste Magic:** What if the user copies a 6-digit code from their authenticator app or an SMS? Without explicit `onPaste` handling, pasting will just dump all 6 digits into the single active box, truncating the rest. We must intercept the clipboard, parse the string, distribute the digits across the array, and focus the correct final box.
- **The Mid-String Deletion Shift:** What if they use the arrow keys to navigate back to box 2 and type a new number? Does it overwrite? Does it shift the rest of the array to the right?
- **Mobile Keyboard Quirks:** How do we force iOS Safari and Android Chrome to display the numeric keypad instead of the full QWERTY keyboard without causing validation bugs?

In this exhaustive deep dive, we will construct a production-ready, bulletproof `TotpCodeInput` React component using TypeScript. We will cover managing focus arrays via `useRef`, intercepting `onKeyDown` and `onPaste` events, handling iOS AutoFill, and writing clean, declarative state management to ensure a flawless user experience.

---

## Deep Dive: Managing DOM Focus with Array Refs

To create 6 visually separate boxes that act as a single logical input, we need two parallel arrays:
1. An array of React State strings to hold the actual values (e.g., `['1', '2', '3', '4', '5', '6']`).
2. An array of Mutable DOM References (using `useRef`) to hold the actual `<HTMLInputElement>` nodes. 

The DOM references are absolutely crucial because React's declarative state model (`setState`) does not inherently handle moving the browser's blinking cursor. We must imperatively call `.focus()` on the specific DOM nodes when the user types, deletes, or pastes characters.

### Building the Core React Component State
Let's establish the foundational TypeScript interfaces and the core React hooks.

```tsx
import React, { useState, useRef, useEffect } from 'react';
import './TotpCodeInput.css'; // We will cover the CSS later

interface TotpCodeInputProps {
  /** The callback triggered when all boxes are filled */
  onComplete: (code: string) => Promise<void>;
  /** The length of the code. Defaults to 6. */
  length?: number;
  /** Whether the component should automatically focus the first box on mount */
  autoFocus?: boolean;
  /** Pass an error string from the parent to render the boxes in an invalid state */
  errorMsg?: string | null;
}

export const TotpCodeInput: React.FC<TotpCodeInputProps> = ({ 
  onComplete, 
  length = 6, 
  autoFocus = true,
  errorMsg = null 
}) => {
  // 1. State: An array initialized with empty strings
  const [code, setCode] = useState<string[]>(new Array(length).fill(''));
  
  // 2. State: Tracks if we are currently awaiting the backend response
  const [isVerifying, setIsVerifying] = useState(false);
  
  // 3. DOM Refs: A mutable array holding references to the actual input elements
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Ensure the ref array matches the requested length
  if (inputRefs.current.length !== length) {
    inputRefs.current = new Array(length).fill(null);
  }

  // 4. Auto-focus the first input when the component mounts
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // ... event handlers go here
```

---

## Algorithm Breakdown: Handling the Holy Trinity of Input Events

To make this component feel "alive", we must perfectly handle three core events: `onChange`, `onKeyDown`, and `onPaste`.

### 1. Handling onChange (Typing and Auto-Fill)
When a user types into a box, we must capture the latest digit, update our state array, and move focus to the next logical box. 

A notorious bug occurs on mobile devices when users use the "Auto-Fill from Messages" feature on iOS. The OS tries to dump the entire 6-digit string into the currently focused input box, triggering an `onChange` event with a value of `"123456"`. If we just `slice(-1)`, we lose 5 digits. We must handle multi-character strings dynamically.

```tsx
  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-numeric characters immediately to prevent 'e', '-', or spaces
    const rawValue = e.target.value.replace(/[^0-9]/g, ''); 
    
    // If the value is empty (they highlighted and deleted), just clear it
    if (!rawValue) {
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
      return;
    }

    // Handle Mobile Auto-Fill (e.target.value contains multiple characters)
    if (rawValue.length > 1) {
      const newCode = [...code];
      // Spread the incoming characters across the remaining boxes
      for (let i = 0; i < rawValue.length && index + i < length; i++) {
        newCode[index + i] = rawValue[i];
      }
      setCode(newCode);

      // Focus the appropriate next box, or the last box if we filled it
      const nextFocusIndex = Math.min(index + rawValue.length, length - 1);
      inputRefs.current[nextFocusIndex]?.focus();

      // Check if we just completed the sequence
      if (newCode.every(char => char !== '')) {
        submitCode(newCode.join(''));
      }
      return;
    }

    // Standard single-character typing
    const digit = rawValue.slice(-1); // Only take the last typed character
    const newCode = [...code];
    newCode[index] = digit; // Replace the digit exactly at this index
    setCode(newCode);

    // Auto-advance focus if a digit was entered and we are not at the end
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger API call if all boxes are filled
    if (newCode.every(char => char !== '')) {
      submitCode(newCode.join(''));
    }
  };
```

### 2. Handling onKeyDown (Navigation and Deletion)
Backspace is the most complex key to handle. If the user is in box 4, and box 4 is empty, and they press Backspace, their mental model expects the cursor to jump back to box 3 and erase its contents in one fluid motion. Furthermore, we should allow users to navigate with the left and right arrow keys.

```tsx
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      // If current box is empty, jump to previous box and clear it
      if (!code[index] && index > 0) {
        // Prevent default to stop the browser from trying to navigate back
        e.preventDefault(); 
        
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        
        // Imperatively move focus backward
        inputRefs.current[index - 1]?.focus();
      }
      // If the current box has a value, let the native 'onChange' handle the deletion
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };
```

### 3. Handling onPaste (The "Magic" UX)
Users constantly copy the 6-digit code from their authenticator app (like Authy or 1Password). Without an explicit `onPaste` interceptor, pasting will trigger the `onChange` event of a single box. While our new `onChange` logic handles multi-characters, the explicit `onPaste` API provides more granular control over the clipboard data before it ever hits the DOM.

We must intercept the `ClipboardEvent`, extract the text payload, sanitize it of hyphens and spaces (which some apps include), distribute it across our state array, and focus the final box.

```tsx
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Stop the browser from physically pasting the text into the single input
    e.preventDefault();
    
    // Get text, strip ALL non-numbers (e.g. '123-456' -> '123456'), slice to max length
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    
    if (pastedData) {
      const newCode = [...code];
      // Iterate and fill
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      
      // Focus on the next empty input, or the very last input if full
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();

      // Auto-submit if the pasted payload filled the entire array
      if (newCode.every(char => char !== '')) {
        submitCode(newCode.join(''));
      }
    }
  };
```

---

## Architectural Integration and CSS Aesthetics

### Integration and Error Recovery
Finally, we integrate this logic with the parent component. If the Backend API returns an error (e.g., `400 Bad Request - Invalid TOTP Code`), we must automatically clear the input boxes so the user can try again immediately, without forcing them to manually delete 6 boxes.

```tsx
  const submitCode = async (fullCode: string) => {
    setIsVerifying(true);
    try {
      // Execute the parent's API call
      await onComplete(fullCode);
    } catch (error) {
      // The parent component might show a toast notification, but WE must clear the boxes
      setCode(new Array(length).fill(''));
      
      // Auto-focus back to the very first box so they can type immediately
      inputRefs.current[0]?.focus(); 
    } finally {
      setIsVerifying(false);
    }
  };
```

### Rendering the Inputs
The render function maps over our state array. Note the specific HTML attributes we use: `inputMode="numeric"` forces mobile devices to show the large number pad instead of the QWERTY keyboard. `autoComplete="one-time-code"` tells iOS Safari to suggest codes arriving via SMS directly above the keyboard.

```tsx
  return (
    <div className={`totp-container ${errorMsg ? 'has-error' : ''}`}>
      {code.map((value, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          value={value}
          onChange={e => handleChange(index, e)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={isVerifying}
          maxLength={1} // We restrict physical typing to 1 char (AutoFill bypasses this)
          className="totp-box"
          type="text" // Use text, not number, to prevent the browser 'spinners'
          inputMode="numeric" // Forces the mobile number pad
          autoComplete="one-time-code" // Safari SMS Magic
        />
      ))}
      {errorMsg && <div className="totp-error-text">{errorMsg}</div>}
    </div>
  );
};
```

This meticulous combination of Controlled React State, Imperative DOM Manipulation, and HTML5 Mobile attributes yields a premium, bug-free user experience that rivals the world's top tech companies.

---

## 6 位數 Code Input 背後隱藏嘅極致複雜性

當 Backend Developer 撈埋 Frontend，要幫個雙重認證 (2FA) Setup 或者驗證閘門寫個介面嗰陣，佢哋通常會嚴重低估咗當中涉及嘅 User Experience (UX - 用戶體驗) 同 User Interface (UI - 用戶介面) 挑戰。

要 Generate 兼且顯示包住 `otpauth://` URI 嘅 Base32 QR Code 其實好簡單，靠好似 `qrcode.react` 呢啲強大嘅 Library 幾行 code 就搞掂。真正令人𢯎爆頭、試到懷疑人生嘅難關，在於點樣以一種專業、直覺而且極度流暢 (Frictionless) 嘅方式，收集用戶打入嚟嗰 6 位 TOTP Code。

最天真 (Naive)、最求其嘅做法，就係直接掉一個普通嘅 `<input type="number" maxLength={6} />` 落個 Page 度。雖然咁樣做喺功能上係 Work 嘅，的確可以 Send 條 6 位數 String 去 Backend，但係成件事感覺極之 Cheap、極唔 Professional，而且視覺提示 (Visual affordance) 極差。佢容許格式不一致 (例如喺某啲 Browser 仲可以打代表指數嘅英文字母 'e' 入去)，而且完全冇喺視覺上話俾用戶知系統預期緊一個固定長度、6 個字元嘅密碼。

現代高質素、Premium 嘅 Application (諗吓 Stripe、Apple，或者各大銀行嘅 App)，全部都會用 6 個獨立、喺視覺上完全分開嘅細格仔。當用戶打入一個數字嗰陣，個游標 (Cursor) 會自動、瞬間跳去下一格。

由零開始親手寫呢種 Multi-box input component，會揭露一個充滿邊緣情況 (Edge Cases) 嘅大迷宮。Frontend developer 必須要透過操作 DOM 嚟人手攔截同處理呢啲 Case：
- **Backspace 退格難題：** 如果用戶喺第 4 格，而第 4 格係空嘅，當佢撳 Backspace 嗰陣會點？人類嘅直覺期望，係個 Cursor 應該要跳返去第 3 格，然後一氣呵成咁 Delete 埋第 3 格嘅內容。
- **Clipboard 貼上魔法：** 如果用戶喺 Authenticator app 或者 SMS 度 Copy 咗個 6 位數 Code 出來點算？如果冇寫明確嘅 `onPaste` 處理邏輯，一 Paste 嗰陣，成舊 6 個字就會全部塞晒落唯一 Active 緊嗰一個格仔入面，然後俾 `maxLength` 卡住，後面啲字全部唔見晒。我哋必須要截取 Clipboard，拆解條 String，將啲數字平均分配落個 Array 度，最後將 Focus 擺去啱嘅格仔。
- **中間刪改位移：** 如果用戶用左右方向鍵返去第 2 格，然後打個新數字，到底係會 Override (覆寫)，定係將後面啲字全部向右推？
- **手機 Keyboard 騎呢位：** 我哋點樣可以強迫 iOS Safari 同 Android Chrome 彈個大數字鍵盤 (Numeric Keypad) 出嚟，而唔係彈個有齊英文字母嘅 QWERTY 鍵盤，同時又唔會引發 Validation Bug？

喺呢篇極度詳盡嘅深度探討入面，我哋會用 TypeScript 一齊起一個 Production-ready、堅不可摧嘅 `TotpCodeInput` React component。我哋會涵蓋點樣用 `useRef` 去管理 Focus arrays，點樣攔截 `onKeyDown` 同 `onPaste` events，點樣處理 iOS AutoFill，同埋點樣寫 Clean、Declarative (宣告式) 嘅狀態管理 (State Management)，確保提供一個完美無瑕嘅用戶體驗。

---

## 深度探討：用 Array Refs 去管理 DOM Focus

要整 6 個視覺上獨立、但邏輯上當成一個 Input 嘅格仔，我哋需要兩個平行 (Parallel) 嘅 Array：
1. 一個裝住 6 個 React State strings 嘅 Array，用嚟儲存實際嘅 Value (例如 `['1', '2', '3', '4', '5', '6']`)。
2. 一個裝住 Mutable (可變) DOM References (透過 `useRef`) 嘅 Array，用嚟裝住真正嘅 `<HTMLInputElement>` 節點。

DOM References 係絕對、非常之緊要嘅，因為 React 嗰種 Declarative state 模型 (`setState`) 本身係唔會幫你郁 Browser 嗰個閃吓閃吓嘅 Cursor 嘅。當用戶打字、Delete 或者 Paste 嗰陣，我哋必須要強迫性地 (Imperatively) call 特定 DOM node 嘅 `.focus()` method。

### 建立核心 React Component State
我哋先定義好基礎嘅 TypeScript Interfaces 同埋核心嘅 React hooks。

```tsx
import React, { useState, useRef, useEffect } from 'react';
import './TotpCodeInput.css'; // 我哋陣間先講 CSS

interface TotpCodeInputProps {
  /** 當所有格仔都填滿嗰陣觸發嘅 Callback */
  onComplete: (code: string) => Promise<void>;
  /** Code 嘅長度。預設係 6 格。 */
  length?: number;
  /** Component 載入嗰陣，係咪自動 Focus 第一格 */
  autoFocus?: boolean;
  /** 由 Parent 傳入嚟嘅 Error string，用嚟將啲格仔變成紅色 Invalid 狀態 */
  errorMsg?: string | null;
}

export const TotpCodeInput: React.FC<TotpCodeInputProps> = ({ 
  onComplete, 
  length = 6, 
  autoFocus = true,
  errorMsg = null 
}) => {
  // 1. State: 一個裝滿空字串嘅 Array
  const [code, setCode] = useState<string[]>(new Array(length).fill(''));
  
  // 2. State: Track 住我哋係咪等緊 Backend 回應
  const [isVerifying, setIsVerifying] = useState(false);
  
  // 3. DOM Refs: 一個 Mutable 嘅 Array，裝住真正 Input 元素嘅 References
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 確保 Ref array 嘅長度同 Requested length 一樣
  if (inputRefs.current.length !== length) {
    inputRefs.current = new Array(length).fill(null);
  }

  // 4. Component Mount 嗰陣，自動 Focus 第一格
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // ... Event handlers 喺下面
```

---

## 演算法解碼：處理輸入事件嘅「神聖三位一體」

要令呢個 Component 感覺「有生命」，我哋必須要完美處理三個核心事件：`onChange`、`onKeyDown` 同埋 `onPaste`。

### 1. 處理 onChange (打字同 Auto-Fill)
當用戶喺格仔度打字，我哋必須攞最新嗰個數字，Update 我哋個 State array，然後將 focus 跳去下一個邏輯格仔。

喺手機度有一個臭名遠播嘅 Bug：當用戶喺 iOS 使用「從訊息自動填寫 (Auto-Fill from Messages)」功能嗰陣，OS 會嘗試將成個 6 位數 String 一次過塞落當前 Focus 緊嗰一格度，觸發一個 value 係 `"123456"` 嘅 `onChange` event。如果我哋懶惰淨係寫 `slice(-1)`，我哋就會跌咗 5 個字。我哋必須要識得動態處理 Multi-character 嘅 String。

```tsx
  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    // 即刻清走所有唔係數字嘅字元，防止用戶打 'e'、'-' 或者空白鍵
    const rawValue = e.target.value.replace(/[^0-9]/g, ''); 
    
    // 如果 Value 係空嘅 (佢哋 Highlight 咗然後 Delete)，就直接清空佢
    if (!rawValue) {
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
      return;
    }

    // 處理手機 Auto-Fill (e.target.value 包含咗幾個字)
    if (rawValue.length > 1) {
      const newCode = [...code];
      // 將傳入嚟嘅字元，逐粒逐粒平均分配落剩低嘅格仔度
      for (let i = 0; i < rawValue.length && index + i < length; i++) {
        newCode[index + i] = rawValue[i];
      }
      setCode(newCode);

      // Focus 去下一個啱嘅格仔，或者如果填滿晒就 Focus 最後一格
      const nextFocusIndex = Math.min(index + rawValue.length, length - 1);
      inputRefs.current[nextFocusIndex]?.focus();

      // Check 吓係咪啱啱好填滿晒成條 Sequence
      if (newCode.every(char => char !== '')) {
        submitCode(newCode.join(''));
      }
      return;
    }

    // 標準嘅單字元打字
    const digit = rawValue.slice(-1); // 淨係攞最後打入去嗰個字
    const newCode = [...code];
    newCode[index] = digit; // 準確咁替換呢個 index 嘅字
    setCode(newCode);

    // 如果入咗字，而且未到最後一格，自動 advance focus
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // 如果 6 格都填滿晒，就 Call API
    if (newCode.every(char => char !== '')) {
      submitCode(newCode.join(''));
    }
  };
```

### 2. 處理 onKeyDown (方向鍵導航同 Delete)
Backspace 係最難搞嘅制。如果用戶喺第 4 格，而第 4 格係空嘅，當佢撳 Backspace，佢嘅心理預期 (Mental model) 係個 Cursor 應該要跳返去第 3 格，然後將第 3 格嘅內容清空。此外，我哋亦應該容許用戶用左右方向鍵穿梭各個格仔。

```tsx
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      // 如果當前呢格係空嘅，跳去上一格兼清空佢
      if (!code[index] && index > 0) {
        // Prevent default 阻止 Browser 嘗試去「上一頁」
        e.preventDefault(); 
        
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        
        // 強制性將 Focus 向後移
        inputRefs.current[index - 1]?.focus();
      }
      // 如果當前呢格有字，就由得原生嘅 'onChange' 去處理 Delete 動作
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };
```

### 3. 處理 onPaste (超神奇嘅 UX 魔法)
用戶成日都會喺 Authenticator app (例如 Authy 或 1Password) 度 Copy 個 6 位數 Code。如果冇一個明確嘅 `onPaste` 攔截器 (Interceptor)，Paste 嘅動作就會觸發單一格仔嘅 `onChange` 事件。雖然我哋新嘅 `onChange` 邏輯識得處理 Multi-characters，但明確嘅 `onPaste` API 可以俾我哋喺 Data 掂到 DOM 之前，有更高嘅權限去控制 Clipboard data。

我哋必須要截取 `ClipboardEvent`，抽出 Text payload，洗乾淨啲 Hyphens (橫線) 同 Spaces (有啲 App 鍾意加啲咁嘅嘢)，然後將啲數字拆散填滿個 state array，最後 Focus 去最後嗰格。

```tsx
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // 阻止 Browser 將啲 text 實體咁 Paste 落單一一個 input 度
    e.preventDefault();
    
    // 攞 text，清除「所有」非數字字元 (例如 '123-456' 變 '123456')，然後 slice 到最多 6 個字
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    
    if (pastedData) {
      const newCode = [...code];
      // 逐格 Loop 兼填入去
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      
      // Focus 去下一個空嘅格仔，或者如果填滿咗就 Focus 最後一格
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();

      // 如果 Paste 入嚟嘅 Payload 填滿晒成個 Array，自動 Submit
      if (newCode.every(char => char !== '')) {
        submitCode(newCode.join(''));
      }
    }
  };
```

---

## 架構整合與 CSS 美學 (Architectural Integration and Aesthetics)

### 整合與錯誤恢復 (Error Recovery)
最後，我哋將呢個 Component 邏輯同 Parent component 整合。如果 Backend API 回傳 Error (例如 `400 Bad Request - 驗證碼錯誤`)，我哋必須要自動清空晒所有 Input boxes，等用戶可以即刻再試一次，而唔需要強迫佢哋自己慢慢撳 6 次 Backspace。

```tsx
  const submitCode = async (fullCode: string) => {
    setIsVerifying(true);
    try {
      // 執行 Parent 傳入嚟嘅 API call
      await onComplete(fullCode);
    } catch (error) {
      // Parent component 可能會彈個 Toast notification 出來，但我哋負責清空啲格仔
      setCode(new Array(length).fill(''));
      
      // 自動 Focus 返落第一格，等佢哋可以即刻再打字
      inputRefs.current[0]?.focus(); 
    } finally {
      setIsVerifying(false);
    }
  };
```

### 渲染 Inputs (Rendering the Inputs)
Render function 會 Map 過我哋個 State array。留意我哋用嘅特定 HTML attributes：`inputMode="numeric"` 強迫手機彈個超大嘅數字鍵盤出嚟，而唔係有齊英文字母嘅 QWERTY 鍵盤。`autoComplete="one-time-code"` 會施展 iOS Safari 專屬魔法，當收到 SMS 驗證碼嗰陣，會直接喺 Keyboard 上面彈個 Code 出來建議用戶撳。

```tsx
  return (
    <div className={`totp-container ${errorMsg ? 'has-error' : ''}`}>
      {code.map((value, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          value={value}
          onChange={e => handleChange(index, e)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={isVerifying}
          maxLength={1} // 我哋限制物理打字只能入 1 個字 (AutoFill 會 Bypass 呢個限制)
          className="totp-box"
          type="text" // 用 text，千祈唔好用 number，防止 Browser 出現嗰啲加減數字嘅「上下箭嘴」
          inputMode="numeric" // 強迫喚醒手機大數字鍵盤
          autoComplete="one-time-code" // Safari SMS 魔法
        />
      ))}
      {errorMsg && <div className="totp-error-text">{errorMsg}</div>}
    </div>
  );
};
```

呢種受控嘅 React 狀態 (Controlled State)、強制性 DOM 操作 (Imperative DOM Manipulation)，以及 HTML5 Mobile attributes 嘅無縫、完美結合，先至能夠為你打造出一個可以同世界頂尖科技巨頭媲美、高質素兼且零 Bug 嘅終極用戶體驗！
