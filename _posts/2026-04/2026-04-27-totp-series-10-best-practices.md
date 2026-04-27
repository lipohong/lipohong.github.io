---
title: "TOTP Series Part 10: The Ultimate Enterprise Review, Security Patterns, and Production Best Practices | TOTP 系列之十：企業級終極回顧、安全模式與生產環境最佳實踐"
date: 2026-04-27 14:30:00 +0800
categories: [Security, TOTP Series]
tags: [totp, best-practices, security, summary, architecture, nodejs, react, redis, assisted_by_ai]
toc: true
---

## The Complete 2FA Architecture

We have reached the culmination of our comprehensive series on building a Time-Based One-Time Password (TOTP) system. Over the past 9 posts, we have journeyed from the foundational cryptography of HMAC-SHA-1 to the complexities of Envelope Encryption, and finally down to the subtle UX psychology of React frontend design.

Adding Two-Factor Authentication to an application is not simply a matter of importing a library like `otplib` and validating a 6-digit string. As we have seen, a naive implementation exposes an enterprise to catastrophic risks: Replay attacks, memory dumping, plaintext database breaches, brute-force locking vulnerabilities, and destructive UI accidents. 

When you deploy a 2FA system to production, you are not just writing a feature; you are building the main gate of your application's security fortress. If this gate is poorly designed, no amount of internal security will save you. In this final, massive post, we will summarize the definitive Best Practices and Security Pitfalls, providing deep-dive code examples for atomic operations, rate limiting, and end-to-end testing that developers must memorize when architecting a 2FA system for an enterprise environment.

---

## Deep Dive: The 6 Pillars of Enterprise TOTP

### Pillar 1: Cryptographic Envelope Encryption
**Never store TOTP secrets in plaintext.** A database leak should never result in compromised 2FA. 
In a production environment, you must use a **Data Encryption Key (DEK)** generated uniquely per user to encrypt the TOTP secret, and a global **Key Encryption Key (KEK)** to encrypt the DEKs.

#### Advanced AEAD Encryption (AES-256-GCM)
We utilize **AES-256-GCM** to provide Authenticated Encryption with Associated Data (AEAD), ensuring that any tampering with the ciphertext throws an immediate error upon decryption. Here is the robust implementation you should use:

```typescript
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EnterpriseEncryptionService {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 12; // 96 bits for GCM
  private readonly AUTH_TAG_LENGTH = 16; // 128 bits for GCM Auth Tag

  encrypt(plaintext: string, keyBuffer: Buffer): string {
    if (keyBuffer.length !== 32) {
      throw new InternalServerErrorException('Invalid KEK length. Must be 32 bytes for AES-256.');
    }

    try {
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag().toString('hex');
      
      // Combine IV, AuthTag, and Ciphertext
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      throw new InternalServerErrorException('Encryption process failed.');
    }
  }

  decrypt(encryptedPayload: string, keyBuffer: Buffer): string {
    try {
      const parts = encryptedPayload.split(':');
      if (parts.length !== 3) throw new Error('Invalid payload structure');

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const ciphertext = parts[2];

      const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // AuthTag validation failure will be caught here
      throw new InternalServerErrorException('Decryption failed. Data may be tampered with.');
    }
  }
}
```

#### Proper Memory Management
When rotating the KEK (which should be done regularly via a KMS like AWS Key Management Service), explicitly zero-out the old key from Node.js memory using `buffer.fill(0)` to prevent memory dumping attacks.

```typescript
function wipeKeyFromMemory(keyBuffer: Buffer) {
  if (Buffer.isBuffer(keyBuffer)) {
    keyBuffer.fill(0); // Instantly overwrites the memory addresses with zeros
  }
}
```

---

### Pillar 2: Stateful Replay Protection via Atomic Redis Scripts
A TOTP code is valid for an entire 30-second window (or longer if using epoch tolerances). You **must** implement a stateful cache (like Redis) to "blacklist" successfully verified codes.

