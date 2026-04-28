---
title: "SSO Series Part 5: SAML 2.0 Integration & Assertion Processing | SSO 系列之五：SAML 2.0 整合與 Assertion 處理"
date: 2026-04-27 18:20:00 +0800
categories: [Security, SSO Series]
tags: [sso, saml, xml, security, typescript, nodejs, assisted_by_ai]
toc: true
---

## Introduction: The Enterprise Behemoth

In Part 4, we explored the modern, JSON-based world of OpenID Connect. Now, we must turn our attention to the heavyweight champion of corporate identity: **SAML 2.0** (Security Assertion Markup Language).

SAML 2.0 is an XML-based framework established in 2005. Despite its age, it remains deeply entrenched in large enterprises, government systems, and healthcare organizations. Working with SAML is notoriously difficult. Unlike JSON, XML requires exact string matching for signature verification—a process called **Canonicalization** (C14N). 

In Part 5, we will implement SAML 2.0 processing within our Strategy Architecture. We will explore how to generate secure Authentication Requests, validate XML Digital Signatures using X.509 certificates, prevent the infamous XML Signature Wrapping (XSW) attacks, and extract the `SessionIndex` required for enterprise Single Logout.

---

## 1. Initiating the Flow: The SAML AuthnRequest

When a user clicks a SAML login button, our application (the Service Provider or SP) must generate a `<samlp:AuthnRequest>` XML document, optionally sign it, encode it, and redirect the user to the Identity Provider (IdP).

### Security Rule: RelayState Protection
Just like the `state` parameter in OIDC, SAML uses `RelayState` to prevent CSRF attacks. The `RelayState` must be a cryptographically random, single-use token stored in our Redis cache.

```typescript
// src/sso/strategies/saml.strategy.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as saml from '@node-saml/node-saml';
import { ISsoProtocolStrategy } from '../interfaces/sso-strategy.interface';
import { IdpProviderConfig } from '../entities/idp-provider.entity';
import { SsoStateService } from '../services/sso-state.service';

@Injectable()
export class SamlStrategy implements ISsoProtocolStrategy {
  constructor(private readonly stateService: SsoStateService) {}

  /**
   * Instantiates the node-saml library dynamically based on DB config.
   */
  private buildSamlClient(config: IdpProviderConfig): saml.SAML {
    return new saml.SAML({
      entryPoint: config.ssoUrl,
      issuer: config.spEntityId,
      cert: config.idpPublicCertificates, // Array of X.509 cert strings
      identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
      wantAssertionsSigned: true,
      wantAuthnResponseSigned: false, // Usually the Assertion is signed, not the whole response
      disableRequestedAuthnContext: true,
    });
  }

  async initiateLogin(providerConfig: IdpProviderConfig, redirectUri: string): Promise<string> {
    const samlClient = this.buildSamlClient(providerConfig);
    
    // 1. Generate secure RelayState
    const relayState = await this.stateService.createContext({
      providerId: providerConfig.id,
      redirectUri: redirectUri,
    });

    // 2. Generate the Auth URL (HTTP-Redirect binding)
    try {
      const authUrl = await samlClient.getAuthorizeUrlAsync(relayState, null, {});
      return authUrl;
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate SAML AuthnRequest.');
    }
  }
}
```

---

## 2. Processing the SAML Response

When the user authenticates, the IdP sends an HTTP POST request back to our server. The body contains two critical parameters: `SAMLResponse` (Base64-encoded XML) and `RelayState`.

### The Threat: XML Signature Wrapping (XSW)
If you blindly parse the XML, find the `<Assertion>` node, and extract the `NameID`, you are vulnerable to XSW. An attacker can inject a fake, unsigned `<Assertion>` into the document and move the legitimate, signed `<Assertion>` to a different part of the XML tree. If your parser just looks for the "first" Assertion while the verifier checks the "signed" Assertion, the attacker achieves Account Takeover.

We rely on heavily audited libraries like `@node-saml/node-saml` to perform exact Canonicalization (C14N) and signature extraction to prevent this.

