---
title: "Understanding KEK and DEK: How Password Managers Secure Your TOTP Secrets | 拆解 KEK 同 DEK：密碼管理器點樣保護你既 TOTP 密鑰"
date: 2026-03-27 18:29:42 +0800
categories: [Security, Technology]
tags: [2fa, totp, kek, dek, encryption, password-manager]
toc: true
---

In the previous article, we learned how TOTP generates one-time passwords using a secret key. But here's a question: **where does this secret key come from, and how is it stored safely?**

This is where **KEK (Key Encryption Key)** and **DEK (Data Encryption Key)** come into play.

---

## What are KEK and DEK?

These are two fundamental concepts in key management:

**DEK (Data Encryption Key)**  
- The key used to encrypt actual data
- In our TOTP context: the secret key that generates your one-time passwords
- Directly involved in the HMAC-SHA-1 computation

**KEK (Key Encryption Key)**  
- The key used to encrypt/decrypt other keys (including DEK)
- Usually derived from a master password
- Never leaves your device in plaintext

### The Relationship

![Key Hierarchy](/assets/img/posts/2026-03-29/kek-hierarchy-en.svg)

---

## Why Do We Need This Two-Layer Approach?

### The Problem: Storing Secrets Directly

If you store your TOTP secret directly:

```
┌─────────────────────────────────────────────────────┐
│          ❌ Bad: Direct Storage                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│   Device Storage:                                    │
│   ┌─────────────────────────────────────────┐      │
│   │  TOTP Secret = "JBSWY3DPEHPK3PXP"      │      │
│   └─────────────────────────────────────────┘      │
│                                                     │
│   Risk: If device is compromised, attacker          │
│   gets ALL your 2FA secrets!                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### The Solution: Encrypt with KEK

```
┌─────────────────────────────────────────────────────┐
│          ✅ Good: KEK-DEK Encryption                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│   Device Storage:                                    │
│   ┌─────────────────────────────────────────┐      │
│   │  Encrypted DEK = AES-256-GCM(         │      │
│   │    key=KEK, data="JBSWY3DPEHPK3PXP")   │      │
│   └─────────────────────────────────────────┘      │
│                                                     │
│   Even if device is compromised, attacker          │
│   only gets encrypted data — useless without KEK  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## The Complete TOTP + KEK/DEK Workflow

### 1. Initial Setup (First Time)

![Initial Setup](/assets/img/posts/2026-03-29/kek-initial-setup-en.svg)

### 2. Normal Login (Using TOTP)

![Daily TOTP Generation](/assets/img/posts/2026-03-29/kek-daily-totp-en.svg)

### 3. Backup/Restore (Cross-Device)

![Backup & Restore](/assets/img/posts/2026-03-29/kek-backup-restore-en.svg)

---

## Real-World Examples

### Password Managers with TOTP Support

| Password Manager | KEK/DEK Approach |
|------------------|-------------------|
| 1Password | Master password → Argon2 → KEK → Encrypt DEK |
| Bitwarden | Master password → PBKDF2 → KEK → Encrypt DEK |
| iCloud Keychain | Device-bound KEK + optional password |

### The Encryption Process in Action

![1Password Encryption Flow](/assets/img/posts/2026-03-29/kek-1password-flow-en.svg)

---

## Why Not Just Store the Password Directly?

### Common Misconceptions