However, checking the cache and then setting the cache is a two-step process. In a highly concurrent environment, a sophisticated attacker could send two identical TOTP requests at the exact same millisecond. If both requests read the cache before either writes to it, the Replay Attack succeeds. This is a classic **Race Condition**.

To solve this, we must use an atomic Redis LUA script or the Redis `SET NX` command.

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { Redis } from 'ioredis'; // Assuming standard ioredis usage

@Injectable()
export class ReplayProtectionService {
  constructor(private readonly redisClient: Redis) {}

  /**
   * Attempts to blacklist a code atomically.
   * Returns true if successful (code was not used).
   * Returns false if the code is already blacklisted (Replay attack).
   */
  async ensureUniqueCode(userId: string, code: string, windowTtlSeconds: number): Promise<boolean> {
    const cacheKey = `totp_used:${userId}:${code}`;
    
    // SET NX = Set if Not eXists
    // EX = Expire in X seconds
    // This command is atomic. If two requests hit at the same time, only one gets "OK"
    const result = await this.redisClient.set(cacheKey, 'USED', 'EX', windowTtlSeconds, 'NX');
    
    if (result !== 'OK') {
      throw new BadRequestException('Invalid TOTP Code'); // Replay detected!
    }
    
    return true;
  }
}
```

---

### Pillar 3: Clock Drift Mitigation and Tolerance Expansion
Human clocks are imperfect. Relying strictly on a single `T` window guarantees frustrated users. You must configure your authenticator library to accept an `epochTolerance` (or `window` spread) of ±1 step. This checks the previous 30 seconds and the future 30 seconds.

```typescript
import { authenticator } from 'otplib';

// Globally set the tolerance to ±1 window (90 seconds total validity)
authenticator.options = {
  window: 1 
};

// ... During verification ...
const isValid = authenticator.check(userInputCode, decryptedSecret);
```

**CRITICAL RULE:** Expanding the tolerance window means you **must** increase the TTL of your Replay Protection cache to match the new overall duration (e.g., 90 seconds). If you leave the TTL at 30 seconds, an attacker can capture a code from the `T+1` window, wait 30 seconds for your cache to clear, and successfully replay it while it is still mathematically valid!

```typescript
// The TTL must encompass T-1, T, and T+1
const expandedTtl = 30 * 3; // 90 seconds
await replayProtectionService.ensureUniqueCode(userId, code, expandedTtl);
```

---

### Pillar 4: Brute-Force and Rate Limiting Architecture
A 6-digit code has only 1,000,000 possible combinations. Without protection, an automated script can guess the correct code in seconds. We must track `totpAttemptCount` in the database.

#### The Lockout Service
If the user fails 5 consecutive times, **lock the account** immediately.

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class RateLimitingService {
  async handleFailedAttempt(user: User) {
    user.totpAttemptCount += 1;
    
    if (user.totpAttemptCount >= 5) {
      user.isLocked = true;
      user.lockedAt = new Date();
      await this.userRepository.save(user);
      
      await this.auditLog.log('ACCOUNT_LOCKED_2FA_BRUTE_FORCE', user.id);
      throw new UnauthorizedException('Account locked due to too many failed attempts.');
    }
    
    await this.userRepository.save(user);
    throw new UnauthorizedException('Invalid 2FA Code');
  }

  async resetAttempts(user: User) {
    if (user.totpAttemptCount > 0) {
      user.totpAttemptCount = 0;
      await this.userRepository.save(user);
    }
  }
}
```

This same brute-force protection must apply to the Self-Service "Reset 2FA via Password" API. An attacker shouldn't be able to brute-force a user's password using the Reset endpoint.

---

### Pillar 5: Advanced Frontend UX Safety and Routing
The Frontend is the first line of defense against user errors and UX frustrations.

