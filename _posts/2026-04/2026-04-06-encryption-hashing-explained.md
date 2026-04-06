---
title: "Encryption and Hashing Explained: The Foundations of Modern Security | 加密同哈希拆解：現代安全嘅基礎原理"
date: 2026-04-06 10:00:00 +0800
categories: [Security, Technology]
tags: [encryption, symmetric, asymmetric, hashing, security, assisted_by_ai]
toc: true
---

## Background: Why Do We Need Encryption?

In our previous articles, we discussed how TOTP generates one-time passwords and how KEK/DEK protect your secrets. But we never really explained *how* encryption itself works. What does AES-256 actually do? Why is RSA called "asymmetric"? And what about hashing — why is it irreversible?

Today, let's demystify these three pillars of modern cryptography.

---

## Three Pillars of Cryptography

```
┌─────────────────────────────────────────────────────────────┐
│                    Modern Cryptography                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│    Symmetric     │   Asymmetric    │        Hashing          │
│   Encryption     │   Encryption    │      (One-way)          │
├─────────────────┼─────────────────┼─────────────────────────┤
│  Same key for   │  Public key +   │  Fixed-size output,    │
│  encrypt &      │  private key    │  no reverse possible     │
│  decrypt        │  (key pair)     │                         │
├─────────────────┼─────────────────┼─────────────────────────┤
│  AES, ChaCha20  │  RSA, ECC       │  SHA-256, bcrypt,      │
│                 │                 │  MD5 (deprecated)      │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

## Part 1: Symmetric Encryption

**Symmetric encryption** is the oldest and simplest form: the same key is used for both encryption and decryption.

### The Core Concept

```
┌─────────────────────────────────────────────────────────────┐
│               Symmetric Encryption Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Alice                                                    │
│     │                                                      │
│     │  [Plaintext] ── Key ──▶ [Encrypt] ──▶ [Ciphertext]  │
│     │                              │                        │
│     │                         (Same Key)                    │
│     │                              │                        │
│     │  [Plaintext] ◀── Key ◀── [Decrypt] ◀── [Ciphertext] │
│     │                                                      │
│   Bob                                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Popular Algorithms

| Algorithm | Key Size | Speed | Use Cases |
|-----------|----------|-------|-----------|
| AES-128/256 | 128/256 bits | Very Fast | HTTPS, file encryption, WiFi |
| ChaCha20 | 256 bits | Fast | Mobile devices, TLS |
| 3DES | 168 bits | Slow | Legacy systems |

### How AES Works (Simplified)

AES (Advanced Encryption Standard) operates in **rounds**:

```
Round N:
┌─────────────────────────────────────────────────────────────┐
│  Input: 128-bit block                                       │
│     │                                                        │
│     ▼                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ SubBytes     │→ │ ShiftRows    │→ │ MixColumns   │      │
│  │ (Substitution)│ │ (Permutation)│ │ (Mixing)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│     │                                                        │
│     ▼                                                        │
│  ┌──────────────┐                                           │
│  │ AddRoundKey  │  (XOR with round key)                     │
│  └──────────────┘                                           │
│     │                                                        │
│     ▼                                                        │
│  Output: 128-bit block (goes to next round)                  │
└─────────────────────────────────────────────────────────────┘
```

### The Key Exchange Problem

