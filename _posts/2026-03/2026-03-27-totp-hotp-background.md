---
title: "What are TOTP and HOTP? The Principles Behind One-Time Password Algorithms | TOTP、HOTP 究竟係啲咩？ —— 一次性密碼認證算法背後既原理"
date: 2026-03-27 18:17:48 +0800
categories: [Security, Technology]
tags: [2fa, totp, hotp, otp, security]
toc: true
---

## Background: Why Did OTP Appear?

Traditional login relies on "passwords"—something only you know. But as we discussed in the previous article, passwords are vulnerable to leaks, guesses, and theft. Is there a way to make passwords that become useless after just one use?

This is the concept of **OTP (One-Time Password)**—a fresh, single-use password for every login. But how does it work?

---

## HOTP: Where It All Begins

**HOTP (HMAC-based One-Time Password)** was standardized by IETF in 2005 (RFC 4226), and it's the foundation of all modern 2FA algorithms.

### Core Concept

```
HOTP = Truncate(HMAC-SHA-1(key, counter))
```

### Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                    HOTP Workflow                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│   Server                                Client     │
│  ┌─────────────┐                    ┌───────────┐  │
│  │  Secret (K) │  Pre-shared        │  Secret(K)│  │
│  └──────┬──────┘                    └─────┬─────┘  │
│         │                                  │        │
│         │       Counter C = 1             │        │
│         │ ───────────────────────────────>│        │
│         │                                  │        │
│         │     HMAC-SHA-1(K, C=1)          │        │
│         │         (SHA-1 hash)            │        │
│         │                                  │        │
│         │   ┌─────────────────────────┐    │        │
│         │   │  32-bit Dynamic        │    │        │
│         │   │  Truncation extracts   │    │        │
│         │   │  the code               │    │        │
│         │   └──────────┬──────────────┘    │        │
│         │              │                   │        │
│         │         "123456"                │        │
│         │              │                   │        │
│         │ <───────────────────────────────│        │
│         │        Compare at login         │        │
│         │                                  │        │
│  ┌──────┴──────┐                    ┌─────┴─────┐  │
│  │ Match found! │                    │  C = C+1  │  │
│  └─────────────┘                    └───────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Mathematical Details

1. **HMAC-SHA-1**: Compute HMAC with key K and counter C, output 160-bit (20 bytes) hash
2. **Dynamic Truncation**: Take last 4 bits as offset, extract 32 bits as integer
3. **Modulo**: Apply modulo 1,000,000 to get a 6-digit number

```
Raw HMAC output (160 bits):
┌──────────────────────────────────────────────────────┐
│  b0 b1 b2 b3 ... b18 b19 │ offset = b19 & 0x0F      │
│  (19 bytes)              │ (last 4 bits)           │
├──────────────────────────────────────────────────────┤
│  Take bytes[offset] to bytes[offset+3]              │
│  Clear top bit (ensure 32-bit positive)             │
│  Result % 1,000,000 = 6-digit OTP                   │
└──────────────────────────────────────────────────────┘
```

---

## TOTP: The Time-Driven Evolution

**TOTP (Time-based One-Time Password)** is HOTP's improved version, standardized in 2008 (RFC 6238). The key change: using "time" instead of "counter".

### Core Formula

```
T = floor(Unix_time / 30)
TOTP = Truncate(HMAC-SHA-1(key, T))
```

### Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                    TOTP Workflow                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   Server                                Client     │
│  ┌─────────────┐                    ┌───────────┐  │
│  │  Secret (K) │  Pre-shared        │  Secret(K)│  │
│  └──────┬──────┘                    └─────┬─────┘  │
│         │                                  │        │
│         │       T = floor(t / 30)         │        │
│         │        (updates every 30s)      │        │
│         │       Current t = 1700000000     │        │
│         │       T = 56666666               │        │
│         │ ───────────────────────────────>│        │
│         │                                  │        │
│         │     HMAC-SHA-1(K, T)             │        │
│         │         (SHA-1 hash)             │        │
│         │                                  │        │
│         │   ┌─────────────────────────┐    │        │
│         │   │  Dynamic Truncation    │    │        │
│         │   └──────────┬──────────────┘    │        │
│         │              │                   │        │
│         │         "456789"                │        │
│         │              │                   │        │
│         │ <───────────────────────────────│        │
│         │        Compare at login         │        │
│         │                                  │        │
└─────────────────────────────────────────────────────┘