#### 1. Session Storage vs Local Storage
During Partial Authentication, you must intercept login responses that require 2FA and store a temporary token. **Use `sessionStorage` for this temporary token**, not `localStorage`. `sessionStorage` is cleared when the tab is closed, ensuring that an abandoned partial login state doesn't linger forever.

#### 2. The 6-Box Input Component
Do not use a single `type="number"` input. Use an array of refs to build a professional 6-box component. Here is the definitive React implementation handling Backspace and Paste correctly.

```tsx
import React, { useState, useRef } from 'react';

export const EnterpriseTotpInput = ({ onComplete }) => {
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    if (pasted.length === 6) {
      onComplete(pasted);
      inputs.current[5]?.focus();
    } else {
      inputs.current[pasted.length]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!code[i] && i > 0) {
        // Retreat and clear
        const newCode = [...code];
        newCode[i - 1] = '';
        setCode(newCode);
        inputs.current[i - 1]?.focus();
      } else {
        // Just clear
        const newCode = [...code];
        newCode[i] = '';
        setCode(newCode);
      }
    }
  };

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[i] = digit;
    setCode(newCode);

    if (digit && i < 5) inputs.current[i + 1]?.focus();
    if (newCode.every(c => c !== '')) onComplete(newCode.join(''));
  };

  return (
    <div className="flex gap-2 justify-center">
      {code.map((v, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          value={v}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          maxLength={2}
          className="w-12 h-14 text-center text-2xl border-2 rounded-lg"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
};
```

#### 3. Hide Destructive Actions
Keep "Reset 2FA" actions strictly separated from standard Edit Profile forms. Force explicit confirmation modals with red warning texts to prevent accidental account modification.

---

### Pillar 6: Comprehensive End-to-End Testing
You must write automated tests to verify the flow. Using Jest for the backend and Cypress for the frontend ensures you don't break the encryption logic during future updates.

```typescript
// Backend Jest Test Example
describe('TOTP Verify', () => {
  it('should block replay attacks immediately', async () => {
    const code = authenticator.generate(mockSecret);
    
    // First attempt should succeed
    const firstRes = await totpService.verifyLoginTotp(mockUser.id, code, mockEncrypted, mockDek);
    expect(firstRes).toBe(true);

    // Second attempt at exact same second should throw Replay Error
    await expect(
      totpService.verifyLoginTotp(mockUser.id, code, mockEncrypted, mockDek)
    ).rejects.toThrow('Invalid TOTP Code');
  });
});
```

---

## Conclusion
Building a secure authentication gateway is one of the most critical responsibilities of a software engineer. By adhering to Clean Code architectures, Domain-Driven Design, Atomic Redis operations, and the security principles outlined in this series, you can ensure that your application remains a fortress against modern cyber threats, while still delivering a seamless and pleasant experience for your users.

Happy coding, and stay secure!

---

## 企業級架構嘅終極回顧

我哋終於嚟到呢個 Time-Based One-Time Password (TOTP) 系統開發系列嘅最尾一篇啦。喺過去嘅 9 篇文裡面，我哋由 HMAC-SHA-1 最底層嘅密碼學基礎開始，走入去信封加密 (Envelope Encryption) 嘅複雜世界，最後探討到 React Frontend 設計背後微妙嘅 UX 心理學。

為一個 Application 加入雙重認證 (2FA) 絕對唔係淨係 `npm install otplib` 然後 verify 吓條 6 位數 string 咁簡單。正如我哋所見，一個天真 (Naive) 嘅 Implementation 會為企業帶嚟災難性嘅風險：重放攻擊 (Replay attacks)、記憶體傾印 (Memory dumping)、Plaintext Database 洩漏、暴力破解 (Brute-force locking) 漏洞，同埋破壞性嘅 UI 意外操作。

