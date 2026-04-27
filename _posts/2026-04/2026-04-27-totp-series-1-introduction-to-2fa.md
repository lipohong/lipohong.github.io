---
title: "TOTP Series Part 1: The Ultimate Evolution of Authentication, RFC Standards, and System Design Patterns | TOTP 系列之一：終極驗證技術演變、RFC 標準與系統設計模式"
date: 2026-04-27 10:00:00 +0800
categories: [Security, TOTP Series]
tags: [totp, 2fa, security, architecture, algorithm, rfc, hmac, base32, assisted_by_ai]
toc: true
---

## The Evolution of Authentication and the Absolute Necessity of TOTP

In the foundational days of the internet, authentication was fundamentally simple: a user provided a username and a password. The backend server received these credentials, performed a simple database lookup (or in slightly more advanced systems, compared a hashed value), and if a match was found, granted access. 

This model, known as Single-Factor Authentication (SFA), was sufficient when computing power was low and the internet was essentially a closed network of academics and enthusiasts. However, as the digital landscape exploded into e-commerce, online banking, and enterprise cloud infrastructure, the threat model evolved exponentially.

Today, Single-Factor Authentication is considered completely broken for enterprise systems. The reasons are multifold:
1. **Password Reuse:** Humans are notoriously bad at remembering unique passwords. A staggering percentage of users reuse the exact same password across dozens of platforms.
2. **Data Breaches:** When a poorly secured third-party website is breached, attackers steal the hashed passwords. Due to advances in GPU computing, cracking algorithms (using tools like Hashcat) can reverse millions of SHA-256 or MD5 hashes per second.
3. **Credential Stuffing:** Attackers take the cracked passwords from a breach and use automated bots to "stuff" them into the login pages of major banks, social media platforms, and enterprise VPNs. Because of password reuse, a significant percentage of these attempts succeed.
4. **Phishing:** Social engineering attacks trick users into typing their passwords into fake login screens. No amount of hashing on your server protects against a user voluntarily handing over their plaintext password to an attacker.

To mitigate these existential risks, the cybersecurity industry mandated a paradigm shift towards Multi-Factor Authentication (MFA), most commonly implemented as Two-Factor Authentication (2FA).

This comprehensive, 10-part tutorial series will guide you through the absolute complete journey of designing, architecting, and implementing an enterprise-grade Time-based One-Time Password (TOTP) system from scratch. We will not be using "black box" solutions; we will be writing the core cryptographic structures, building the Envelope Encryption storage mechanisms in TypeORM, constructing the React UI code input components, and establishing airtight Role-Based Access Control (RBAC) for administrative overrides.

By the end of this massive series, you will not only know how to implement TOTP, but you will profoundly understand the clean code principles, software design patterns, and cryptographic theories that differentiate a hobbyist script from a production-ready authentication fortress.

---

## Deep Dive: The Triad Factors of Authentication

To understand why TOTP is the industry standard, we must first deeply understand what constitutes an "Authentication Factor". The security industry universally categorizes factors into three distinct types:

### 1. The Knowledge Factor (Something you know)
This is the oldest and most ubiquitous factor. It encompasses anything that exists solely in the user's memory.
- **Passwords and Passphrases:** The standard string of characters.
- **Personal Identification Numbers (PINs):** Commonly used for ATMs or unlocking mobile devices.
- **Security Questions:** "What was the name of your first pet?" (Note: These are heavily discouraged in modern systems because the answers are often public record or easily discoverable via social engineering).

The fatal flaw of the Knowledge Factor is that it can be infinitely duplicated without the original owner noticing. If I know your password, I can use it from across the globe, and your password remains intact in your memory. You have no idea it has been compromised until the damage is done.

### 2. The Possession Factor (Something you have)
This factor requires the user to possess a specific physical or digital token. To compromise this factor, an attacker must physically steal the item or compromise the specific device holding the digital token.
- **Hardware Security Tokens (e.g., YubiKey, RSA SecurID):** Physical USB devices or fobs that generate codes or perform cryptographic handshakes.
- **Smartphones with Authenticator Apps (e.g., Google Authenticator, Authy):** Devices holding a cryptographic secret that generates time-based codes.
- **SMS / Email Codes:** A code sent to a specific SIM card or email inbox.