```typescript
  async processCallback(
    providerConfig: IdpProviderConfig, 
    payload: any, 
    storedState: SsoStateContext
  ): Promise<any> {
    
    const samlClient = this.buildSamlClient(providerConfig);

    // 1. Validate RelayState (CSRF Protection)
    if (!payload.RelayState || payload.RelayState !== storedState.stateId) {
      // NOTE: Our SsoStateService already deleted the state, so replay is impossible.
      throw new BadRequestException('Invalid RelayState. Possible CSRF attack.');
    }

    // 2. Validate and Parse the SAML Response
    let profile: saml.Profile;
    try {
      // validatePostResponseAsync handles XML parsing, C14N, and Signature Verification
      const { profile: extractedProfile } = await samlClient.validatePostResponseAsync({
        SAMLResponse: payload.SAMLResponse,
      });
      profile = extractedProfile;
    } catch (error) {
      throw new UnauthorizedException(`SAML Signature Validation Failed: ${error.message}`);
    }

    // 3. Extract Core Identifiers and Attributes
    // node-saml maps XML attributes to a JS object
    const normalizedPayload = {
      ...profile,
      _nameId: profile.nameID, 
      _sessionIndex: profile.sessionIndex, 
    };

    // 4. Store SessionIndex for Single Logout (SLO)
    if (profile.sessionIndex) {
      storedState.idpSessionId = profile.sessionIndex;
    } else {
      // Fallback to NameID if IdP does not support SessionIndex
      storedState.idpSessionId = profile.nameID;
    }

    return normalizedPayload;
  }
```

### Explanation of Validations

1. **Certificate Trust Model**: We use the `cert` array loaded from the Database. When the IdP rotates their certificates, our Auto-Discovery service (from Part 2) updates the DB. If the signature doesn't match one of these trusted X.509 certificates, the login is rejected.
2. **Canonicalization (C14N)**: XML allows formatting differences (spaces, line breaks, attribute ordering). Before checking the signature, the XML must be normalized to a standard format. `node-saml` handles this C14N process securely.
3. **Audience Restriction**: The XML `<AudienceRestriction>` must match our `spEntityId`. This prevents an attacker from replaying an assertion meant for a different service provider.
4. **Time Constraints**: The `<Conditions NotBefore="..." NotOnOrAfter="...">` elements dictate the assertion's lifetime. Our library checks these automatically, allowing for a small clock skew (usually 1-2 minutes).

---

## 3. Preparing for Single Logout (SLO)

Unlike OIDC which uses the `sid` claim, SAML uses the `SessionIndex` attribute within the `AuthnStatement` to identify the specific login session at the IdP.

If the IdP later wants to log the user out globally (IdP-Initiated Logout), they will send a `<LogoutRequest>` to our server containing this `SessionIndex`. 

By saving `profile.sessionIndex` into our `SsoStateContext` during the login phase, our core Session Management service can map the platform session to the IdP session. We will cover the mechanics of Single Logout deeply in Parts 6, 7, and 8.

## Conclusion

In Part 5, we have tamed the XML beast. By dynamically configuring a SAML client, protecting against CSRF with `RelayState`, and utilizing heavily vetted libraries to perform XML Signature Verification and C14N, we have built a highly secure SAML 2.0 integration. We successfully sidestepped XSW vulnerabilities and extracted the critical `SessionIndex` needed for enterprise session management.

In Part 6, we will shift gears from Logging In to Logging Out. We will explore **Single Logout (SLO): SP-Initiated Flows**, detailing how to securely tear down local sessions and notify the Identity Provider that the user has left the building.

<br><br><br>

---
---

## 簡介：企業級上古巨獸

喺第四集，我哋探索咗 OpenID Connect 呢個基於 JSON 嘅現代化世界。依家，我哋必須要面對企業身份認證界嘅終極大佬：**SAML 2.0** (Security Assertion Markup Language)。

SAML 2.0 係一個喺 2005 年定落嚟、建基於 XML 嘅 Framework。雖然佢年紀大，但佢喺大企業、政府系統同埋醫療機構入面依然係根深蒂固、穩如泰山。處理 SAML 係出咗名出名難搞嘅。同 JSON 唔同，XML 喺做 Signature verification 嗰陣要求 String matching 必須 100% 完美脗合——呢個過程叫做 **規範化 (Canonicalization, C14N)**。

喺第五集，我哋會將 SAML 2.0 嘅處理邏輯整合入去我哋嘅 Strategy 架構度。我哋會探討點樣 Generate 安全嘅 Authentication Requests、點樣用 X.509 Certificates 驗證 XML 數碼簽署、點樣防禦臭名遠播嘅 XML 簽名包裝 (XML Signature Wrapping, XSW) 攻擊，同埋點樣抽出企業級 Single Logout 必備嘅 `SessionIndex`。