Time window visualization:
┌────────────────────────────────────────────────┐
│  0s    30s    60s    90s   120s   150s  ...  │
│  │     │     │     │     │     │             │
│  ├─────┴─────┴─────┴─────┴─────┴───── ...    │
│  T=0   T=1   T=2   T=3   T=4   T=5           │
│  (One valid TOTP per 30 seconds)               │
└────────────────────────────────────────────────┘
```

---

## Why 30 Seconds?

```
┌────────────────────────────────────────────────┐
│           30-Second Window Design             │
├────────────────────────────────────────────────┤
│                                                │
│  • Long enough: User can type comfortably     │
│  • Short enough: Reduces brute-force risk    │
│  • Sync-friendly: Clock drift between client  │
│    and server is tolerable                    │
│    (usually ±1 window, i.e., 90 seconds)      │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Real-World Use Cases

### TOTP Common Examples
- Google Authenticator, Microsoft Authenticator
- Bank app login
- Password manager's secondary authentication

### HOTP Common Examples
- Traditional bank security tokens (generate on press)
- Some smart card systems

---

## Summary

| Feature | HOTP | TOTP |
|---------|------|------|
| Base | HMAC-SHA-1 | HMAC-SHA-1 |
| Input | Counter (C) | Time (T) |
| Validity | Until verified | 30-second window |
| Advantage | No time sync needed | No counter sync needed |
| Drawback | Counter may drift | Clock must be synced |

Whether HOTP or TOTP, the core is **key + one-way function**, ensuring that even if someone intercepts an OTP, they can't reuse it or predict the next one—simple math that protects your account.

---

- - -

## 背景：點解會出現一次性密碼？

傳統既登入方式靠「密碼」呢樣唔係所有人都知既嘢。但正如之前篇文講，密碼好易洩露、猜測、甚至被竊取。有咩方法可以做到「我用咗呢個密碼之後，呢個密碼就唔可以再用」？

呢個就係 **OTP (One-Time Password)** 既概念——每 次登入都用一個全新、一次性既密碼。咁即係點運作既呢？

---

## HOTP：一切既起點

**HOTP (HMAC-based One-Time Password)** 係 2005 年由 IETF 標準化既算法（RFC 4226），係所有現代 2FA 算法既根源。

### 核心概念

```
HOTP = Truncate(HMAC-SHA-1(密鑰, 計數器))
```

### 流程圖