當你要將一個 2FA 系統擺上 Production 環境嗰陣，你唔單止係寫緊一個 Feature；你係起緊成個 Application 保安堡壘嘅大閘。如果呢度大閘設計得衰，入面嘅內部保安做得幾好都冇用。喺呢篇終極嘅超長回顧入面，我哋會總結所有開發者喺構建企業級 2FA 系統時，必須要死記硬背嘅「最佳實踐 (Best Practices)」同埋「保安中伏位 (Security Pitfalls)」。我哋仲會提供一啲非常深入嘅 Code examples，涵蓋原子性操作 (Atomic operations)、Rate limiting 同埋 E2E Testing，確保你個系統滴水不漏。

---

## 深度探討：企業級 TOTP 嘅六大支柱

### 支柱一：密碼學信封加密 (Cryptographic Envelope Encryption)
**千祈、千祈、千祈唔好將 TOTP secrets 就咁 Plaintext save 落 Database。** Database 洩漏絕對唔應該導致 2FA 系統全面淪陷。
喺 Production 環境入面，你必須為每個用戶獨立 Generate 一條 **資料加密金鑰 (DEK)** 用嚟 Encrypt 個 TOTP secret，同埋用一條全局嘅 **金鑰加密金鑰 (KEK)** 去 Encrypt 啲 DEKs。

#### 進階 AEAD 加密 (AES-256-GCM)
我哋採用 **AES-256-GCM** 來提供認證加密 (AEAD)，確保只要 Ciphertext 俾人竄改過哪怕一個 bit，Decrypt 嗰陣都會即刻 throw error。呢度係你應該要用嘅 Robust implementation：

```typescript
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EnterpriseEncryptionService {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 12; // GCM 用 96 bits IV
  private readonly AUTH_TAG_LENGTH = 16; // GCM Auth Tag 用 128 bits

  encrypt(plaintext: string, keyBuffer: Buffer): string {
    // 安全檢查：確保 KEK 係 exactly 32 bytes
    if (keyBuffer.length !== 32) {
      throw new InternalServerErrorException('KEK 長度錯誤，AES-256 必須係 32 bytes。');
    }

    try {
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag().toString('hex');
      
      // 將 IV、AuthTag 同 Ciphertext 結合成一條 String
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      throw new InternalServerErrorException('加密過程失敗。');
    }
  }

  decrypt(encryptedPayload: string, keyBuffer: Buffer): string {
    try {
      const parts = encryptedPayload.split(':');
      if (parts.length !== 3) throw new Error('加密資料結構錯誤');

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const ciphertext = parts[2];

      const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // 任何 AuthTag 驗證失敗都會喺呢度被 Catch 到
      throw new InternalServerErrorException('解密失敗。資料可能已被竄改。');
    }
  }
}
```

#### 正確嘅記憶體管理 (Proper Memory Management)
當輪換 (Rotate) 條 KEK 嗰陣 (通常透過 AWS KMS 呢啲服務定期做)，一定要明確地用 `buffer.fill(0)` 喺 Node.js 嘅 Memory 度抹走條舊 key，防止 Memory dump 攻擊。

```typescript
function wipeKeyFromMemory(keyBuffer: Buffer) {
  if (Buffer.isBuffer(keyBuffer)) {
    keyBuffer.fill(0); // 瞬間將 Memory Address 嘅內容全部填滿做 0
  }
}
```

---

### 支柱二：運用 Redis 原子性操作防禦重放攻擊
一個 TOTP code 喺足足 30 秒嘅 window 內都係 Valid 嘅。你 **必須** Implement 一個有狀態嘅 Cache (例如 Redis) 來將成功驗證過嘅 Codes 擺入「黑名單」。

不過，如果你嘅 Code 係「先 Check Cache，然後再 Set Cache」，呢個係一個兩步嘅過程。喺一個高併發 (Highly concurrent) 嘅環境入面，一個聰明嘅黑客可以喺同一毫秒內 Send 兩個一模一樣嘅 TOTP requests。如果兩個 Request 都喺未 Write 之前一齊 Read 咗個 Cache，重放攻擊 (Replay Attack) 就會得手。呢個就係經典嘅 **Race Condition (競爭危害)**。

