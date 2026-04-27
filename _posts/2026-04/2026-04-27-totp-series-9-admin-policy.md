---
title: "TOTP Series Part 9: Admin UX Psychology, Danger Zones, and Permission-Based UI Rendering | TOTP 系列之九：管理員 UX 心理學、危險區域與基於權限的 UI 渲染"
date: 2026-04-27 14:00:00 +0800
categories: [Frontend, TOTP Series]
tags: [totp, frontend, react, admin, ux, security, rbac, assisted_by_ai]
toc: true
---

## The Psychology of "Oops"

In Part 5, we built the backend architecture to support powerful Admin Reset APIs. However, exposing these destructive APIs directly to a frontend interface without meticulous User Experience (UX) planning is a recipe for disaster. 

The greatest threat to an enterprise system's stability is rarely a sophisticated hacker; it is usually an overtired administrator who meant to click "Edit Email" but accidentally clicked "Wipe 2FA" because the buttons looked identical and were placed right next to each other.

To prevent this, we must borrow UI patterns from systems that handle catastrophic actions, such as GitHub's repository deletion flow or AWS's instance termination screens. We must design a UI that introduces **Intentional Friction**. 

Furthermore, we must ensure that the UI accurately reflects the backend's Role-Based Access Control (RBAC). If a junior support staff member does not possess the `USER_ACCOUNT_2FA_RESET` permission, they should absolutely not see a "Reset 2FA" button on their screen. Rendering a button that throws a `403 Forbidden` error when clicked is terrible UX. The UI must adaptively render based on the logged-in administrator's explicit permission claims.

In this deep dive, we will build the ultimate React "Danger Zone" component. We will implement confirmation modals requiring manual text input to proceed, and we will utilize React Context to dynamically hide destructive elements from unauthorized staff members.

---

## Deep Dive: Permission-Based Rendering

Let's begin by addressing the RBAC problem. We should create a utility component that wraps any restricted UI element. This wrapper will read the current admin's permissions from our global state (e.g., Zustand or Context) and decide whether to render its children.

```tsx
// src/components/security/RequirePermission.tsx
import React from 'react';
import { useAdminStore } from '../../store/useAdminStore';

interface RequirePermissionProps {
  /** The specific permission tag required to view this UI element */
  permission: string;
  /** What to render if the user has permission */
  children: React.ReactNode;
  /** Optional: What to render if the user lacks permission (default is null) */
  fallback?: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({ 
  permission, 
  children, 
  fallback = null 
}) => {
  const { permissions } = useAdminStore();

  // If they have 'SUPER_ADMIN', they can see everything. 
  // Otherwise, check for the specific tag.
  const hasAccess = permissions.includes('SUPER_ADMIN') || permissions.includes(permission);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
```

This simple component is incredibly powerful. We can now wrap our destructive buttons directly in our User Profile view.

```tsx
// Example usage in the UserProfile.tsx
<RequirePermission permission="USER_ACCOUNT_2FA_RESET">
  <DangerZone action="reset2fa" targetUserId={user.id} />
</RequirePermission>
```

---

## Architecture: The Danger Zone Pattern

A "Danger Zone" is a visually distinct area of an interface (typically bordered in red) that houses destructive actions. It immediately signals to the user's subconscious that they need to pay attention.

When an action within the Danger Zone is triggered, it must never execute immediately. It must trigger a Confirmation Modal.

### The Double-Confirmation Modal
For truly destructive actions (like resetting 2FA or deleting an account), a simple "Are you sure? Yes/No" modal is insufficient. Muscle memory dictates that users will blindly click "Yes" to dismiss popups. 