```
┌─────────────────────────────────────────────────────┐
│                    HOTP 運作流程                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   伺服器                              用戶端         │
│  ┌─────────────┐                    ┌───────────┐  │
│  │  密鑰 (K)   │  預先共享           │  密鑰 (K) │  │
│  └──────┬──────┘                    └─────┬─────┘  │
│         │                                  │        │
│         │       計數器 C = 1               │        │
│         │ ───────────────────────────────>│        │
│         │                                  │        │
│         │     HMAC-SHA-1(K, C=1)          │        │
│         │         (SHA-1 雜湊)             │        │
│         │                                  │        │
│         │   ┌─────────────────────────┐    │        │
│         │   │  用 32-bit Dynamic     │    │        │
│         │   │  Truncation 提取密碼   │    │        │
│         │   └──────────┬──────────────┘    │        │
│         │              │                   │        │
│         │         "123456"                │        │
│         │              │                   │        │
│         │ <───────────────────────────────│        │
│         │         登入時比對              │        │
│         │                                  │        │
│  ┌──────┴──────┐                    ┌─────┴─────┐  │
│  │  比對成功！  │                    │  C = C+1  │  │
│  └─────────────┘                    └───────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 數學細節

1. **HMAC-SHA-1**：用密鑰 K 對計數器 C 做 HMAC 運算，輸出 160-bit（20 bytes）雜湊值
2. **Dynamic Truncation**：取最後 4 bits 決定 offset，然後取 32 bits 作為整數
3. **Modulo**：對 1,000,000 取模，得到 6 位數字

```
原始 HMAC 輸出（160 bits）:
┌──────────────────────────────────────────────────────┐
│  b0 b1 b2 b3 ... b18 b19 │ offset = b19 & 0x0F      │
│  (19 bytes)              │ (取最後 4 bits)          │
├──────────────────────────────────────────────────────┤
│  取 bytes[offset] 到 bytes[offset+3]                │
│  並將首 bit 设為 0（確保 32-bit 正數）              │
│  結果 % 1,000,000 = 6 位 OTP                        │
└──────────────────────────────────────────────────────┘
```

---

## TOTP：時間驅動既進化

**TOTP (Time-based One-Time Password)** 係 HOTP 既改良版，2008 年標準化（RFC 6238）。最大既改變係：用「時間」取代「計數器」。

### 核心公式

```
T = floor(Unix時間 / 30)
TOTP = Truncate(HMAC-SHA-1(密鑰, T))
```

### 流程圖

```
┌─────────────────────────────────────────────────────┐
│                    TOTP 運作流程                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   伺服器                              用戶端         │
│  ┌─────────────┐                    ┌───────────┐  │
│  │  密鑰 (K)   │  預先共享           │  密鑰 (K) │  │
│  └──────┬──────┘                    └─────┬─────┘  │
│         │                                  │        │
│         │       T = floor(t / 30)          │        │
│         │           (每 30 秒更新)         │        │
│         │       當前時間 t = 1700000000    │        │
│         │       T = 56666666               │        │
│         │ ───────────────────────────────>│        │
│         │                                  │        │
│         │     HMAC-SHA-1(K, T)             │        │
│         │         (SHA-1 雜湊)             │        │
│         │                                  │        │
│         │   ┌─────────────────────────┐    │        │
│         │   │  Dynamic Truncation    │    │        │
│         │   └──────────┬──────────────┘    │        │
│         │              │                   │        │
│         │         "456789"                │        │
│         │              │                   │        │
│         │ <───────────────────────────────│        │
│         │         登入時比對              │        │
│         │                                  │        │
└─────────────────────────────────────────────────────┘

時間窗口示意：
┌────────────────────────────────────────────────┐
│  0s    30s    60s    90s   120s   150s  ...  │
│  │     │     │     │     │     │             │
│  ├─────┴─────┴─────┴─────┴─────┴───── ...    │
│  T=0   T=1   T=2   T=3   T=4   T=5           │
│  (每 30 秒一個有效 TOTP)                       │
└────────────────────────────────────────────────┘
```

---

## 點解要用 30 秒？

```
┌────────────────────────────────────────────────┐
│             30 秒窗口既設計考量                │
├────────────────────────────────────────────────┤
│                                                │
│  • 夠長：畀用戶從容輸入                         │
│  • 夠短：減少被暴力破解既風險                   │
│  • 同步：用戶端同伺服器既時鐘可以有輕微偏差      │
│        （通常容許 ±1 個窗口，即 90 秒內）       │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 實際應用場景

### TOTP 常見用例
- Google Authenticator、Microsoft Authenticator
- 銀行 App 登入
- 密碼管理器既二次認證

### HOTP 常見用例
- 傳統既銀行實體 security token（按一次生成一次）
- 某些 Smart Card 系統

---

## 總結

| 特性 | HOTP | TOTP |
|------|------|------|
| 基礎 | HMAC-SHA-1 | HMAC-SHA-1 |
| 輸入 | 計數器 (C) | 時間 (T) |
| 有效期 | 直至成功驗證 | 30 秒窗口 |
| 優點 | 無需同步時間 | 無需同步計數器 |
| 缺點 | 計數器可能 drift | 時鐘需同步 |

無論 HOTP 定 TOTP，核心都係用 **密鑰 + 單向函數**，確保即使有人截獲咗某次既 OTP，都唔可以重用或者推算下一次既密碼—— 就係咁簡單既數學原理，保障到你既帳戶安全。