---

## 1. 發起流程：SAML AuthnRequest

當一個 User 撳咗 SAML 登入掣，我哋個 Application (即係 Service Provider, SP) 必須要 Generate 一份 `<samlp:AuthnRequest>` 嘅 XML document，睇情況加個 Signature、Encode 咗佢，然後將個 User Redirect 去 Identity Provider (IdP)。

### 保安守則：RelayState 防護
就好似 OIDC 入面個 `state` Parameter 咁，SAML 會用 `RelayState` 去防禦 CSRF 攻擊。個 `RelayState` 必須係一個密碼學級別 Random、即用即棄 (Single-use) 嘅 Token，而且要 Cache 喺我哋嘅 Redis 入面。

```typescript
// src/sso/strategies/saml.strategy.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as saml from '@node-saml/node-saml';
import { ISsoProtocolStrategy } from '../interfaces/sso-strategy.interface';
import { IdpProviderConfig } from '../entities/idp-provider.entity';
import { SsoStateService } from '../services/sso-state.service';

@Injectable()
export class SamlStrategy implements ISsoProtocolStrategy {
  constructor(private readonly stateService: SsoStateService) {}

  /**
   * 根據 Database 嘅 Config，動態 Initialize node-saml library。
   */
  private buildSamlClient(config: IdpProviderConfig): saml.SAML {
    return new saml.SAML({
      entryPoint: config.ssoUrl,
      issuer: config.spEntityId,
      cert: config.idpPublicCertificates, // X.509 cert strings 嘅 Array
      identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
      wantAssertionsSigned: true, // 強制要求 Assertion 必須有簽名
      wantAuthnResponseSigned: false, // 通常係簽 Assertion，唔係簽成個 Response
      disableRequestedAuthnContext: true,
    });
  }

  async initiateLogin(providerConfig: IdpProviderConfig, redirectUri: string): Promise<string> {
    const samlClient = this.buildSamlClient(providerConfig);
    
    // 1. Generate 安全嘅 RelayState
    const relayState = await this.stateService.createContext({
      providerId: providerConfig.id,
      redirectUri: redirectUri,
    });

    // 2. Generate 條 Auth URL (用 HTTP-Redirect binding)
    try {
      const authUrl = await samlClient.getAuthorizeUrlAsync(relayState, null, {});
      return authUrl;
    } catch (error) {
      throw new InternalServerErrorException('無法產生 SAML AuthnRequest。');
    }
  }
}
```

---

## 2. 處理 SAML Response

當個 User 喺 IdP 嗰邊認證完，IdP 會發出一個 HTTP POST request 掟返嚟我哋 Server。個 Body 入面有兩個極度重要嘅 Parameters：`SAMLResponse` (Base64-encoded 嘅 XML) 同埋 `RelayState`。

### 致命威脅：XML 簽名包裝 (XML Signature Wrapping, XSW) 攻擊
如果你盲目咁 Parse 份 XML，搵到個 `<Assertion>` Node 出嚟，然後就抽出個 `NameID` 嚟用，你個系統就一定會中 XSW。黑客可以 Inject 一份假嘅、冇簽名嘅 `<Assertion>` 入份 Document 度，然後將原本嗰份真嘅、有簽名嘅 `<Assertion>` 搬去 XML Tree 嘅另一個位。如果你個 Parser 淨係識得搵「第一個」Assertion，而個 Verifier 就淨係 Check 個「有簽名」嘅 Assertion，黑客就可以成功 Account Takeover。

為咗防禦呢點，我哋必須依賴經過嚴格 Security audit 嘅 Library (例如 `@node-saml/node-saml`)，由佢哋去執行精確嘅規範化 (C14N) 同埋 Signature extraction。