```
┌─────────────────────────────────────────────────────┐
│         ❌ Misconception: "I trust my phone"        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Reality:                                           │
│  • Phone can be stolen/lost                         │
│  • Malware can read app storage                    │
│  • Cloud backup might be compromised               │
│  • Zero-day exploits exist                         │
│                                                     │
│  With KEK/DEK:                                     │
│  • Even if attacker gets encrypted data           │
│  • They still need your master password           │
│  • And deriving KEK is intentionally slow          │
│    (prevents brute force)                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Summary: The Security Chain

![Complete Security Chain](/assets/img/posts/2026-03-29/kek-security-chain-en.svg)

Each layer has a specific purpose:

- **Password**: Something you know
- **KEK derivation**: Prevents brute force
- **KEK**: Never stored, protects DEK
- **DEK**: The actual TOTP secret
- **TOTP**: Time-based one-time codes

---

## Key Takeaways

1. **DEK = Your TOTP secret** — the actual key that generates codes
2. **KEK = Derived from your master password** — never stored in plaintext
3. **Two-layer encryption** means even if your device is compromised, attackers can't access your 2FA without your password
4. **Key derivation** (PBKDF2, Argon2) makes brute-force attacks impractical

This is how modern password managers protect not just your passwords, but also your precious 2FA secrets.

---

- - -

上篇文講咗 TOTP 點樣用密鑰生成一次性密碼。但係有個問題：**呢條密鑰嘅源頭係邊？佢點樣安全咁储存？**

呢個就係 **KEK (Key Encryption Key)** 同 **DEK (Data Encryption Key)** 登場既時候。

---

## 咩係 KEK 同 DEK？

呢兩個係密鑰管理既基礎概念：

**DEK (Data Encryption Key)**  
- 用嚟加密實際既數據
- 喺 TOTP 上下文：就係生成你一次性密碼既嗰條密鑰
- 直接參與 HMAC-SHA-1 運算

**KEK (Key Encryption Key)**  
- 用嚟加密/解密其他密鑰（包括 DEK）
- 通常由主密碼衍生出嚟
- 永遠唔會以明文形式離開你既設備

### 兩者既關係

![密鑰層次結構](/assets/img/posts/2026-03-29/kek-hierarchy-cn.svg)

---

## 點解要用兩層？

### 直接儲存既問題

如果你直接儲存 TOTP 密鑰：

```
┌─────────────────────────────────────────────────────┐
│          ❌ 唔好既做法：直接儲存                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│   設備儲存:                                          │
│   ┌─────────────────────────────────────────┐      │
│   │  TOTP 密鑰 = "JBSWY3DPEHPK3PXP"       │      │
│   └─────────────────────────────────────────┘      │
│                                                     │
│   風險：如果設備被入侵，攻擊者就可以拎到你所有既      │
│   2FA 密鑰！                                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 用 KEK 加密既方案

```
┌─────────────────────────────────────────────────────┐
│          ✅ 好既做法：KEK-DEK 加密                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│   設備儲存:                                          │
│   ┌─────────────────────────────────────────┐      │
│   │  加密既 DEK = AES-256-GCM(           │      │
│   │    key=KEK, data="JBSWY3DPEHPK3PXP") │      │
│   └─────────────────────────────────────────┘      │
│                                                     │
│   即使設備被入侵，攻擊者都只係拎到加密既數據 ——       │
│   冇 KEK 既話一啲用都冇                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 完整既 TOTP + KEK/DEK 工作流程

### 1. 首次設定

![首次設定](/assets/img/posts/2026-03-29/kek-initial-setup-cn.svg)

### 2. 正常登入（使用 TOTP）

![日常 TOTP 生成](/assets/img/posts/2026-03-29/kek-daily-totp-cn.svg)

### 3. 備份/還原（跨設備）

![備份同還原](/assets/img/posts/2026-03-29/kek-backup-restore-cn.svg)

---

## 現實世界既應用

### 有 TOTP 支持既密碼管理器

| 密碼管理器 | KEK/DEK 方案 |
|----------|-------------|
| 1Password | 主密碼 → Argon2 → KEK → 加密 DEK |
| Bitwarden | 主密碼 → PBKDF2 → KEK → 加密 DEK |
| iCloud Keychain | 設備綁定既 KEK + 可選密碼 |

### 加密過程實例

![1Password 加密流程](/assets/img/posts/2026-03-29/kek-1password-flow-cn.svg)

---

## 點解唔直接儲存密碼？

### 常見既誤解

```
┌─────────────────────────────────────────────────────┐
│         ❌ 誤解：「我相信我既手機」                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│   現實:                                             │
│   • 手機可以被偷/唔見                                │
│   • 惡意軟件可以讀取 app 儲存                        │
│   • 雲端備份可能被入侵                              │
│   • 零日漏洞存在                                    │
│                                                     │
│   用 KEK/DEK:                                      │
│   • 即使攻擊者拎到加密既數據                        │
│   • 佢仍然需要你既主密碼                            │
│   • 而且衍生 KEK 係故意慢既                         │
│     （防止暴力破解）                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 總結：安全鏈

![完整既安全鏈](/assets/img/posts/2026-03-29/kek-security-chain-cn.svg)

每層都有特定用途:

- **密碼**：你知道既嘢
- **KEK 衍生**：防止暴力破解
- **KEK**：唔儲存明文，保護 DEK
- **DEK**：實際既 TOTP 密鑰
- **TOTP**：時間型一次性密碼

---

## 重點整理

1. **DEK = 你既 TOTP 密鑰** — 實際生成密碼既嗰條
2. **KEK = 從你既主密碼衍生** — 永遠唔會以明文儲存
3. **兩層加密**意味住即使你既設備被入侵，攻擊者都無法访问你既 2FA，除非有你既密碼
4. **密鑰衍生**（PBKDF2、Argon2）令暴力破解變得不可行

呢個就係現代密碼管理器點樣保護你既密碼 — 同埋你最珍惜既 2FA 密鑰。