We must introduce **Cognitive Friction**. We force the user to type a specific confirmation string (usually the target's email or ID) before the "Execute" button becomes enabled.

```tsx
// src/components/modals/DestructiveConfirmationModal.tsx
import React, { useState } from 'react';
import './DangerZone.css'; // Red accents and bold typography

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  warningText: string;
  expectedConfirmationText: string; // What the user MUST type
}

export const DestructiveConfirmationModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  warningText,
  expectedConfirmationText
}) => {
  const [inputText, setInputText] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const isMatch = inputText === expectedConfirmationText;

  const handleExecute = async () => {
    if (!isMatch) return;
    setIsExecuting(true);
    try {
      await onConfirm();
      onClose(); // Only close on success
    } catch (error) {
      // Handle error (e.g., show toast)
    } finally {
      setIsExecuting(false);
      setInputText(''); // Reset state
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content border-t-4 border-red-600">
        <h2 className="text-xl font-bold text-red-600 mb-4">{title}</h2>
        
        <div className="bg-red-50 p-4 rounded mb-4 text-red-800">
          <strong>Warning:</strong> {warningText}
        </div>

        <p className="mb-2">
          To confirm this action, please type <strong>{expectedConfirmationText}</strong> below:
        </p>

        <input 
          type="text"
          className="w-full border-2 border-gray-300 p-2 rounded mb-4"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={expectedConfirmationText}
          disabled={isExecuting}
        />

        <div className="flex justify-end gap-3">
          <button 
            className="px-4 py-2 bg-gray-200 rounded text-gray-800"
            onClick={onClose}
            disabled={isExecuting}
          >
            Cancel
          </button>
          
          <button 
            className={`px-4 py-2 rounded text-white font-bold transition-colors
              ${isMatch ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'}
            `}
            onClick={handleExecute}
            disabled={!isMatch || isExecuting}
          >
            {isExecuting ? 'Executing...' : 'I understand the consequences, execute this action'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## Integrating the Flow: The Reset TOTP Component

Now we tie it all together. We create a component specifically for resetting a user's TOTP. It displays the Danger Zone UI, handles the modal state, and calls the API.

```tsx
// src/components/admin/UserTotpSettings.tsx
import React, { useState } from 'react';
import { RequirePermission } from '../security/RequirePermission';
import { DestructiveConfirmationModal } from '../modals/DestructiveConfirmationModal';
import { axiosAdminClient } from '../../api/axiosAdminClient';
import { toast } from 'react-toastify';

interface UserTotpSettingsProps {
  user: {
    id: string;
    email: string;
    isTotpEnabled: boolean;
  };
  onRefreshData: () => void; // Trigger a parent refetch after success
}

export const UserTotpSettings: React.FC<UserTotpSettingsProps> = ({ user, onRefreshData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const executeReset = async () => {
    await axiosAdminClient.post(`/admin/totp/users/${user.id}/reset`);
    toast.success(`Successfully wiped 2FA configuration for ${user.email}`);
    onRefreshData();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication Status</h3>
      
      <div className="mb-6 flex items-center">
        <span className="mr-3">Status:</span>
        {user.isTotpEnabled ? (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">Enabled</span>
        ) : (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full font-medium">Disabled</span>
        )}
      </div>

      {user.isTotpEnabled && (
        <RequirePermission permission="USER_ACCOUNT_2FA_RESET">
          <div className="border border-red-300 rounded-lg overflow-hidden">
            <div className="bg-red-50 border-b border-red-300 p-3">
              <h4 className="text-red-800 font-bold uppercase text-sm">Danger Zone</h4>
            </div>
            <div className="p-4 bg-white flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">Force Reset 2FA</p>
                <p className="text-sm text-gray-500">
                  This will immediately invalidate the user's current authenticator app configuration.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 font-medium transition-colors"
              >
                Reset 2FA
              </button>
            </div>
          </div>

          <DestructiveConfirmationModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={executeReset}
            title="Force Reset 2FA Configuration"
            warningText={`This action is irreversible. It will wipe the cryptographic secrets for ${user.email}. They will be unable to log in if they do not have their password.`}
            expectedConfirmationText={user.email} // Force them to type the email!
          />
        </RequirePermission>
      )}
    </div>
  );
};
```

By strictly aligning the visual frontend with the backend's RBAC system, and by intentionally introducing cognitive friction into destructive actions, we protect the enterprise from catastrophic human error while providing a robust, professional suite of tools for the administration team.

---

## 管理員的「不小心」心理學

喺第 5 篇文裡面，我哋成功起咗個強大嘅 Backend 架構，去 Support 各種 Admin Reset APIs。但係，如果我哋就咁將呢啲破壞力驚人嘅 APIs，喺完全冇周詳考慮過 UX (用戶體驗) 嘅情況下，直接暴露喺 Frontend 介面度，絕對係一場等緊爆發嘅災難。

對於一個企業級系統嘅穩定性來講，最大嘅威脅往往唔係啲技術高超嘅黑客；通常係一個做到凌晨三點、攰到眼花嘅管理員，原本只係想撳「修改電郵地址」，點知唔小心撳錯咗隔籬一模一樣樣嘅「強制洗白 2FA」掣。

為咗防止呢種悲劇，我哋必須要向業界處理「災難性操作」嘅頂級系統取經，例如 GitHub 嘅 Delete Repository 流程，或者 AWS 嘅 Terminate Instance 畫面。我哋必須要喺 UI 上面加入 **蓄意嘅摩擦力 (Intentional Friction)**。

此外，我哋必須確保 UI 能夠完美反映 Backend 嘅角色權限控制 (RBAC)。如果一個初級嘅 Customer Support 員工根本冇 `USER_ACCOUNT_2FA_RESET` 呢個權限，佢嘅畫面上 **絕對唔應該** 出現一粒「重置 2FA」嘅掣。如果 Renderer 一粒掣出來，等個員工撳完先彈個 `403 Forbidden` error 出來，呢種 UX 係垃圾級別嘅。UI 必須根據登入緊嘅 Admin 所擁有多嘅 Permissions，動態地、適應性地 (Adaptively) 進行渲染。

喺呢篇深度探討入面，我哋會一齊起一個終極嘅 React "Danger Zone (危險區域)" component。我哋會 Implement 雙重確認 Modal，強制要求人手打字確認；我哋亦會利用 React Context，將所有破壞性嘅 UI 元素，對未經授權嘅員工進行徹底隱藏。

---

## 深度探討：基於權限嘅 UI 渲染 (Permission-Based Rendering)

首先，我哋嚟解決 RBAC 嘅問題。我哋應該建立一個 Utility component 嚟包裝住任何受限制嘅 UI 元素。呢個 Wrapper 會喺我哋嘅全局狀態 (例如 Zustand 或者 Context) 裡面，讀取當前 Admin 嘅權限，然後決定係咪 Render 佢入面嘅內容。

```tsx
// src/components/security/RequirePermission.tsx
import React from 'react';
import { useAdminStore } from '../../store/useAdminStore';

interface RequirePermissionProps {
  /** 要睇到呢個 UI 元素所需嘅特定權限 Tag */
  permission: string;
  /** 如果用戶有權限，要 Render 嘅嘢 */
  children: React.ReactNode;
  /** Optional: 如果用戶冇權限，要 Render 嘅替代品 (預設係咩都唔 Render) */
  fallback?: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({ 
  permission, 
  children, 
  fallback = null 
}) => {
  const { permissions } = useAdminStore();

  // 如果佢哋擁有 'SUPER_ADMIN'，就大晒，咩都睇到。
  // 否則，就嚴格 Check 吓佢有冇嗰個特定嘅 Tag。
  const hasAccess = permissions.includes('SUPER_ADMIN') || permissions.includes(permission);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
```

呢個簡簡單單嘅 Component 其實有住驚人嘅威力。我哋而家可以直接喺 User Profile 嘅版面度，將啲危險嘅掣全部包晒入去。

```tsx
// 喺 UserProfile.tsx 嘅實際應用例子
<RequirePermission permission="USER_ACCOUNT_2FA_RESET">
  <DangerZone action="reset2fa" targetUserId={user.id} />
</RequirePermission>
```

---

## 架構設計：Danger Zone 模式 (The Danger Zone Pattern)

"Danger Zone (危險區域)" 係指介面上一個視覺特徵極度強烈嘅區域 (通常用紅色粗框圍住)，入面專門擺放各種破壞性嘅操作。佢嘅作用，係一瞬間向用戶嘅潛意識發出強烈信號：「喂！打醒十二分精神呀！」

當用戶觸發 Danger Zone 入面嘅動作嗰陣，系統絕對、永遠唔可以即刻執行。佢必須要彈出一個確認 Modal。

### 雙重確認對話框 (The Double-Confirmation Modal)
對於真正具破壞性嘅操作 (好似洗白 2FA 或者 Delete account)，一個普普通通嘅「你確定嗎？是/否」Modal 係完全冇用嘅。人類嘅肌肉記憶 (Muscle memory) 會驅使佢哋盲目地瘋狂撳「是」去閂走啲 Popup。

我哋必須引入 **認知摩擦力 (Cognitive Friction)**。我哋要強迫用戶親手打一段特定嘅確認字串 (通常係受害者個 Email 或者 ID)，直到兩段字一模一樣，「執行」粒掣先會解鎖。

```tsx
// src/components/modals/DestructiveConfirmationModal.tsx
import React, { useState } from 'react';
import './DangerZone.css'; // 加入大量紅色元素同粗體字

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  warningText: string;
  expectedConfirmationText: string; // 用戶【必須】親手打嘅字
}

export const DestructiveConfirmationModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  warningText,
  expectedConfirmationText
}) => {
  const [inputText, setInputText] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const isMatch = inputText === expectedConfirmationText;

  const handleExecute = async () => {
    if (!isMatch) return;
    setIsExecuting(true);
    try {
      await onConfirm();
      onClose(); // 只有成功先會閂走個 Modal
    } catch (error) {
      // 處理 Error (例如彈個 Error Toast 出來)
    } finally {
      setIsExecuting(false);
      setInputText(''); // 每次都必須 Reset state
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content border-t-4 border-red-600">
        <h2 className="text-xl font-bold text-red-600 mb-4">{title}</h2>
        
        <div className="bg-red-50 p-4 rounded mb-4 text-red-800">
          <strong>嚴重警告：</strong> {warningText}
        </div>

        <p className="mb-2">
          要確認執行呢項操作，請喺下面親手輸入 <strong>{expectedConfirmationText}</strong>：
        </p>

        <input 
          type="text"
          className="w-full border-2 border-gray-300 p-2 rounded mb-4"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={expectedConfirmationText}
          disabled={isExecuting}
        />

        <div className="flex justify-end gap-3">
          <button 
            className="px-4 py-2 bg-gray-200 rounded text-gray-800"
            onClick={onClose}
            disabled={isExecuting}
          >
            取消
          </button>
          
          <button 
            className={`px-4 py-2 rounded text-white font-bold transition-colors
              ${isMatch ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'}
            `}
            onClick={handleExecute}
            disabled={!isMatch || isExecuting}
          >
            {isExecuting ? '正在執行...' : '我完全明白後果，立即執行操作'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 完美整合：重置 TOTP 專屬組件 (The Reset TOTP Component)

而家我哋將所有嘢整合埋一齊。我哋為「重置用戶 TOTP」整一個專屬嘅 Component。佢會負責 Render 個 Danger Zone UI，處理個 Modal 嘅開關 State，然後 Call 真正嘅 API。

```tsx
// src/components/admin/UserTotpSettings.tsx
import React, { useState } from 'react';
import { RequirePermission } from '../security/RequirePermission';
import { DestructiveConfirmationModal } from '../modals/DestructiveConfirmationModal';
import { axiosAdminClient } from '../../api/axiosAdminClient';
import { toast } from 'react-toastify';

interface UserTotpSettingsProps {
  user: {
    id: string;
    email: string;
    isTotpEnabled: boolean;
  };
  onRefreshData: () => void; // 成功之後叫 Parent Component 去 Refetch 最新 Data
}

export const UserTotpSettings: React.FC<UserTotpSettingsProps> = ({ user, onRefreshData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const executeReset = async () => {
    await axiosAdminClient.post(`/admin/totp/users/${user.id}/reset`);
    toast.success(`已經成功將 ${user.email} 嘅 2FA 設定徹底洗白`);
    onRefreshData();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">雙重認證 (2FA) 狀態</h3>
      
      <div className="mb-6 flex items-center">
        <span className="mr-3">當前狀態:</span>
        {user.isTotpEnabled ? (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">已啟用</span>
        ) : (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full font-medium">未啟用</span>
        )}
      </div>

      {user.isTotpEnabled && (
        <RequirePermission permission="USER_ACCOUNT_2FA_RESET">
          <div className="border border-red-300 rounded-lg overflow-hidden">
            <div className="bg-red-50 border-b border-red-300 p-3">
              <h4 className="text-red-800 font-bold uppercase text-sm">Danger Zone (危險區域)</h4>
            </div>
            <div className="p-4 bg-white flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">強制重置 2FA</p>
                <p className="text-sm text-gray-500">
                  呢個操作會即刻令到用戶目前手機上嘅 Authenticator app 設定作廢。
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 font-medium transition-colors"
              >
                重置 2FA
              </button>
            </div>
          </div>

          <DestructiveConfirmationModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={executeReset}
            title="強制重置 2FA 設定"
            warningText={`呢個操作係絕對冇得返轉頭 (Irreversible) 嘅。系統會立刻將 ${user.email} 嘅密碼學鎖匙物理銷毀。如果用戶唔記得自己個密碼，佢哋將會完全無法登入。`}
            expectedConfirmationText={user.email} // 迫佢哋親手打受害者個 Email 出來！
          />
        </RequirePermission>
      )}
    </div>
  );
};
```

透過將視覺上嘅 Frontend UI 同 Backend 嘅 RBAC 系統進行鐵壁般嘅對齊，同埋透過蓄意地將「認知摩擦力」注入破壞性操作之中，我哋可以為企業提供一層強大嘅保護網，免受災難性人為錯誤 (Human error) 嘅禍害，同時為管理員團隊提供一套專業、穩健嘅支援工具！