```
┌─────────────────────────────────────────────────────────────┐
│                 The Key Distribution Problem                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Alice ─────── [Key] ────────▶ Bob                         │
│             (How to send?)                                  │
│                                                             │
│   Problem: If channel is secure, why encrypt at all?        │
│   If channel is insecure, key gets intercepted!              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

This is why we need **asymmetric encryption** — to solve the key exchange problem.

---

## Part 2: Asymmetric Encryption

**Asymmetric encryption** uses a pair of keys: a **public key** (shared freely) and a **private key** (kept secret).

### The Core Concept

```
┌─────────────────────────────────────────────────────────────┐
│              Asymmetric Encryption Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Bob generates key pair:                                   │
│   ┌─────────────────┐      ┌─────────────────┐             │
│   │   Public Key    │      │   Private Key    │             │
│   │   (shareable)   │      │   (secret)       │             │
│   └────────┬────────┘      └────────┬────────┘             │
│            │                         │                       │
│            ▼                         ▼                       │
│   Alice ◀───────────────────────────────                    │
│                                                             │
│   Alice encrypts with Bob's Public Key:                      │
│   [Plaintext] + [Bob's Public Key] → [Ciphertext]           │
│                                                             │
│   Bob decrypts with his Private Key:                        │
│   [Ciphertext] + [Bob's Private Key] → [Plaintext]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### How RSA Works (Simplified)

RSA relies on a mathematical fact: **multiplying two large prime numbers is easy, but factoring the product is hard.**

```
┌─────────────────────────────────────────────────────────────┐
│                     RSA Key Generation                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. Pick two large primes: p = 61, q = 53                  │
│                                                             │
│   2. n = p × q = 3233 (the "modulus")                       │
│                                                             │
│   3. φ(n) = (p-1)(q-1) = 3120                               │
│                                                             │
│   4. Choose e (public exponent): e = 17                      │
│      (e must be coprime with φ(n))                          │
│                                                             │
│   5. Compute d (private exponent): d = 2753                   │
│      (d × e ≡ 1 mod φ(n))                                   │
│                                                             │
│   Public Key: (n, e) = (3233, 17)                           │
│   Private Key: (n, d) = (3233, 2753)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### RSA Encryption/Decryption

```
┌─────────────────────────────────────────────────────────────┐
│                     RSA Operations                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Encryption (using Public Key):                            │
│   C = M^e mod n                                             │
│                                                             │
│   Decryption (using Private Key):                           │
│   M = C^d mod n                                             │
│                                                             │
│   Example:                                                  │
│   M = 42                                                    │
│   C = 42^17 mod 3233 = 2557                                 │
│   M = 2557^2753 mod 3233 = 42 ✓                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Real-World Comparison

| Algorithm | Based On | Key Size | Speed | Typical Use |
|-----------|---------|----------|-------|------------|
| RSA | Integer factorization | 2048-4096 bits | Slow | Key exchange, signatures |
| ECC (Elliptic Curve) | Discrete logarithm | 256-384 bits | Faster | Mobile, IoT, TLS |
| Diffie-Hellman | Discrete logarithm | 2048-4096 bits | Medium | Key exchange |

### The Hybrid Approach

```
┌─────────────────────────────────────────────────────────────┐
│                  Hybrid Encryption Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. Bob generates ephemeral symmetric key (session key)    │
│                                                             │
│   2. Alice encrypts session key with Bob's Public Key:     │
│      [Session Key] + [Bob's Public Key] → [Encrypted Key]   │
│                                                             │
│   3. Bob decrypts to get session key:                       │
│      [Encrypted Key] + [Bob's Private Key] → [Session Key] │
│                                                             │
│   4. Both use session key for symmetric encryption:        │
│      [Large Data] + [Session Key] → [Fast Encrypted Data]  │
│                                                             │
│   Why? Asymmetric is slow → Use it to exchange fast         │
│   symmetric key → Then use symmetric for bulk data          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 3: Hashing (One-Way Functions)

Unlike encryption, **hashing is one-way**. You can compute a hash from data, but you cannot reverse it back to the original data.

### The Core Concept

```
┌─────────────────────────────────────────────────────────────┐
│                      Hashing Flow                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [Any Size Data] ────────────▶ [Fixed Size Hash]           │
│         │                                  │                │
│         │  Hash Function                   │                │
│         │  (One-way, deterministic)        │                │
│         ▼                                  ▼                │
│   "Hello, World!" ──SHA-256──▶ a591a6d4...                  │
│   "hello world!" ──SHA-256──▶ 64c8cbc6... (different!)     │
│                                                             │
│   Cannot reverse: Hash → Original ❌                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Popular Hash Algorithms

| Algorithm | Output Size | Speed | Status |
|-----------|------------|-------|--------|
| MD5 | 128 bits | Very Fast | **Deprecated** (collision attacks) |
| SHA-1 | 160 bits | Fast | **Deprecated** (collision attacks) |
| SHA-256 | 256 bits | Medium | Recommended |
| SHA-3 | 256 bits | Medium | Recommended |
| bcrypt | Variable | Slow | Password storage |
| Argon2 | Variable | Slow | Password storage (recommended) |

### Why Is Hashing Important?

#### 1. Password Storage

```
┌─────────────────────────────────────────────────────────────┐
│               Password Storage (Without Hashing)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Database:                                                 │
│   ┌─────────────────────────────────────────────┐          │
│   │  username  │         password               │          │
│   ├─────────────────────────────────────────────┤          │
│   │  alice     │     secretpassword123           │          │
│   │  bob       │     mypassword456               │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
│   If DB is breached → all passwords exposed!               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               Password Storage (With Hashing)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Database:                                                 │
│   ┌─────────────────────────────────────────────┐          │
│   │  username  │         password_hash          │          │
│   ├─────────────────────────────────────────────┤          │
│   │  alice     │     5e884898... (SHA-256)       │          │
│   │  bob       │     8d969ee6... (SHA-256)       │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
│   User logs in:                                             │
│   Input: "secretpassword123"                                │
│   Hash it → Compare with stored hash → Match? ✓            │
│                                                             │
│   Even if DB is breached → attackers don't know passwords   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Data Integrity Verification

```
┌─────────────────────────────────────────────────────────────┐
│                   Data Integrity Check                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Sender:                                                   │
│   [File] ──▶ [Calculate Hash] ──▶ [Send File + Hash]       │
│                                                             │
│   Receiver:                                                 │
│   [Receive File] ──▶ [Calculate Hash] ──▶ [Compare Hashes] │
│                                                             │
│   Hashes match? ✓ File is intact                           │
│   Hashes differ? ✗ File was tampered!                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Salting: Making Rainbow Tables Useless

```
┌─────────────────────────────────────────────────────────────┐
│              Why We Need Salt for Passwords                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Without Salt (vulnerable to rainbow tables):              │
│   ┌─────────────────────────────────────────────┐          │
│   │  password123 → md5 → 5d41402a...           │          │
│   │  (Same password = Same hash)               │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
│   With Salt (rainbow tables ineffective):                  │
│   ┌─────────────────────────────────────────────┐          │
│   │  password123 + random_salt → bcrypt → xxx  │          │
│   │  password123 + different_salt → bcrypt → yyy│          │
│   │  (Same password = Different hash)           │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
│   Salt: Random data added to each password before hashing   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary: How They Work Together

```
┌─────────────────────────────────────────────────────────────┐
│              Modern TLS/HTTPS Encryption Flow                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Client ─────── Server's Certificate ─────── Server       │
│        │        (contains public key)          │           │
│        │                                        │           │
│        │  1. Client verifies certificate         │           │
│        │                                        │           │
│        │  2. Generate session key               │           │
│        │     [Session Key] + [Server's PubKey] → [Encrypted]│
│        │                                        │           │
│        │  3. Server decrypts with private key  │           │
│        │     [Encrypted] + [Server's PrivKey] → [Session Key]│
│        │                                        │           │
│        │  4. Both have session key now!         │           │
│        │                                        │           │
│        │  5. All data encrypted with session key│           │
│        │     (symmetric = fast)                │           │
│        │                                        │           │
│        │  6. Each message includes:             │           │
│        │     [Data] + [MAC (hash)] → [Integrity]│           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Quick Comparison

| Feature | Symmetric | Asymmetric | Hashing |
|---------|-----------|------------|---------|
| Keys | One shared key | Public + Private pair | No keys (one-way) |
| Purpose | Encrypt data | Key exchange, signatures | Verify integrity, store passwords |
| Speed | Fast | Slow | Medium to slow |
| Example | AES-256 | RSA, ECC | SHA-256, bcrypt |

Understanding these three pillars helps you appreciate how your passwords, 2FA codes, and data stay secure every time you browse the web.

---

- - -

## 背景：點解需要加密？

上幾篇文我哋講咗 TOTP 點樣生成一次性密碼，同埋 KEK/DEK 點樣保護你啲密鑰。但係我哋從未真正解釋過**加密本身係點運作嘅**。AES-256 到底做咗啲咩？點解 RSA 叫「非對稱」？仲有哈希——點解佢係不可逆轉？

今日，我哋就嚟拆解現代密碼學呢三根支柱。

---

## 密碼學三大支柱

```
┌─────────────────────────────────────────────────────────────┐
│                    現代密碼學                                 │
├─────────────────┬─────────────────┬─────────────────────────┤
│    對稱加密      │   非對稱加密     │       哈希             │
│  (Symmetric)    │  (Asymmetric)  │     (One-way)          │
├─────────────────┼─────────────────┼─────────────────────────┤
│  加密解密用       │  公鑰 + 私鑰     │  固定大小輸出，         │
│  同一把鑰        │  （鑰匙對）       │  無法逆向還原          │
├─────────────────┼─────────────────┼─────────────────────────┤
│  AES, ChaCha20  │  RSA, ECC        │  SHA-256, bcrypt,      │
│                 │                  │  MD5 (已淘汰)           │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

## 第一部分：對稱加密

**對稱加密**係最古老、最簡單嘅形式：加密同解密都用同一把鑰。

### 核心概念

```
┌─────────────────────────────────────────────────────────────┐
│                 對稱加密流程                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Alice                                                    │
│     │                                                      │
│     │  [明文] ── 鑰匙 ──▶ [加密] ──▶ [密文]               │
│     │                              │                        │
│     │                         （同一把鑰）                   │
│     │                              │                        │
│     │  [明文] ◀── 鑰匙 ◀── [解密] ◀── [密文]               │
│     │                                                      │
│   Bob                                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 流行算法

| 演算法 | 鑰匙大小 | 速度 | 典型應用 |
|--------|----------|------|----------|
| AES-128/256 | 128/256 bits | 非常快 | HTTPS、文件加密、WiFi |
| ChaCha20 | 256 bits | 快 | 流動設備、TLS |
| 3DES | 168 bits | 慢 | 舊系統 |

### AES 運作原理（簡化版）

AES（Advanced Encryption Standard）以**輪次**方式運作：

```
第 N 輪：
┌─────────────────────────────────────────────────────────────┐
│  輸入：128-bit 區塊                                          │
│     │                                                        │
│     ▼                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ SubBytes     │→ │ ShiftRows    │→ │ MixColumns   │      │
│  │ (替代)        │  │ (置換)        │  │ (混合)        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│     │                                                        │
│     ▼                                                        │
│  ┌──────────────┐                                           │
│  │ AddRoundKey  │  （與輪鑰匙做 XOR）                         │
│  └──────────────┘                                           │
│     │                                                        │
│     ▼                                                        │
│  輸出：128-bit 區塊（進入下一輪）                              │
└─────────────────────────────────────────────────────────────┘
```

### 密鑰分發問題

```
┌─────────────────────────────────────────────────────────────┐
│                   密鑰分發問題                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Alice ─────── [鑰匙] ────────▶ Bob                        │
│             （點樣傳送？）                                    │
│                                                             │
│   問題：如果 channel 係安全嘅，點解要加密？                    │
│   如果 channel 係唔安全嘅，鑰匙就會被截獲！                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

呢個就係點解我哋需要**非對稱加密**——為咗解決密鑰分發問題。

---

## 第二部分：非對稱加密

**非對稱加密**使用一對鑰匙：**公鑰**（可以自由分享）同**私鑰**（保密）。

### 核心概念

```
┌─────────────────────────────────────────────────────────────┐
│                 非對稱加密流程                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Bob 生成鑰匙對：                                           │
│   ┌─────────────────┐      ┌─────────────────┐             │
│   │     公鑰        │      │     私鑰         │             │
│   │   (可分享)      │      │   (保密)         │             │
│   └────────┬────────┘      └────────┬────────┘             │
│            │                         │                       │
│            ▼                         ▼                       │
│   Alice ◀───────────────────────────────                     │
│                                                             │
│   Alice 用 Bob 嘅公鑰加密：                                  │
│   [明文] + [Bob 的公鑰] → [密文]                              │
│                                                             │
│   Bob 用佢嘅私鑰解密：                                       │
│   [密文] + [Bob 的私鑰] → [明文]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### RSA 運作原理（簡化版）

RSA 基於一個數學事實：**將兩個大質數相乘好容易，但係要分解積就非常困難。**

```
┌─────────────────────────────────────────────────────────────┐
│                    RSA 密鑰生成                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. 選擇兩個大質數：p = 61, q = 53                          │
│                                                             │
│   2. n = p × q = 3233（「模數」）                           │
│                                                             │
│   3. φ(n) = (p-1)(q-1) = 3120                              │
│                                                             │
│   4. 選擇 e（公鑰指數）：e = 17                               │
│      （e 必須與 φ(n) 互質）                                  │
│                                                             │
│   5. 計算 d（私鑰指數）：d = 2753                            │
│      （d × e ≡ 1 mod φ(n)）                                  │
│                                                             │
│   公鑰：(n, e) = (3233, 17)                                │
│   私鑰：(n, d) = (3233, 2753)                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### RSA 加密/解密

```
┌─────────────────────────────────────────────────────────────┐
│                    RSA 運算                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   加密（使用公鑰）：                                         │
│   C = M^e mod n                                             │
│                                                             │
│   解密（使用私鑰）：                                         │
│   M = C^d mod n                                             │
│                                                             │
│   例子：                                                    │
│   M = 42                                                   │
│   C = 42^17 mod 3233 = 2557                                 │
│   M = 2557^2753 mod 3233 = 42 ✓                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 實際比較

| 演算法 | 基於原理 | 密鑰大小 | 速度 | 典型應用 |
|--------|----------|----------|------|----------|
| RSA | 整數分解 | 2048-4096 bits | 慢 | 密鑰交換、數碼簽名 |
| ECC (橢圓曲線) | 離散對數 | 256-384 bits | 較快 | 流動設備、IoT、TLS |
| Diffie-Hellman | 離散對數 | 2048-4096 bits | 中等 | 密鑰交換 |

### 混合方式

```
┌─────────────────────────────────────────────────────────────┐
│                   混合加密流程                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. Bob 生成臨時對稱密鑰（會話密鑰）                         │
│                                                             │
│   2. Alice 用 Bob 的公鑰加密會話密鑰：                       │
│      [會話密鑰] + [Bob的公鑰] → [加密後的密鑰]               │
│                                                             │
│   3. Bob 用私鑰解密得到會話密鑰：                            │
│      [加密後的密鑰] + [Bob的私鑰] → [會話密鑰]               │
│                                                             │
│   4. 雙方都有會話密鑰了！                                    │
│                                                             │
│   5. 之後用會話密鑰做對稱加密傳輸大量數據：                   │
│      [大量數據] + [會話密鑰] → [快速加密]                    │
│                                                             │
│   點解？非對稱慢 → 用佢交換快嘅對稱密鑰 →                     │
│   然後用對稱加密大量數據                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 第三部分：哈希（單向函數）

與加密唔同，**哈希係單向嘅**。你可以從數據計算哈希，但係無法逆向還原原始數據。

### 核心概念

```
┌─────────────────────────────────────────────────────────────┐
│                      哈希流程                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [任意大小數據] ────────────▶ [固定大小哈希值]              │
│         │                                  │                │
│         │  哈希函數                          │                │
│         │  （單向、確定性）                   │                │
│         ▼                                  ▼                │
│   "Hello, World!" ──SHA-256──▶ a591a6d4...                  │
│   "hello world!" ──SHA-256──▶ 64c8cbc6... （唔同㗎！）     │
│                                                             │
│   無法逆向：哈希 → 原始數據 ❌                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 流行哈希算法

| 演算法 | 輸出大小 | 速度 | 狀態 |
|--------|----------|------|------|
| MD5 | 128 bits | 非常快 | **已淘汰**（有碰撞攻擊） |
| SHA-1 | 160 bits | 快 | **已淘汰**（有碰撞攻擊） |
| SHA-256 | 256 bits | 中等 | 推薦使用 |
| SHA-3 | 256 bits | 中等 | 推薦使用 |
| bcrypt | 可變 | 慢 | 密碼儲存 |
| Argon2 | 可變 | 慢 | 密碼儲存（推薦） |

### 點解哈希咁重要？

#### 1. 密碼儲存

```
┌─────────────────────────────────────────────────────────────┐
│              密碼儲存（沒有哈希）                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   資料庫：                                                   │
│   ┌─────────────────────────────────────────────┐          │
│   │  username  │         password               │          │
│   ├─────────────────────────────────────────────┤          │
│   │  alice     │     secretpassword123           │          │
│   │  bob       │     mypassword456               │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
│   如果資料庫被入侵 → 所有密碼都洩露！                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              密碼儲存（使用哈希）                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   資料庫：                                                   │
│   ┌─────────────────────────────────────────────┐          │
│   │  username  │      password_hash            │          │
│   ├─────────────────────────────────────────────┤          │
│   │  alice     │   5e884898... (SHA-256)       │          │
│   │  bob       │   8d969ee6... (SHA-256)       │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
│   用戶登入：                                                 │
│   輸入："secretpassword123"                                 │
│   哈希佢 → 比較儲存嘅哈希 → 匹配？✓                          │
│                                                             │
│   即使資料庫被入侵 → 攻擊者都唔知道你嘅密碼                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2. 數據完整性驗證

```
┌─────────────────────────────────────────────────────────────┐
│                   數據完整性檢查                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   發送方：                                                   │
│   [文件] ──▶ [計算哈希] ──▶ [發送文件 + 哈希]                │
│                                                             │
│   接收方：                                                   │
│   [接收文件] ──▶ [計算哈希] ──▶ [比較哈希]                   │
│                                                             │
│   哈希匹配？✓ 文件完整                                       │
│   哈希唔匹配？✗ 文件被篡改！                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 加鹽：點解 Rainbow Tables 冇用

```
┌─────────────────────────────────────────────────────────────┐
│              點解密碼要加 Salt（鹽）                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   冇 Salt（容易被 rainbow tables 攻擊）：                   │
│   ┌─────────────────────────────────────────────┐          │
│   │  password123 → md5 → 5d41402a...           │          │
│   │  （同一密碼 = 同一哈希）                      │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
│   有 Salt（rainbow tables 無效）：                           │
│   ┌─────────────────────────────────────────────┐          │
│   │  password123 + 隨機_salt → bcrypt → xxx     │          │
│   │  password123 + 另一個_salt → bcrypt → yyy   │          │
│   │  （同一密碼 = 唔同嘅哈希）                     │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
│   Salt：喺每個密碼哈希之前加入隨機數據                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 總結：三個點配合使用

```
┌─────────────────────────────────────────────────────────────┐
│              現代 TLS/HTTPS 加密流程                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Client ─────── Server 的證書 ─────── Server               │
│        │        （包含公鑰）                │               │
│        │                                    │               │
│        │  1. Client 驗證證書                │               │
│        │                                    │               │
│        │  2. 生成會話密鑰                   │               │
│        │     [會話密鑰] + [Server的公鑰] → [加密密鑰]        │
│        │                                    │               │
│        │  3. Server 用私鑰解密              │               │
│        │     [加密密鑰] + [Server的私鑰] → [會話密鑰]       │
│        │                                    │               │
│        │  4. 雙方都有會話密鑰！              │               │
│        │                                    │               │
│        │  5. 所有數據用會話密鑰加密          │               │
│        │     （對稱 = 快速）                 │               │
│        │                                    │               │
│        │  6. 每條訊息包括：                  │               │
│        │     [數據] + [MAC (哈希)] → [完整性]│              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 快速比較

| 特性 | 對稱加密 | 非對稱加密 | 哈希 |
|------|----------|------------|------|
| 密鑰 | 一把共享密鑰 | 公鑰 + 私鑰對 | 無密鑰（單向） |
| 用途 | 加密數據 | 密鑰交換、數碼簽名 | 驗證完整性、儲存密碼 |
| 速度 | 快 | 慢 | 中等至慢 |
| 例子 | AES-256 | RSA, ECC | SHA-256, bcrypt |

了解呢三根支柱，令你可以更好咁欣賞每次瀏覽網頁時，你嘅密碼、2FA 密碼同數據係點樣保持安全嘅。