The Possession Factor is significantly stronger than the Knowledge Factor because it is difficult to duplicate. However, SMS is now considered a weak possession factor due to SIM swapping attacks (where an attacker convinces a telecom provider to port the victim's number to the attacker's SIM card) and SS7 protocol vulnerabilities.

### 3. The Inherence Factor (Something you are)
This involves biometric verification—measuring physical or behavioral characteristics unique to the individual.
- **Fingerprint Scanners:** TouchID.
- **Facial Recognition:** FaceID, Windows Hello.
- **Iris/Retina Scans:** Used in high-security physical environments.

While biometric factors are highly convenient, they pose a severe risk: they cannot be rotated. If your password is stolen, you can change it. If your fingerprint data is compromised in a breach, you cannot grow new fingers. Therefore, biometrics are usually kept entirely local to the device (e.g., Apple's Secure Enclave) and are used to *unlock* a cryptographic key, rather than being sent over the network.

A robust 2FA system combines at least two of these factors. In our TOTP implementation, we are combining the **Knowledge Factor** (the user's standard password) with the **Possession Factor** (the TOTP code generated by the cryptographic secret residing exclusively on their smartphone).

---

## Algorithm Breakdown: The Journey from HOTP to TOTP

To mathematically comprehend TOTP, we must first analyze its predecessor: HOTP (HMAC-based One-Time Password), defined by the Internet Engineering Task Force (IETF) in RFC 4226.

### The Mathematics of HOTP (RFC 4226)
HOTP generates a unique, unpredictable password by combining a secret key with an incrementing counter. The formula is conceptually simple:

```text
HOTP(K, C) = Truncate(HMAC-SHA-1(K, C))
```

Let's define the variables:
- **K (Key):** A secret cryptographic key, shared exclusively between the server and the client (the hardware token). It must be at least 128 bits, but 160 bits (20 bytes) is strongly recommended.
- **C (Counter):** An 8-byte moving factor. Both the server and the client must keep track of this counter. Every time a new code is generated, `C` is incremented by 1.
- **HMAC-SHA-1:** The cryptographic Hash-based Message Authentication Code algorithm, utilizing the SHA-1 hash function.
- **Truncate:** The HMAC operation outputs a 20-byte (160-bit) string. This is too long for a human to type. The Truncate function performs a dynamic offset calculation to extract a 4-byte dynamic binary code from the 20-byte hash, which is then mathematically converted into a 6-digit or 8-digit number (e.g., `code = binary % 10^6`).

#### The Fatal Flaw of HOTP: Desynchronization
HOTP works brilliantly in theory, but falls apart in human reality. What happens if a user puts their RSA SecurID fob in their pocket, and the button gets accidentally pressed 15 times? 

The hardware token's internal counter increments to `C + 15`. However, because the user never logged into the server, the server's database still thinks the counter is at `C`. The next time the user tries to log in, they provide the code for `C + 16`. The server calculates the code for `C + 1` and rejects it. 

To solve this, servers had to implement a "look-ahead window". If the code fails for `C + 1`, the server calculates `C + 2`, `C + 3`, all the way up to `C + 50`. If it finds a match, it resynchronizes its database. This is computationally expensive, complex to manage, and increases the attack surface for brute-force guessing.

### The Mathematics of TOTP (RFC 6238)
TOTP brilliantly solves the synchronization problem by replacing the stateful, incrementing counter `C` with the one thing that both the server and the client universally share: **Time**.

Instead of tracking a database counter, TOTP calculates a time step, usually denoted as `T`.

```text
T = Math.floor((Current Unix Time - T0) / X)
```

- **Current Unix Time:** The number of seconds since January 1, 1970 (UTC).
- **T0:** The epoch start time (almost universally set to `0`).
- **X:** The time step size (almost universally set to `30` seconds).

The formula then simply replaces `C` with `T`:

```text
TOTP(K, T) = Truncate(HMAC-SHA-1(K, T))
```

Because time progresses equally for both the server and the client's smartphone, there is absolutely no need to keep track of stateful counters in a database. As long as the client's clock and the server's NTP (Network Time Protocol) clock are relatively synchronized, the generated 6-digit codes will match perfectly every 30 seconds.

---

## The Cryptography: HMAC, SHA-1, and Base32 Encoding

### Demystifying HMAC (Hash-based Message Authentication Code)
You might wonder why we use HMAC instead of just hashing the key and the time together like `SHA1(Key + Time)`. 

Simple concatenation hashing is vulnerable to "length extension attacks". If an attacker knows `Hash(Secret + Message)`, they can often mathematically calculate `Hash(Secret + Message + AttackerData)` without knowing the actual `Secret`.

HMAC prevents this by using a nested cryptographic construction defined in RFC 2104:
```text
HMAC(K, m) = Hash((K XOR opad) || Hash((K XOR ipad) || m))
```
This guarantees that the resulting hash is inextricably bound to both the secret key and the specific message (the time step), ensuring absolute data integrity and authentication.

### Why SHA-1? Isn't it cryptographically broken?
In 2017, Google announced "SHAttered", demonstrating the first practical collision attack against SHA-1, proving that two different PDF files could generate the exact same SHA-1 hash. Consequently, SHA-1 was deprecated for SSL certificates and digital signatures.

So why does TOTP still use SHA-1 by default?
Because TOTP relies on the pseudo-randomness of the HMAC construction, not just collision resistance. For an attacker to break HMAC-SHA-1, they must perform a key-recovery attack, which remains computationally infeasible even against SHA-1. Furthermore, while the RFC 6238 spec allows for HMAC-SHA-256 and HMAC-SHA-512, the vast majority of consumer authenticator apps (like Google Authenticator) only officially support SHA-1. Changing it breaks compatibility.

### Base32 Encoding: The Human Element
When the backend server generates the random secret key (K), it usually generates 20 raw bytes of entropy. This binary data must be transmitted to the user's phone. We typically do this by rendering a QR code containing an `otpauth://` URI.

But what if the user's camera is broken? They must manually type the secret into their app.

If we encoded those 20 bytes into standard Base64, the string would look like this:
`JbSwY3dpE/HpK3pXp=`

Base64 contains characters that are incredibly hostile to human typography:
- `l` (lowercase L) vs `1` (number one) vs `I` (uppercase i).
- `O` (uppercase o) vs `0` (number zero).
- Non-alphanumeric characters like `+` and `/` which are difficult to type on mobile keyboards.

**Base32 solves this perfectly.** It uses a restricted 32-character alphabet: `A-Z` and `2-7`. It intentionally excludes `1`, `8`, `9`, and `0` entirely. 

The resulting string looks like this:
`JBSWY3DPEHPK3PXP`

It is entirely uppercase, contains no confusing numbers, and can be easily read aloud over a phone or typed manually by a user, drastically reducing support tickets for "invalid secret" errors.

---

## Architectural Patterns: Designing the TOTP Module

When building enterprise software, we don't just dump all our cryptographic logic into a single controller file. We apply Domain-Driven Design (DDD) and SOLID principles to ensure our code is clean, testable, modular, and scalable.

### 1. Single Responsibility Principle (SRP)
Our `TotpService` should only be responsible for one thing: managing the TOTP domain logic. It should handle generating secrets, verifying codes, and formatting setup URIs. 

It should **NOT** be responsible for validating user passwords, interacting with the HTTP request context, or managing cookies. That is the explicit job of the `AuthService` and `AuthController`. By isolating this, we can unit test the `TotpService` without needing to mock complex HTTP request objects.

### 2. Dependency Inversion Principle (DIP)
The `TotpService` relies heavily on cryptography to perform Envelope Encryption (which we will cover in Part 2). Instead of hardcoding `crypto.createCipheriv` directly inside the TOTP service, we abstract this behind an `EncryptionService` interface. 

This allows us to swap out our encryption algorithm in the future (e.g., migrating to a Hardware Security Module or AWS KMS) without ever touching the core TOTP business logic.

### 3. The Strategy Pattern for Extensible 2FA
Today, the business wants TOTP. Tomorrow, they might demand SMS fallback, Email codes, or WebAuthn (FIDO2) hardware keys. By designing a generic `TwoFactorProvider` interface today, you can use the Strategy Pattern to inject the correct provider at runtime based on the user's preferences, ensuring your system is future-proof.

```typescript
// The robust, clean-code architecture for Extensible 2FA
export interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl?: string;
  recoveryCodes: string[];
}

export interface TwoFactorProvider {
  /**
   * Generates the necessary secrets and metadata to begin 2FA setup.
   */
  generateSetupData(userId: string, email: string): Promise<TwoFactorSetupData>;
  
  /**
   * Verifies the provided code against the user's specific cryptographic state.
   */
  verifyCode(userId: string, code: string): Promise<boolean>;
  
  /**
   * Completely removes the 2FA state, wiping cryptographic materials.
   */
  disable(userId: string): Promise<void>;
}

// Concrete Implementations
export class TotpProvider implements TwoFactorProvider {
  // Uses otplib and AES Envelope Encryption
}

export class SmsProvider implements TwoFactorProvider {
  // Uses Twilio API and Redis caching
}

export class WebAuthnProvider implements TwoFactorProvider {
  // Uses navigator.credentials and public key cryptography
}
```

In the upcoming posts, we will translate these high-level architectural patterns into actual, production-ready NestJS backend code, complete with complex database designs, envelope encryption pipelines, memory management, and exhaustive audit logging.

---

## 終極驗證技術演變、RFC 標準與系統設計模式

喺互聯網發展嘅最早期，身份驗證嘅概念非常之基礎同簡單：用戶提供一個 Username 同一串 Password。Backend server 收到呢啲憑證之後，做一個簡單嘅 Database 查詢 (或者喺稍微高級啲嘅系統度，做一個 Hash 嘅對比)，如果搵到 Match 嘅記錄，就直接放行。

呢種被稱為「單一因素驗證」(Single-Factor Authentication, SFA) 嘅模式，喺當年電腦運算能力低、互聯網仲係一個由學者同愛好者組成嘅封閉網絡嗰陣，係絕對夠用嘅。但係，隨住數碼世界爆炸性咁發展出電子商貿、網上銀行，以及企業級嘅雲端架構，網絡威脅嘅模型亦都呈指數級咁進化。

時至今日，對於任何企業級系統嚟講，單一因素驗證已經被視為 **完全破產 (Completely Broken)**。原因有好多方面：
1. **密碼重用 (Password Reuse):** 人類出名記性差，極難記住大量獨立嘅密碼。一個令人震驚嘅高比例用戶，會喺幾十個唔同嘅平台上面，重複使用完全一模一樣嘅密碼。
2. **資料外洩 (Data Breaches):** 當一個保安極差嘅第三方網站被黑客攻陷，攻擊者會偷走晒所有經過 Hash 處理嘅密碼。得益於 GPU 運算能力嘅突飛猛進，現代嘅破解演算法 (利用好似 Hashcat 呢啲工具)，每秒鐘可以逆向破解幾百萬個 SHA-256 或者 MD5 Hash。
3. **撞庫攻擊 (Credential Stuffing):** 黑客會攞住喺 Data breach 度破解返嚟嘅海量密碼，利用自動化嘅 Bot 寫 Script，將呢啲密碼瘋狂咁 "Stuff" (塞入) 各大銀行、社交媒體同埋企業 VPN 嘅 Login 頁面。正正因為密碼重用嘅問題，有相當大比例嘅攻擊係會成功嘅。
4. **釣魚攻擊 (Phishing):** 社交工程攻擊會用各種手段，呃用戶喺啲假冒嘅登入畫面度親手打自己個密碼。無論你 Backend 個密碼 Hash 得幾勁幾安全，都防範唔到用戶自願將 Plaintext (明文) 密碼雙手奉上俾黑客。

為咗應對呢啲關乎系統生死存亡嘅風險，網絡安全業界強制推行咗一個典範轉移 (Paradigm Shift)，轉向「多因素驗證」(Multi-Factor Authentication, MFA)，而最普遍嘅實作方式就係「雙重認證」(Two-Factor Authentication, 2FA)。

呢個包含 10 個部分嘅超詳盡教學系列，將會帶領你走過一趟絕對完整嘅旅程，教你點樣由零開始設計、規劃架構，並且親手 Implement 一個企業級嘅 Time-based One-Time Password (TOTP) 系統。我哋絕對唔會用「黑盒 (Black box)」方案；我哋會親手寫最核心嘅密碼學結構、用 TypeORM 建立信封加密 (Envelope Encryption) 嘅儲存機制、建構 React UI 嘅 6 格 Code Input components，同埋設立滴水不漏嘅角色權限控制 (RBAC) 嚟處理 Admin 嘅強制干預。

睇完呢個龐大嘅系列之後，你唔單止會識得點樣 Implement TOTP，你仲會深刻理解到 Clean code 嘅原則、Software design patterns (軟件設計模式)，同埋密碼學理論。呢啲深層次嘅知識，就係區分一個只係識 Copy-paste 嘅業餘愛好者，同一個能夠打造 Production-ready 驗證堡壘嘅頂級工程師嘅關鍵！

---

## 深度探討：驗證技術嘅三大支柱 (The Triad Factors)

要明白點解 TOTP 會成為業界嘅 Standard，我哋首先要深入理解咩叫「驗證要素」(Authentication Factor)。安全業界全世界公認將驗證要素分為三大類：

### 1. 知識要素 (Something you know - 你所知道的)
呢個係最古老亦都係最普及嘅要素。佢包含咗任何只存在於用戶記憶之中嘅嘢。
- **密碼與通行碼 (Passwords and Passphrases):** 最標準嘅字元組合。
- **個人識別碼 (PINs):** 通常用喺撳錢 (ATM) 或者解鎖手機。
- **安全問題 (Security Questions):** 「你第一隻寵物叫咩名？」(注意：現代系統極度唔建議用呢招，因為答案通常可以喺公開記錄搵到，或者透過社交工程輕易起底)。

知識要素有一個致命嘅缺陷：佢可以被無限次複製，而物主係完全唔會發覺嘅。如果我知道咗你個密碼，我喺地球嘅另一邊都可以隨時用，而你個密碼依然完好無缺咁存在喺你個腦入面。直到做成無可挽回嘅損失之前，你係完全唔會知道密碼已經洩漏咗。

### 2. 擁有物要素 (Something you have - 你所擁有的)
呢個要素要求用戶必須持有一件特定嘅實體或者數碼 Token。要攻破呢個要素，黑客必須親自偷走嗰件實體物件，或者入侵裝住嗰個數碼 Token 嘅特定裝置。
- **硬體安全密碼匙 (Hardware Security Tokens):** 例如 YubiKey 或者 RSA SecurID。呢啲實體 USB 裝置會 Generate codes 或者進行密碼學握手 (Cryptographic handshakes)。
- **裝咗 Authenticator Apps 嘅智能手機:** 例如 Google Authenticator 或者 Authy。部機入面藏有一條 Cryptographic secret，用嚟 Generate 基於時間嘅密碼。
- **SMS / Email 驗證碼:** 傳送到特定 SIM 卡或者 Email inbox 嘅一次性密碼。

擁有物要素比知識要素強大得多，因為佢極難被複製。不過要留意，SMS 而家已經被視為一個非常脆弱嘅擁有物要素，原因係 SIM Swapping 攻擊 (黑客呃電訊商將受害人個號碼轉移去黑客張 SIM 卡度) 以及 SS7 網絡協議嘅底層漏洞。

### 3. 生物特徵要素 (Something you are - 你所具備的)
呢個涉及生物特徵驗證——量度個人獨有嘅物理或者行為特徵。
- **指紋掃描:** TouchID。
- **人臉識別:** FaceID, Windows Hello。
- **虹膜/視網膜掃描:** 通常用喺極度高設防嘅物理環境。

雖然生物特徵非常方便，但佢哋隱藏住一個極大嘅風險：佢哋係 **無法被輪換 (Cannot be rotated)** 嘅。密碼俾人偷咗，你可以改過個新嘅。但如果你嘅指紋 Data 喺一次 Data breach 裡面外洩咗，你係冇辦法生過十隻新手指出嚟嘅。因此，生物特徵通常會被嚴格限制喺裝置本地 (Local) 處理 (例如 Apple 嘅 Secure Enclave)，佢哋嘅作用係用嚟「解鎖」一條本地嘅 Cryptographic key，而絕對唔會將指紋 Data 傳送過 Network。

一個強大嘅 2FA 系統，最少要結合呢三種要素入面嘅兩種。喺我哋嘅 TOTP 實作入面，我哋正正就係將 **知識要素** (用戶嘅普通密碼) 同埋 **擁有物要素** (由專門存放喺手機入面嘅密碼學 Secret 所 Generate 出嚟嘅 TOTP code) 完美結合。

---

## 演算法解碼：由 HOTP 邁向 TOTP 嘅進化史

要喺數學層面上徹底理解 TOTP，我哋首先要分析佢嘅前身：HOTP (HMAC-based One-Time Password)。呢個標準係由 IETF (互聯網工程任務組) 喺 RFC 4226 裡面定義嘅。

### HOTP 嘅數學原理 (RFC 4226)
HOTP 透過將一條 Secret key 同一個不斷遞增嘅 Counter 結合，嚟產生一個獨特而無法預測嘅密碼。佢嘅核心 Formula 概念上好簡單：

```text
HOTP(K, C) = Truncate(HMAC-SHA-1(K, C))
```

我哋嚟定義吓呢啲 Variables：
- **K (Key):** 一條秘密嘅密碼學鎖匙，由 Server 同 Client (硬體 Token) 獨家共享。佢最少要有 128 bits，但業界強烈建議用 160 bits (20 bytes)。
- **C (Counter):** 一個 8-byte 嘅移動因子。Server 同 Client 兩邊都必須嚴格 track 住呢個 Counter。每次 Generate 一個新嘅 Code，`C` 就會加 1。
- **HMAC-SHA-1:** 結合咗 SHA-1 雜湊函數 (Hash function) 嘅密碼學訊息鑑別碼演算法。
- **Truncate:** HMAC 運算會得出一個 20-byte (160-bit) 嘅 String。呢條 String 太長，人類根本無可能順利打到出嚟。Truncate 函數會進行動態偏移量計算 (Dynamic offset calculation)，由 20-byte 嘅 Hash 入面精準咁抽取出 4-byte 嘅動態 Binary code，然後再透過數學運算轉換成 6 位數或者 8 位數嘅號碼 (例如：`code = binary % 10^6`)。

#### HOTP 嘅致命弱點：失去同步 (Desynchronization)
HOTP 喺理論上完美無瑕，但喺人類嘅現實世界入面就錯漏百出。試幻想吓：如果一個用戶將個 RSA SecurID 鎖匙扣放落褲袋，然後個掣唔小心被銀包壓中咗 15 次，會發生咩事？

個硬體 Token 內部嘅 Counter 會遞增到 `C + 15`。但係，因為個用戶根本冇攞啲 Code 去登入，Server 嘅 Database 依然以為個 Counter 停喺 `C`。當用戶下次真係想登入嗰陣，佢提供嘅 Code 係屬於 `C + 16` 嘅。Server 滿心歡喜咁計咗個 `C + 1` 嘅 Code 出嚟對比，發現唔 match，即刻 Reject！

為咗解決呢個同步災難，Server 焗住要寫一個「向前看視窗 (Look-ahead window)」。如果 `C + 1` 錯咗，Server 就要硬住頭皮計 `C + 2`、`C + 3`，一直計到 `C + 50`。如果喺呢個範圍內搵到 Match，Server 就要將 Database 重新同步。呢個做法不但止極度消耗運算資源、邏輯複雜難搞，仲大大增加咗俾黑客暴力撞碼 (Brute-force) 嘅攻擊面。

### TOTP 嘅數學原理 (RFC 6238)
TOTP 展現咗天才級嘅巧思：佢將嗰個麻煩、需要 Keep state 嘅遞增 Counter `C`，替換成一個 Server 同 Client 宇宙共通嘅變數：**時間 (Time)**，從而完美解決同步問題！

TOTP 唔再 track Database 裡面嘅 Counter，而係計出一個 Time step，通常用 `T` 嚟代表。

```text
T = Math.floor((Current Unix Time - T0) / X)
```

- **Current Unix Time:** 由 1970 年 1 月 1 日 (UTC) 至今嘅總秒數。
- **T0:** Epoch 起始時間 (全世界絕大部分系統都係 set 做 `0`)。
- **X:** Time step 嘅大細 (全世界絕大部分系統都係 set 做 `30` 秒)。

之後，條 Formula 就係簡簡單單將 `C` 換成 `T`：

```text
TOTP(K, T) = Truncate(HMAC-SHA-1(K, T))
```

因為時間對於 Server 同埋 Client 手機流逝嘅速度係絕對一樣嘅，所以我哋 **完全唔需要** 喺 Database 度 keep 住任何有狀態 (Stateful) 嘅 Counter。只要 Client 個鐘同 Server 嘅 NTP (網絡時間協議) 鐘保持相對同步，每隔 30 秒 Generate 出嚟嘅 6 位數 Code 就會完美脗合。

---

## 密碼學原理：HMAC、SHA-1 與 Base32 編碼

### 解開 HMAC 嘅神秘面紗
你可能會問，點解要搞個咁複雜嘅 HMAC？點解唔直接將條 Key 同個時間夾埋一齊做個 Hash 就算，好似 `SHA1(Key + Time)` 咁？

簡單嘅串聯雜湊 (Concatenation hashing) 極容易遭受「長度擴展攻擊 (Length Extension Attacks)」。如果黑客知道咗 `Hash(Secret + Message)`，佢哋好多時可以透過數學推演，喺完全唔知道真正 `Secret` 係咩嘅情況下，強行計出 `Hash(Secret + Message + AttackerData)` 嘅結果。

HMAC 透過 RFC 2104 裡面定義嘅雙重嵌套密碼學結構完美封殺咗呢種攻擊：
```text
HMAC(K, m) = Hash((K XOR opad) || Hash((K XOR ipad) || m))
```
呢種結構保證咗最終得出嚟嘅 Hash，係同條 Secret key 以及特定嘅 Message (即係 Time step) 產生不可分割嘅綑綁，確保咗絕對嘅資料完整性同埋來源認證。

### 點解仲用 SHA-1？佢唔係喺密碼學上被破解咗咩？
喺 2017 年，Google 發布咗 "SHAttered" 研究，展示咗史上第一次針對 SHA-1 嘅實用碰撞攻擊 (Collision attack)，證明咗兩個內容完全唔同嘅 PDF file 可以 Generate 出一模一樣嘅 SHA-1 Hash。隨後，SHA-1 喺 SSL 證書同數碼簽署領域被全面淘汰。

咁點解 TOTP Default 仲係用緊 SHA-1？
原因係 TOTP 依賴嘅係 HMAC 結構所產生嘅「偽隨機性 (Pseudo-randomness)」，而唔單止係防碰撞能力。黑客要破解 HMAC-SHA-1，佢哋必須要進行「金鑰恢復攻擊 (Key-recovery attack)」，而以目前嘅算力嚟講，就算對手係 SHA-1，呢種攻擊依然係完全不可能實現嘅 (Computationally infeasible)。再者，雖然 RFC 6238 規範容許使用 HMAC-SHA-256 同 HMAC-SHA-512，但市面上絕大部分消費者用嘅 Authenticator apps (例如 Google Authenticator) 官方依然只支援 SHA-1。如果貿然轉用其他 Hash，會即刻打破系統嘅兼容性。

### Base32 編碼：考慮人類因素
當 Backend server generate 出一條隨機嘅 Secret key (K) 嗰陣，佢通常會產生 20 bytes 嘅原始 Entropy (亂數)。呢啲 Binary data 必須要傳送到用戶部手機度。我哋平時嘅做法，就係將佢收埋喺一條 `otpauth://` URI 入面，然後 render 成一個 QR code 俾用戶 Scan。

但如果用戶個鏡頭壞咗咁點算？佢哋就必須要人手將條 Secret 逐個字打落個 App 度。

如果我哋將嗰 20 bytes 轉做標準嘅 Base64，條 String 出到嚟會係咁嘅鬼樣：
`JbSwY3dpE/HpK3pXp=`

Base64 包含咗大量對人類排版極度唔友善嘅字元：
- `l` (細楷 L)、`1` (數字一)、同埋 `I` (大楷 i) 幾乎一模一樣。
- `O` (大楷 o) 同 `0` (數字零) 肉眼難以分辨。
- 仲有 `+` 同 `/` 呢啲非字母數字字元，喺手機 Keyboard 度極難打。

**Base32 完美解決咗呢一切問題。** 佢採用一個極度嚴格嘅 32 個字元字母表：只有 `A-Z` 同埋 `2-7`。佢刻意、完全排除了 `1`、`8`、`9` 同埋 `0` 呢四個數字。

結果得出嚟嘅 String 會變成咁：
`JBSWY3DPEHPK3PXP`

佢全大楷、冇任何令人混淆嘅數字。無論係喺電話度讀俾人聽，定係由用戶自己人手慢慢打，都極之清晰，大大減低因為打錯字而產生嘅「Invalid secret」Support Tickets！

---

## 架構模式：設計 TOTP 模組嘅最佳實踐

當我哋開發企業級嘅 Software 嗰陣，我哋絕對唔可以將所有密碼學邏輯炒埋一碟，全部塞晒落一個 Controller file 入面。我哋必須要嚴格應用領域驅動設計 (Domain-Driven Design, DDD) 同埋 SOLID 原則，確保我哋嘅 Code 係 Clean、易 Test、模組化兼且具備高擴展性。

### 1. 單一職責原則 (Single Responsibility Principle, SRP)
我哋嘅 `TotpService` 應該只承擔一項絕對清晰嘅責任：管理 TOTP 嘅 Domain logic。佢只應該負責 Generate secrets、驗證 Codes，同埋 Format 啲 Setup URI。

佢 **絕對唔應該** 負責驗證用戶密碼、處理 HTTP Request context 或者管理 Cookies。呢啲係 `AuthService` 同 `AuthController` 專屬嘅工作。透過徹底分離呢啲職責，我哋喺寫 Unit Test 去 Test `TotpService` 嗰陣，就完全唔需要 Mock 嗰啲極度複雜嘅 HTTP Request objects。

### 2. 依賴反轉原則 (Dependency Inversion Principle, DIP)
`TotpService` 嚴重依賴底層嘅密碼學運算嚟進行信封加密 (Envelope Encryption，我哋會喺第二篇文深入講)。與其將 Node.js 嘅 `crypto.createCipheriv` hardcode 死喺 TOTP service 入面，我哋應該將呢啲操作抽像化，隱藏喺一個 `EncryptionService` Interface 嘅背後。

呢個做法為系統留低咗極大嘅後路：將來如果公司 Scale up，要將加密運算遷移去硬體安全模組 (HSM) 或者 AWS KMS，我哋只需要換咗個 Encryption implementation 就得，核心嘅 TOTP Business logic 連一行 Code 都唔使改。

### 3. 為可擴展 2FA 鋪路嘅策略模式 (Strategy Pattern)
今日，Business team 話要 TOTP。聽日，佢哋可能就會要求加入 SMS 後備方案、Email 驗證碼，甚至係 WebAuthn (FIDO2) 嘅硬體鎖匙支援。為咗應付未來嘅需求，我哋今日就應該設計一個 Generic 嘅 `TwoFactorProvider` Interface。透過策略模式 (Strategy Pattern)，系統可以根據用戶嘅 Preference，喺 Runtime (執行階段) 動態注入合適嘅 Provider，確保你嘅架構永遠 Future-proof。

```typescript
// 企業級、可擴展 2FA 嘅 Clean Code 架構示範
export interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl?: string;
  recoveryCodes: string[];
}

export interface TwoFactorProvider {
  /**
   * 生成啟動 2FA 所需嘅 Secrets 同 Metadata。
   */
  generateSetupData(userId: string, email: string): Promise<TwoFactorSetupData>;
  
  /**
   * 根據用戶特定嘅密碼學狀態，驗證傳入嘅 Code。
   */
  verifyCode(userId: string, code: string): Promise<boolean>;
  
  /**
   * 徹底停用 2FA，並將相關嘅密碼學材料完全銷毀。
   */
  disable(userId: string): Promise<void>;
}

// 實體 Implementation 例子
export class TotpProvider implements TwoFactorProvider {
  // 運用 otplib 同 AES 信封加密
}

export class SmsProvider implements TwoFactorProvider {
  // 運用 Twilio API 同 Redis 緩存
}

export class WebAuthnProvider implements TwoFactorProvider {
  // 運用 navigator.credentials 同公鑰密碼學
}
```

喺跟住落嚟嘅文章入面，我哋會將呢啲高層次嘅架構模式，一步一步轉化成真金白銀、可以即刻擺上 Production 行嘅 NestJS Backend code！我哋會涵蓋極度複雜嘅 Database 設計、信封加密 Pipeline、Node.js 記憶體管理，同埋詳盡無遺嘅審計日誌 (Audit Logging) 系統。敬請期待！