要解決呢個問題，我哋必須要用 Redis 嘅原子性 (Atomic) LUA Script，或者直接用 Redis 嘅 `SET NX` command。

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { Redis } from 'ioredis'; // 假設我哋用緊 standard 嘅 ioredis

@Injectable()
export class ReplayProtectionService {
  constructor(private readonly redisClient: Redis) {}

  /**
   * 嘗試以原子性方式將 Code 加入黑名單。
   * 如果成功 (個 Code 未用過)，Return true。
   * 如果失敗 (個 Code 已經喺黑名單度)，Return false 代表中咗 Replay attack。
   */
  async ensureUniqueCode(userId: string, code: string, windowTtlSeconds: number): Promise<boolean> {
    const cacheKey = `totp_used:${userId}:${code}`;
    
    // SET NX = Set if Not eXists
    // EX = Expire in X seconds
    // 呢個 Command 係 Atomic 嘅。就算同一時間有兩個 Request 殺到，都只會有一個攞到 "OK"
    const result = await this.redisClient.set(cacheKey, 'USED', 'EX', windowTtlSeconds, 'NX');
    
    if (result !== 'OK') {
      throw new BadRequestException('驗證碼錯誤'); // 成功偵測到重放攻擊！
    }
    
    return true;
  }
}
```

---

### 支柱三：減輕時間漂移與寬容度擴展
人類部電話嘅時鐘係好唔準嘅。如果你死板板淨係 Check 一個 `T` window，保證啲用戶會投訴到爆。你必須 Config 你個 Authenticator library，設定 `epochTolerance` 容許 ±1 個 step。即係同時 Check 埋過去 30 秒同未來 30 秒。

```typescript
import { authenticator } from 'otplib';

// 全局設定 Tolerance 係 ±1 個 window (總共 90 秒 Validity)
authenticator.options = {
  window: 1 
};

// ... 喺 verifyLoginTotp 入面 ...
const isValid = authenticator.check(userInputCode, decryptedSecret);
```

**極度重要嘅法則：** 寬度大咗，代表你個 Replay Protection cache 嘅 TTL **必須** 跟住加長 (變做 90 秒) 去 Match 返成個有效時間。如果你個 TTL 仲係 keep 住 30 秒，黑客就可以偷一個屬於 `T+1` (未來) 嘅 Code，等 30 秒你個 Cache 過期清空咗之後，趁個 Code 仲係 Valid 嗰陣強行 Replay 入來！

```typescript
// TTL 必須覆蓋 T-1, T, 同埋 T+1
const expandedTtl = 30 * 3; // 90 秒
await replayProtectionService.ensureUniqueCode(userId, code, expandedTtl);
```

---

### 支柱四：防禦暴力破解與 Rate Limiting 架構
一個 6 位數 Code 得嗰一百萬個組合。如果冇保護機制，一個寫得好嘅 Script 幾秒鐘就可以撞中。我哋必須喺 Database 度 track 住 `totpAttemptCount`。

#### Lockout Service
如果用戶連續撞錯 5 次，即刻 **Lock 死個 Account**。

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class RateLimitingService {
  async handleFailedAttempt(user: User) {
    user.totpAttemptCount += 1;
    
    if (user.totpAttemptCount >= 5) {
      user.isLocked = true;
      user.lockedAt = new Date();
      await this.userRepository.save(user);
      
      await this.auditLog.log('ACCOUNT_LOCKED_2FA_BRUTE_FORCE', user.id);
      throw new UnauthorizedException('太多次失敗嘗試，你嘅帳號已被鎖定。');
    }
    
    await this.userRepository.save(user);
    throw new UnauthorizedException('驗證碼錯誤');
  }

  async resetAttempts(user: User) {
    if (user.totpAttemptCount > 0) {
      user.totpAttemptCount = 0;
      await this.userRepository.save(user);
    }
  }
}
```

