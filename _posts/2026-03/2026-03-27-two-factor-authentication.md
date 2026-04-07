---
title: "Two-Factor Authentication (2FA) Explained: Why One Password Isn't Enough | 雙重認證 (2FA) 係咩？點解淨係靠密碼唔夠安全"
date: 2026-03-27 14:00:00 +0800
categories: [Security, Technology]
tags: [security, 2fa, authentication,assisted_by_ai]
image:
  path: /assets/img/posts/2026-03-27/2fa.jpg
  lqip: data:image/webp;base64,UklGRpoAAABXRUJQVlA4WAoAAAAQAAAADwAABwAAQUxQSDIAAAARL0AmbZurmr57yyIiqE8oiG0bejIYEQTgqiDA9vqnsUSI6H+oAERp2HZ65qP/VIAWAFZQOCBCAAAA8AEAnQEqEAAIAAVAfCWkAALp8sF8rgRgAP7o9FDvMCkMde9PK7euH5M1m6VWoDXf2FkP3BqV0ZYbO6NA/VFIAAAA
toc: true
---

When we talk about account security, "using a strong password" is the most common advice. But in reality, passwords alone are far from enough. That's where **Two-Factor Authentication (2FA)** comes in.

### What is 2FA?

2FA requires **two different types** of authentication factors to verify your identity. It's like needing both a key and a PIN to open a safe—even if someone steals your key, they still can't get in without the PIN.

### The Three Authentication Factors

There are three categories of authentication factors:

**1. Something you KNOW**  
This is knowledge-based—something only you know.  
Examples: password, PIN, security questions

**2. Something you HAVE**  
This is possession-based—something only you physically have.  
Examples: phone, smart card, hardware key, TOTP app

**3. Something you ARE**  
This is biometric—something that is uniquely you.  
Examples: fingerprint, face recognition, iris scan, voice print

For 2FA to be effective, you need to combine factors from **different categories**. Using two passwords (e.g., password + security question) doesn't count as true 2FA—both are "something you know."

### Why Passwords Alone Aren't Enough

Passwords face many threats:

- **Leaks**: Database breaches, phishing websites
- **Guesses**: Weak passwords, dictionary attacks
- **Theft**: Keyloggers, man-in-the-middle attacks
- **Reuse**: Same password across multiple sites

Once an attacker obtains your password, they have **complete control** over your account. There's no second line of defense.

### How 2FA Protects You

With 2FA enabled:

```
Attacker knows your password ✓
But doesn't have your second factor ✗
→ Login failed
```

Even if your password is compromised, the attacker still needs your second factor (phone, hardware key, fingerprint) to access your account.

### Common 2FA Methods

| Method | Security Level | Notes |
|--------|---------------|-------|
| Password + SMS | Medium | SMS can be intercepted via SIM swapping |
| Password + TOTP | High | Offline generation, no dependency on telecom |
| Password + Hardware Key | Highest | Phishing-resistant, requires physical device |

**SMS** is convenient but has known vulnerabilities. Attackers can perform SIM swapping to intercept your verification codes.

**TOTP** (Time-based One-Time Password) apps like Google Authenticator or Authy generate codes locally. These codes expire every 30 seconds and work offline.

**Hardware keys** (like YubiKey) are the gold standard. They're immune to phishing and require physical possession to use.

### What About Single Sign-On (SSO)?

You might wonder: "I use Google/Facebook login everywhere—isn't that 2FA?"

Not exactly. SSO uses **one identity provider** to authenticate. When you log in with Google, you're trusting Google to verify you. But if your Google account gets compromised, everything linked to it is vulnerable.

True 2FA adds protection **at each service** you use. Even if one account is breached, others remain secure.

### Summary

Passwords are no longer sufficient in today's threat landscape. 2FA adds a critical second layer of defense by requiring something you have or something you are, in addition to something you know.

For better security:
- Enable 2FA on all important accounts
- Prefer TOTP or hardware keys over SMS
- Use different second factors for high-value accounts

---

- - -

講帳戶安全，我哋成日聽到「用強啲嘅密碼」。但係現實係：淨靠密碼真係唔夠安全 —— 所以就出現咗 **雙重認證 (2FA, Two-Factor Authentication)**。

### 2FA 係咩？

2FA 要你證明自己 **用兩種唔同類型** 嘅認證因素。就好似開夾萬要「鎖匙 + 密碼」咁——就算有人偷到你鎖匙，冇密碼都一樣開唔到。

### 認證因素分三類

**1. 你知道嘢 (Something you KNOW)**  
知識型——淨係你自己知。  
例如：密碼、PIN、安全問題答案

**2. 你擁有嘢 (Something you HAVE)**  
持有型——實體上你有嘅嘢。  
例如：手機、智慧卡、硬體金鑰、TOTP App

**3. 你本身係啲咩 (Something you ARE)**  
生物特徵型——你自己身上有、獨一無二。  
例如：指紋、臉部辨識、虹膜、聲紋

真正有效嘅 2FA 要 **跨類別組合** 因素。用兩個「你知道」嘅嘢（密碼 + 安全問題）唔算真正嘅 2FA。

### 點解淨係密碼唔夠？

密碼面對好多威脅：

- **洩露**：資料庫外洩、釣魚網站
- **猜測**：弱密碼、字典攻擊
- **竊取**：鍵盤側錄、中間人攻擊
- **重用**：同一密碼打爆哂全部網站

→ 攻擊者攞到你密碼 = 完全控制你帳戶，冇第二層防線

### 2FA 点保護你？

就算密碼被發現咗：

```
攻擊者有你密碼 ✓
但係冇你第二因素（手機／指紋／硬件鎖） ✗
→ 登入失敗
```

### 常見 2FA 方法

| 方法 | 安全程度 | 備註 |
|------|---------|------|
| 密碼 + SMS | 中 | SMS 可以被攔截（SIM swap） |
| 密碼 + TOTP | 高 | 離線生成，唔靠電信網絡 |
| 密碼 + 硬件鎖 | 最高 | 防釣魚，要實體設備 |

**SMS** 方便但有已知漏洞——SIM swap 攻擊可以截獲你嘅驗證碼。

**TOTP**（時間型一次性密碼）例如 Google Authenticator、Authy，會喺手機本地生成密碼，每 30 秒換一次，離線都用得。

**硬件金鑰**（例如 YubiKey）係最高標準——完全免疫於釣魚，要物理上拎住先用得。

### 咁用 Google/Facebook 登入算唔算 2FA？

其實唔係。SSO（單一登入）係信賴第三方幫你驗證身份。你用 Google 登入，其實係信佢。但如果 Google 帳戶被人撳咗，所有 linked 嘅服務都有機會仆直。

真正嘅 2FA 係幫你 **每個服務** 都加多層保護 —— 就算一個仆咗，其他都仲安全。

### 總結

响今日嘅威脅環境下，淨靠密碼已經唔夠安全。2FA 透過要求「你知道」+「你有」或「你係」，為你嘅帳戶多加關鍵嘅第二層防線。

想更安全：
- 幫所有重要帳戶開 2FA
- 用 TOTP 或硬件鎖取代 SMS
- 高價值帳戶用唔同嘅第二因素