```typescript
  async processCallback(
    providerConfig: IdpProviderConfig, 
    payload: any, 
    storedState: SsoStateContext
  ): Promise<any> {
    
    const samlClient = this.buildSamlClient(providerConfig);

    // 1. 驗證 RelayState (CSRF 防護)
    if (!payload.RelayState || payload.RelayState !== storedState.stateId) {
      // 注意：我哋個 SsoStateService 已經 Delete 咗個 state，所以絕對冇可能 Replay。
      throw new BadRequestException('無效嘅 RelayState。懷疑受到 CSRF 攻擊。');
    }

    // 2. 驗證並 Parse 份 SAML Response
    let profile: saml.Profile;
    try {
      // validatePostResponseAsync 已經包辦晒 XML Parsing, C14N, 同埋 Signature 驗證
      const { profile: extractedProfile } = await samlClient.validatePostResponseAsync({
        SAMLResponse: payload.SAMLResponse,
      });
      profile = extractedProfile;
    } catch (error) {
      throw new UnauthorizedException(`SAML 簽名驗證失敗: ${error.message}`);
    }

    // 3. 抽出核心嘅 Identifiers 同 Attributes
    // node-saml 會將 XML attributes 變做普通 JS object
    const normalizedPayload = {
      ...profile,
      _nameId: profile.nameID, 
      _sessionIndex: profile.sessionIndex, 
    };

    // 4. Save 低個 SessionIndex 留俾 Single Logout (SLO) 用
    if (profile.sessionIndex) {
      storedState.idpSessionId = profile.sessionIndex;
    } else {
      // 如果 IdP 廢到唔支援 SessionIndex，唯有 fallback 用 NameID 頂住先
      storedState.idpSessionId = profile.nameID;
    }

    return normalizedPayload;
  }
```

### 驗證規則拆解

1. **Certificate 信任模型**: 我哋用咗由 Database load 出嚟嘅 `cert` Array。當 IdP 嗰邊 Rotate (更換) 咗佢哋啲 Certificates，我哋第二集寫落嘅 Auto-Discovery service 就會 Update 個 DB。如果個 Signature 唔 Match 呢堆受信任嘅 X.509 certificates，個 Login 就會即刻被 Reject。
2. **規範化 (Canonicalization, C14N)**: XML 容許好多 Formatting 差異 (例如多咗個 Space、斷行、Attributes 調轉咗位)。喺 Check 個 Signature 之前，份 XML 必須要被 Normalize 做一個標準 Format。`node-saml` 會安全地幫我哋處理呢個 C14N 過程。
3. **Audience 限制**: XML 入面嘅 `<AudienceRestriction>` 必須要同我哋嘅 `spEntityId` 一模一樣。咁做可以防止黑客攞住一份原本俾第二個 Service Provider 嘅 Assertion 嚟我哋度 Replay。
4. **時間限制**: `<Conditions NotBefore="..." NotOnOrAfter="...">` Elements 寫死咗份 Assertion 嘅壽命。我哋個 Library 會自動 Check 呢兩條數，同時會容許好少好少嘅時鐘漂移 (Clock skew，通常 1-2 分鐘)。

---

## 3. 為單一登出 (Single Logout, SLO) 鋪路

OIDC 用 `sid` Claim，而 SAML 就用 `AuthnStatement` 入面嘅 `SessionIndex` Attribute 嚟去識別 IdP 嗰邊嘅特定 Login Session。

如果 IdP 之後想強制個 User 全局 Logout (IdP-Initiated Logout)，佢哋會掟一份 `<LogoutRequest>` 過嚟我哋 Server，入面就會有呢個 `SessionIndex`。

透過喺登入階段將 `profile.sessionIndex` Save 入去我哋嘅 `SsoStateContext`，我哋核心嘅 Session Management service 就可以將 Platform session 同 IdP session Map 埋一齊。我哋會喺第 6、7、8 集深入探討 Single Logout 嘅具體機制。

## 結語

喺第五集，我哋成功馴服咗 XML 呢隻上古巨獸。透過動態 Config 個 SAML Client、用 `RelayState` 防禦 CSRF，同埋運用身經百戰嘅 Library 去做 XML Signature Verification 同 C14N，我哋建立咗一個極度安全嘅 SAML 2.0 整合。我哋成功避開咗 XSW 漏洞，亦成功抽出咗企業級 Session 管理必備嘅 `SessionIndex`。

喺第六集，我哋會由「登入 (Login)」轉移陣地去「登出 (Logout)」。我哋會探討 **單一登出 (SLO)：SP 發起流程 (SP-Initiated Flows)**，詳細拆解點樣安全地炸毀 Local sessions，同埋點樣通知 Identity Provider 個用戶已經離開咗大廈。

<br><br><br>