同樣嘅 Brute-force 防護必須應用落 Self-Service 嘅「密碼重置 2FA」API 度。絕對唔可以俾黑客利用 Reset endpoint 嚟瘋狂撞用戶個登入密碼。

---

### 支柱五：高階 Frontend UX 安全網與 Routing
Frontend 係防止用戶犯錯嘅第一道防線。

#### 1. Session Storage vs Local Storage
喺「部分驗證 (Partial Authentication)」期間，你要攔截需要 2FA 嘅 login responses，並儲存一個臨時 Token。**呢個臨時 Token 一定要用 `sessionStorage` 裝住**，而唔好用 `localStorage`。`sessionStorage` 會喺用戶山咗個 Browser tab 嗰陣自動清空，確保呢個未完成嘅 login 狀態唔會永遠殘留。

#### 2. 6 格 Input Component
唔好用一個單丁嘅 `type="number"` Input。用一個 Array 嘅 Refs 嚟整一個專業嘅 6 格 Component。呢度提供埋完美處理 Backspace 同埋 Paste 嘅終極 React 寫法：

```tsx
import React, { useState, useRef } from 'react';

export const EnterpriseTotpInput = ({ onComplete }) => {
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    if (pasted.length === 6) {
      onComplete(pasted);
      inputs.current[5]?.focus();
    } else {
      inputs.current[pasted.length]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!code[i] && i > 0) {
        // 退返去上一格兼清空
        const newCode = [...code];
        newCode[i - 1] = '';
        setCode(newCode);
        inputs.current[i - 1]?.focus();
      } else {
        // 就咁清空當前呢格
        const newCode = [...code];
        newCode[i] = '';
        setCode(newCode);
      }
    }
  };

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[i] = digit;
    setCode(newCode);

    if (digit && i < 5) inputs.current[i + 1]?.focus();
    if (newCode.every(c => c !== '')) onComplete(newCode.join(''));
  };

  return (
    <div className="flex gap-2 justify-center">
      {code.map((v, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          value={v}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          maxLength={2}
          className="w-12 h-14 text-center text-2xl border-2 rounded-lg"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
};
```

#### 3. 隱藏破壞性動作
將 "Reset 2FA" 呢啲動作嚴格咁同普通嘅 Edit Profile forms 分開。強制彈出包含紅色警告字眼嘅雙重確認 Modal，防止手殘撳錯。

---

### 支柱六：全面嘅端到端測試 (End-to-End Testing)
你必須寫 Automated tests 去驗證成個 Flow。用 Jest 去 test Backend，用 Cypress 去 test Frontend，咁樣確保將來 Update 個 System 嗰陣，唔會唔小心搞冧咗啲 Encryption 邏輯。

```typescript
// Backend Jest 測試例子
describe('TOTP Verify', () => {
  it('應該即刻 Block 住 Replay Attacks', async () => {
    const code = authenticator.generate(mockSecret);
    
    // 第一次登入嘗試，應該成功
    const firstRes = await totpService.verifyLoginTotp(mockUser.id, code, mockEncrypted, mockDek);
    expect(firstRes).toBe(true);

    // 喺同一秒內做第二次嘗試，應該要掟出 Replay Error
    await expect(
      totpService.verifyLoginTotp(mockUser.id, code, mockEncrypted, mockDek)
    ).rejects.toThrow('驗證碼錯誤'); // 絕對唔可以回傳 "Replay Attack"，防範資訊洩漏
  });
});
```

---

## 結語
建構一個安全嘅驗證閘門，係 Software Engineer 其中一項最重大嘅責任。只要嚴格遵守 Clean Code 架構、領域驅動設計 (DDD)、運用 Redis 原子性操作，同埋呢個系列所提出嘅各種 Security 原則，你就可以確保你嘅 Application 成為一座堅不可摧嘅堡壘，能夠抵禦現代嘅網絡威脅，同時又能為你嘅用戶提供絲滑順暢嘅優質體驗！

Happy coding, and stay secure!
